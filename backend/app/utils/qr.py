# app/utils/qr.py
"""
QR code generation for SANARCH IDs.

Encodes the plain ID string (no JSON, no URL wrapping) into a QR code.
"""
import base64
import io
import qrcode
from qrcode.constants import ERROR_CORRECT_M


def generate_qr_png(sanarch_id: str) -> bytes:
    """
    Generate a QR code PNG image for the given SANARCH ID.

    QR settings:
      version  = None (auto-detect smallest version)
      error_correction = ERROR_CORRECT_M (~15% recovery)
      box_size = 8 pixels per module
      border   = 2 modules

    Returns raw PNG bytes.
    """
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(sanarch_id)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_qr_base64(sanarch_id: str) -> str:
    """
    Generate a QR code and return it as a raw base64-encoded string.

    No data-URI prefix — the consumer is responsible for prepending
    ``data:image/png;base64,`` if needed.
    """
    png_bytes = generate_qr_png(sanarch_id)
    return base64.b64encode(png_bytes).decode("ascii")
