# tests/test_virus_scan.py
import pytest
from unittest.mock import patch, MagicMock
import socket
from app.services.virus_scan import scan_bytes

EICAR = (
    b"X5O!P%@AP[4\\PZX54(P^)7CC)7}"
    b"$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
)

class TestScanBytes:

    def test_clean_file_returns_true(self):
        mock_sock = MagicMock()
        mock_sock.recv.side_effect = [b"stream: OK\0", b""]
        with patch("socket.socket") as mock_socket_class:
            mock_socket_class.return_value = mock_sock
            is_clean, reason = scan_bytes(b"clean file content")
        assert is_clean is True
        assert reason == "clean"

    def test_infected_file_returns_false(self):
        mock_sock = MagicMock()
        mock_sock.recv.side_effect = [b"stream: Eicar-Test-Signature FOUND\0", b""]
        with patch("socket.socket") as mock_socket_class:
            mock_socket_class.return_value = mock_sock
            is_clean, reason = scan_bytes(EICAR)
        assert is_clean is False
        assert "malware_detected" in reason

    def test_clamd_timeout_returns_false(self):
        mock_sock = MagicMock()
        mock_sock.connect.side_effect = socket.timeout("timed out")
        with patch("socket.socket") as mock_socket_class:
            mock_socket_class.return_value = mock_sock
            is_clean, reason = scan_bytes(b"any content")
        assert is_clean is False
        assert "timeout" in reason

    def test_clamd_unreachable_returns_false(self):
        mock_sock = MagicMock()
        mock_sock.connect.side_effect = ConnectionRefusedError()
        with patch("socket.socket") as mock_socket_class:
            mock_socket_class.return_value = mock_sock
            is_clean, reason = scan_bytes(b"any content")
        assert is_clean is False
        assert "unavailable" in reason

    def test_empty_file_scanned(self):
        mock_sock = MagicMock()
        mock_sock.recv.side_effect = [b"stream: OK\0", b""]
        with patch("socket.socket") as mock_socket_class:
            mock_socket_class.return_value = mock_sock
            is_clean, reason = scan_bytes(b"")
        assert is_clean is True

    def test_large_file_chunked(self):
        # 10MB file — verifies chunked sending doesn't crash
        large_file = b"A" * (10 * 1024 * 1024)
        mock_sock = MagicMock()
        mock_sock.recv.side_effect = [b"stream: OK\0", b""]
        with patch("socket.socket") as mock_socket_class:
            mock_socket_class.return_value = mock_sock
            is_clean, reason = scan_bytes(large_file)
        assert is_clean is True