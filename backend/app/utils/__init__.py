# app/utils — pure utility functions (no DB dependencies)

import re

def sanitize_string(value: str, max_length: int = 200) -> str:
    """Strip control characters and limit length."""
    if not value:
        return value
    # Remove control characters (keep printable + common unicode)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', value)
    return cleaned.strip()[:max_length]

def sanitize_filename(filename: str) -> str:
    """Safe filename — alphanumeric, dash, underscore, dot only."""
    cleaned = re.sub(r'[^\w\-.]', '_', filename)
    return cleaned[:100]
