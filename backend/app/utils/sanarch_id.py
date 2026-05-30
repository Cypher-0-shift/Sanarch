# app/utils/sanarch_id.py
"""
SANARCH ID generation, validation, and parsing utilities.

Format: SAN-{CC}-{YY}-{G}-{AB}-{T}-{IX}-{SERIAL}-{CK}
Example: SAN-IN-25-F-35-P-00-8K3F2A-X7

All functions are pure — no database dependencies.
"""
import random
import string

# ── Base-36 character set (0-9, A-Z) ──────────────────────────────────────────
_BASE36_CHARS = string.digits + string.ascii_uppercase  # "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
_BASE36_MAP: dict[str, int] = {c: i for i, c in enumerate(_BASE36_CHARS)}


# ── Age bands ─────────────────────────────────────────────────────────────────
_AGE_BANDS: list[tuple[int, str]] = [
    (75, "75"),  # elder   75+
    (55, "55"),  # senior  55–74
    (35, "35"),  # adult   35–54
    (18, "18"),  # young adult 18–34
    (13, "13"),  # teen    13–17
    (3,  "05"),  # child   3–12
    (0,  "00"),  # infant  0–2
]


def age_to_band(age: int) -> str:
    """
    Map a patient's age to the 2-digit age-band code.

    >>> age_to_band(0)
    '00'
    >>> age_to_band(35)
    '35'
    >>> age_to_band(80)
    '75'
    """
    if age < 0:
        raise ValueError(f"Age cannot be negative: {age}")
    for lower_bound, band in _AGE_BANDS:
        if age >= lower_bound:
            return band
    # Should never happen given age >= 0, but guard anyway
    return "00"


def generate_serial() -> str:
    """
    Return a random 6-character uppercase base-36 string (0-9, A-Z).

    Used as the family-linking serial shared across primary + dependents.
    """
    return "".join(random.choices(_BASE36_CHARS, k=6))


def luhn_mod36_checksum(payload: str) -> str:
    """
    Compute a 2-character Luhn mod-36 checksum over *payload*.

    The payload should have **all dashes stripped** before calling.
    Returns a 2-char uppercase base-36 string.

    Algorithm (per ISO/IEC 7812 adapted to mod-36):
      1. Walk the payload right-to-left.
      2. Every second digit (starting from the rightmost) is doubled.
         If doubled value >= 36, subtract 36 and add 1
         (equivalent to: sum of "digits" in base-36).
      3. Sum all values.
      4. check_digit = (36 - (sum % 36)) % 36
      5. Repeat the process once more to get a second check character
         by appending the first check character to the payload.
    """
    def _single_luhn(chars: str) -> int:
        total = 0
        for i, ch in enumerate(reversed(chars)):
            val = _BASE36_MAP[ch]
            if i % 2 == 0:
                # "odd" position from the right (0-indexed) — double it
                val *= 2
                if val >= 36:
                    val = val - 36 + 1
            total += val
        return (36 - (total % 36)) % 36

    payload = payload.upper()
    first = _single_luhn(payload)
    second = _single_luhn(payload + _BASE36_CHARS[first])
    return _BASE36_CHARS[first] + _BASE36_CHARS[second]


def build_sanarch_id(
    country: str,
    reg_year: int,
    gender: str,
    age: int,
    profile_type: str,
    member_index: int,
    family_serial: str | None = None,
) -> str:
    """
    Assemble a complete SANARCH ID string with dashes and checksum.

    Parameters
    ----------
    country : str         ISO 3166-1 alpha-2 (e.g. "IN")
    reg_year : int        Full or 2-digit year (e.g. 2025 or 25)
    gender : str          "M", "F", or "X"
    age : int             Patient's age at registration
    profile_type : str    "P" (primary) or "D" (dependent)
    member_index : int    0 for primary, 1+ for dependents
    family_serial : str   Optional. If None, a new serial is generated.

    Returns
    -------
    str   Formatted ID, e.g. "SAN-IN-25-F-35-P-00-8K3F2A-X7"
    """
    cc = country.upper()[:2]
    yy = f"{reg_year % 100:02d}"
    g = gender.upper()
    band = age_to_band(age)
    t = profile_type.upper()
    ix = f"{member_index:02d}"
    serial = (family_serial or generate_serial()).upper()

    # Payload = everything except the checksum, dashes stripped
    payload = f"SAN{cc}{yy}{g}{band}{t}{ix}{serial}"
    ck = luhn_mod36_checksum(payload)

    return f"SAN-{cc}-{yy}-{g}-{band}-{t}-{ix}-{serial}-{ck}"


def validate_sanarch_id(sanarch_id: str) -> bool:
    """
    Validate a SANARCH ID by re-computing its Luhn mod-36 checksum.

    Returns True if the last 2 characters match the computed checksum.
    """
    stripped = sanarch_id.upper().replace("-", "")
    if len(stripped) < 3:
        return False
    payload = stripped[:-2]
    expected_ck = stripped[-2:]
    return luhn_mod36_checksum(payload) == expected_ck


def parse_sanarch_id(sanarch_id: str) -> dict[str, str]:
    """
    Parse a SANARCH ID string into its component segments.

    Returns a dict with keys:
      country, reg_year, gender, age_band, profile_type,
      member_index, family_serial, checksum

    Raises ValueError if the format cannot be parsed.
    """
    parts = sanarch_id.upper().split("-")
    if len(parts) != 9 or parts[0] != "SAN":
        raise ValueError(f"Invalid SANARCH ID format: {sanarch_id}")

    return {
        "country": parts[1],
        "reg_year": parts[2],
        "gender": parts[3],
        "age_band": parts[4],
        "profile_type": parts[5],
        "member_index": parts[6],
        "family_serial": parts[7],
        "checksum": parts[8],
    }
