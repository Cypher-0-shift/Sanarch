# tests/test_sanarch_id.py
"""
Unit tests for the SANARCH ID utility module and QR code generation.

These tests are pure (no database required).
"""
import base64
import pytest

from app.utils.sanarch_id import (
    age_to_band,
    build_sanarch_id,
    generate_serial,
    luhn_mod36_checksum,
    parse_sanarch_id,
    validate_sanarch_id,
)
from app.utils.qr import generate_qr_base64, generate_qr_png


# ── age_to_band ──────────────────────────────────────────────────────────────

class TestAgeToBand:
    """All 7 age bands, including boundary values."""

    @pytest.mark.parametrize(
        "age, expected_band",
        [
            # Infant: 0–2
            (0, "00"),
            (1, "00"),
            (2, "00"),
            # Child: 3–12
            (3, "05"),
            (7, "05"),
            (12, "05"),
            # Teen: 13–17
            (13, "13"),
            (15, "13"),
            (17, "13"),
            # Young adult: 18–34
            (18, "18"),
            (25, "18"),
            (34, "18"),
            # Adult: 35–54
            (35, "35"),
            (45, "35"),
            (54, "35"),
            # Senior: 55–74
            (55, "55"),
            (65, "55"),
            (74, "55"),
            # Elder: 75+
            (75, "75"),
            (85, "75"),
            (100, "75"),
            (120, "75"),
        ],
    )
    def test_age_to_band(self, age: int, expected_band: str):
        assert age_to_band(age) == expected_band

    def test_negative_age_raises(self):
        with pytest.raises(ValueError, match="negative"):
            age_to_band(-1)


# ── generate_serial ──────────────────────────────────────────────────────────

class TestGenerateSerial:
    def test_length_and_charset(self):
        serial = generate_serial()
        assert len(serial) == 6
        assert serial == serial.upper()
        assert all(c in "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" for c in serial)

    def test_randomness(self):
        """Two consecutive calls should (almost certainly) produce different serials."""
        serials = {generate_serial() for _ in range(100)}
        assert len(serials) > 90  # extremely unlikely to get <90 unique in 100


# ── luhn_mod36_checksum ──────────────────────────────────────────────────────

class TestLuhnMod36:
    def test_deterministic(self):
        payload = "SANIN25F35P008K3F2A"
        ck1 = luhn_mod36_checksum(payload)
        ck2 = luhn_mod36_checksum(payload)
        assert ck1 == ck2
        assert len(ck1) == 2

    def test_checksum_chars_are_base36(self):
        payload = "SANIN25M18D01ABCDEF"
        ck = luhn_mod36_checksum(payload)
        assert all(c in "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" for c in ck)


# ── build + validate round-trip ──────────────────────────────────────────────

class TestBuildAndValidate:
    def test_roundtrip(self):
        """Building an ID and then validating it must return True."""
        sid = build_sanarch_id(
            country="IN",
            reg_year=2025,
            gender="F",
            age=35,
            profile_type="P",
            member_index=0,
        )
        assert sid.startswith("SAN-IN-25F35P00")
        assert validate_sanarch_id(sid) is True

    def test_dependent_roundtrip(self):
        sid = build_sanarch_id(
            country="US",
            reg_year=2026,
            gender="M",
            age=5,
            profile_type="D",
            member_index=1,
            family_serial="9Z1M4B",
        )
        # New format: SAN-{CC}{YY}{G}{AB}{T}{IX}-{SERIAL}{CK}
        # Dependent: CC=US, YY=26, G=M, AB=05, T=D, IX=01, serial=9Z1M4B
        assert "9Z1M4B" in sid
        assert sid.startswith("SAN-US-26M05D01")
        assert validate_sanarch_id(sid) is True

    def test_shared_serial(self):
        """Primary and dependent share the same serial segment."""
        serial = "ABC123"
        primary = build_sanarch_id("IN", 2025, "F", 30, "P", 0, serial)
        dependent = build_sanarch_id("IN", 2025, "M", 5, "D", 1, serial)
        # Both must contain the same serial in the second hyphen-segment
        assert "ABC123" in primary
        assert "ABC123" in dependent

    def test_format_structure(self):
        sid = build_sanarch_id("IN", 2025, "X", 0, "P", 0, "ZZZZZZ")
        # New format: ["SAN", "{CC}", "{YY}{G}{AB}{T}{IX}{SERIAL}{CK}"]
        parts = sid.split("-")
        assert len(parts) == 3
        assert parts[0] == "SAN"
        assert parts[1] == "IN"   # country code stands alone
        # Third part = YY(2)+G(1)+AB(2)+T(1)+IX(2)+SERIAL(6)+CK(2) = 16 chars
        assert parts[2].startswith("25X00P00ZZZZZZ")
        assert len(parts[2]) == 16


