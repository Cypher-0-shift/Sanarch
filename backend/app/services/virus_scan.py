# app/services/virus_scan.py
import socket
import struct
import os
from app.config import settings
from app.logging_config import logger

CHUNK_SIZE = 4096  # 4KB chunks for large files

def scan_bytes(file_bytes: bytes) -> tuple[bool, str]:
    """
    Scans file bytes via ClamAV INSTREAM protocol.
    Returns (is_clean, reason).
    is_clean=True means file is safe to proceed.
    FAIL CLOSED: any error returns (False, reason) — never assume clean on error.
    """
    if os.environ.get("SKIP_VIRUS_SCAN", "").lower() == "true":
        logger.warning("Virus scan SKIPPED — SKIP_VIRUS_SCAN=true")
        return True, "skipped"
        
    if not settings.clamav_enabled:
        logger.info("ClamAV is disabled, skipping scan")
        return True, "skipped"

    sock = None
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(settings.clamd_timeout)  # CRITICAL: was missing
        sock.connect((settings.clamd_host, settings.clamd_port))

        # Send INSTREAM command
        sock.sendall(b"zINSTREAM\0")

        # Send file in chunks with 4-byte big-endian length prefix per chunk
        offset = 0
        while offset < len(file_bytes):
            chunk = file_bytes[offset:offset + CHUNK_SIZE]
            size_prefix = struct.pack("!I", len(chunk))
            sock.sendall(size_prefix + chunk)
            offset += len(chunk)

        # Send zero-length chunk to signal end of stream
        sock.sendall(struct.pack("!I", 0))

        # Read response
        response = b""
        while True:
            part = sock.recv(1024)
            if not part:
                break
            response += part
            if b"\0" in part:  # ClamAV terminates response with null byte
                break

        result = response.decode("utf-8", errors="replace").strip().rstrip("\0")
        logger.info(f"ClamAV scan result: {result}")

        if result.endswith("OK"):
            return True, "clean"
        elif "FOUND" in result:
            threat = result.split("FOUND")[0].strip()
            logger.warning(f"Malware detected: {threat}")
            return False, f"malware_detected:{threat}"
        else:
            logger.error(f"Unexpected ClamAV response: {result}")
            return False, f"unexpected_response:{result}"

    except socket.timeout:
        logger.error(f"ClamAV timeout after {settings.clamd_timeout}s")
        return False, "scan_timeout"
    except ConnectionRefusedError:
        logger.error(f"ClamAV connection refused at {settings.clamd_host}:{settings.clamd_port}")
        return False, "clamd_unavailable"
    except Exception as e:
        logger.error(f"ClamAV scan error: {e}", exc_info=True)
        return False, f"scan_error:{str(e)}"
    finally:
        if sock:
            try:
                sock.close()
            except Exception:
                pass