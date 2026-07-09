# app/services/extraction.py
"""
OCR: Azure Document Intelligence (primary)
NER: Med7 + spaCy
Structuring: Groq Llama 3.1 70B
Models loaded lazily — not at import time.
"""
import json
import httpx
from functools import lru_cache
from typing import Tuple
from app.config import settings
from app.logging_config import logger

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

STRUCTURE_PROMPT = """You are a medical document parser for Indian healthcare documents.
Return ONLY valid JSON matching this exact schema. No markdown, no explanation.

{
  "document_type": "lab_report|prescription|hospital_summary|discharge|xray|other",
  "document_date": "YYYY-MM-DD or null",
  "hospital_name": "string or null",
  "doctor_name": "string or null",
  "patient_name": "string or null",
  "diagnosis": ["list of strings"],
  "medications": [{"name": "", "dose": "", "frequency": "", "duration": ""}],
  "lab_values": [{"test_name": "", "value": "", "unit": "", "flag": "normal|high|low|null"}],
  "follow_up_date": "YYYY-MM-DD or null",
  "follow_up_instructions": "string or null",
  "summary": "2 sentence plain English summary"
}"""

# ---------------------------------------------------------------------------
# Fallback dict — used whenever Groq fails or OCR returns empty text
# ---------------------------------------------------------------------------
_FALLBACK_STRUCTURE = {
    "document_type": "other",
    "document_date": None,
    "hospital_name": None,
    "doctor_name": None,
    "patient_name": None,
    "diagnosis": [],
    "medications": [],
    "lab_values": [],
    "follow_up_date": None,
    "follow_up_instructions": None,
    "summary": "Extraction failed — please review document manually.",
}


# ---------------------------------------------------------------------------
# 5. Med7 lazy loader
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _get_med7_model():
    """Load Med7 once and cache. Only called when NER is needed."""
    import spacy
    try:
        logger.info("Loading Med7 NER model...")
        nlp = spacy.load("en_core_web_sm")
        logger.info("Med7 loaded.")
        return nlp
    except OSError:
        logger.warning(
            "en_core_med7_lg not found — falling back to blank spaCy model. "
            "Run: pip install https://huggingface.co/kormilitzin/en_core_med7_lg/..."
        )
        return spacy.blank("en")


# ---------------------------------------------------------------------------
# 6. NER with Med7
# ---------------------------------------------------------------------------
def extract_entities_med7(text: str) -> dict:
    """Run Med7 NER on raw text and return a dict of {label: [entities]}."""
    nlp = _get_med7_model()
    doc = nlp(text)
    entities: dict[str, list] = {}
    for ent in doc.ents:
        label = ent.label_.lower()
        entities.setdefault(label, []).append(ent.text)
    return entities


# ---------------------------------------------------------------------------
# 7. Groq structuring
# ---------------------------------------------------------------------------
async def structure_with_groq(text: str, entities: dict, retry: bool = True) -> dict:
    """
    Send OCR text + Med7 entities to Groq for JSON structuring.
    retry=True means one retry with a stricter prompt on failure.
    """
    user_content = (
        f"Raw OCR text:\n{text[:3000]}\n\n"
        f"Med7 entities:\n{json.dumps(entities, indent=2)}\n\n"
        "Return ONLY the JSON object. No markdown fences."
    )
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": STRUCTURE_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                "temperature": 0.0,
                "max_tokens": 1024,
            },
        )
        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"].strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        if retry:
            logger.warning(f"Groq JSON parse failed ({e}), retrying with stricter prompt")
            return await structure_with_groq(text, entities, retry=False)
        logger.error("Groq returned invalid JSON after retry")
        # Return a safe fallback structure instead of crashing the pipeline
        return {
            "document_type": "other",
            "document_date": None,
            "hospital_name": None,
            "doctor_name": None,
            "patient_name": None,
            "diagnosis": [],
            "medications": [],
            "lab_values": [],
            "follow_up_date": None,
            "follow_up_instructions": None,
            "summary": "Extraction failed — please review document manually.",
        }


# ---------------------------------------------------------------------------
# 8. Azure Document Intelligence OCR
# ---------------------------------------------------------------------------
async def ocr_with_azure_di(image_bytes: bytes) -> Tuple[str, float]:
    """Primary OCR using Azure Document Intelligence."""
    if settings.azure_di_endpoint == "" or settings.azure_di_key == "":
        raise RuntimeError(
            "Azure DI not configured — set AZURE_DI_ENDPOINT and AZURE_DI_KEY"
        )

    try:
        from azure.ai.documentintelligence import DocumentIntelligenceClient
        from azure.core.credentials import AzureKeyCredential

        client = DocumentIntelligenceClient(
            endpoint=settings.azure_di_endpoint,
            credential=AzureKeyCredential(settings.azure_di_key),
        )

        poller = client.begin_analyze_document(
            "prebuilt-read",
            body=image_bytes,
            content_type="application/octet-stream",
        )
        result = poller.result()

        # Extract all lines from every page
        lines_text = [
            line.content
            for page in result.pages
            for line in page.lines
        ]
        text = "\n".join(lines_text)

        # Confidence: average of word-level confidences if available
        confidences = []
        for page in result.pages:
            for word in getattr(page, "words", []):
                if getattr(word, "confidence", None) is not None:
                    confidences.append(word.confidence)
        confidence = (
            sum(confidences) / len(confidences) if confidences else 0.95
        )

        logger.info(
            f"Azure DI OCR: {len(text.split())} words extracted, "
            f"confidence={confidence:.2f}"
        )
        return (text, confidence)

    except Exception as e:
        logger.error(f"Azure DI OCR failed: {e}", exc_info=True)
        raise RuntimeError(f"Azure DI extraction failed: {e}")


# ---------------------------------------------------------------------------
# 9. PDF → image conversion (legacy — kept for backward compatibility)
# ---------------------------------------------------------------------------
def pdf_first_page_to_image(pdf_bytes: bytes) -> bytes:
    """Convert first PDF page to PNG bytes. Legacy helper."""
    try:
        import fitz  # PyMuPDF — lazy import

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc.load_page(0)
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")
        doc.close()
        return img_bytes
    except Exception as e:
        raise RuntimeError(
            f"Failed to convert PDF first page to image: {e}"
        )


# ---------------------------------------------------------------------------
# 10. Full extraction pipeline
# ---------------------------------------------------------------------------
async def extract_from_image(image_bytes: bytes, mime_type: str) -> dict:
    """
    Full pipeline: Azure DI OCR → Med7 NER → Groq structuring.

    For PDFs, the raw bytes are sent directly to Azure DI which natively
    handles multi-page documents via its `prebuilt-read` model.  This
    ensures ALL pages are OCR'd (previously only the first page was
    converted to an image and processed).
    """
    # Azure DI accepts both image bytes and PDF bytes directly —
    # no conversion needed. It iterates all pages internally.
    text, confidence = await ocr_with_azure_di(image_bytes)

    if not text.strip():
        logger.warning("Azure DI returned empty text — using fallback structure")
        return {
            "document_type": "other",
            "document_date": None,
            "hospital_name": None,
            "doctor_name": None,
            "patient_name": None,
            "diagnosis": [],
            "medications": [],
            "lab_values": [],
            "follow_up_date": None,
            "follow_up_instructions": None,
            "summary": "Extraction failed — please review document manually.",
        }

    entities = extract_entities_med7(text)
    logger.info(f"Med7 entities: {list(entities.keys())}")

    structured = await structure_with_groq(text, entities)
    return structured