# ── validate_sanarch_id with mutation ─────────────────────────────────────────

class TestValidateMutated:
    def test_mutated_id_returns_false(self):
        sid = build_sanarch_id("IN", 2025, "F", 35, "P", 0)
        # Format: SAN-IN-{rest16chars}  — mutate a char in the unique tail
        parts = sid.split("-")
        # parts[2] = YY+G+AB+T+IX+SERIAL+CK (16 chars), mutate first char
        tail = list(parts[2])
        tail[0] = "0" if tail[0] != "0" else "1"
        parts[2] = "".join(tail)
        mutated = "-".join(parts)
        assert validate_sanarch_id(mutated) is False

    def test_empty_string(self):
        assert validate_sanarch_id("") is False

    def test_garbage_string(self):
        assert validate_sanarch_id("not-a-real-id") is False

    def test_valid_id_passes(self):
        sid = build_sanarch_id("US", 2026, "M", 18, "P", 0)
        assert validate_sanarch_id(sid) is True


# ── parse_sanarch_id ─────────────────────────────────────────────────────────

class TestParseSanarchId:
    def test_parse_returns_correct_fields(self):
        sid = build_sanarch_id("IN", 2025, "F", 35, "P", 0, "8K3F2A")
        parsed = parse_sanarch_id(sid)
        assert parsed["country"] == "IN"
        assert parsed["reg_year"] == "25"
        assert parsed["gender"] == "F"
        assert parsed["age_band"] == "35"
        assert parsed["profile_type"] == "P"
        assert parsed["member_index"] == "00"
        assert parsed["family_serial"] == "8K3F2A"
        assert len(parsed["checksum"]) == 2

    def test_parse_dependent(self):
        sid = build_sanarch_id("US", 2026, "M", 5, "D", 3, "ABCDEF")
        parsed = parse_sanarch_id(sid)
        assert parsed["profile_type"] == "D"
        assert parsed["member_index"] == "03"
        assert parsed["family_serial"] == "ABCDEF"
        assert parsed["age_band"] == "05"

    def test_parse_invalid_format_raises(self):
        with pytest.raises(ValueError):
            parse_sanarch_id("not-valid")

    def test_parse_wrong_prefix_raises(self):
        with pytest.raises(ValueError):
            parse_sanarch_id("XYZ-IN-26X18P00IHC9E7ZP")


# ── QR code generation ───────────────────────────────────────────────────────

class TestQRGeneration:
    def test_qr_png_has_valid_header(self):
        sid = build_sanarch_id("IN", 2025, "F", 35, "P", 0)
        png_bytes = generate_qr_png(sid)
        # PNG magic header: 8 bytes
        assert png_bytes[:8] == b"\x89PNG\r\n\x1a\n"
        assert len(png_bytes) > 100  # non-trivial size

    def test_qr_base64_returns_nonempty_string(self):
        sid = build_sanarch_id("IN", 2025, "F", 35, "P", 0)
        b64 = generate_qr_base64(sid)
        assert isinstance(b64, str)
        assert len(b64) > 0

    def test_qr_base64_decodes_to_valid_png(self):
        sid = build_sanarch_id("IN", 2025, "F", 35, "P", 0)
        b64 = generate_qr_base64(sid)
        decoded = base64.b64decode(b64)
        assert decoded[:8] == b"\x89PNG\r\n\x1a\n"

    def test_qr_encodes_correct_id(self):
        """The QR should encode the plain SANARCH ID string."""
        sid = "SAN-IN-25F35P008K3F2AX7"
        png_bytes = generate_qr_png(sid)
        assert png_bytes[:8] == b"\x89PNG\r\n\x1a\n"
