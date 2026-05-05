# tests/test_extraction.py
import pytest
import json
from unittest.mock import patch, AsyncMock, MagicMock

class TestStructureWithGroq:

    @pytest.mark.asyncio
    async def test_returns_valid_dict_on_success(self):
        mock_response = {
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "document_type": "lab_report",
                        "document_date": "2026-01-15",
                        "hospital_name": "City General",
                        "doctor_name": "Dr. Patel",
                        "patient_name": "John Doe",
                        "diagnosis": ["Hypertension"],
                        "medications": [{"name": "Amlodipine", "dose": "5mg",
                                         "frequency": "once daily", "duration": "30 days"}],
                        "lab_values": [],
                        "follow_up_date": None,
                        "follow_up_instructions": None,
                        "summary": "Routine checkup. Blood pressure elevated.",
                    })
                }
            }]
        }
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_resp_obj = MagicMock()
            mock_resp_obj.json.return_value = mock_response
            mock_resp_obj.raise_for_status = MagicMock()
            mock_post.return_value = mock_resp_obj
            from app.services.extraction import structure_with_groq
            result = await structure_with_groq("raw ocr text", {"drug": ["Amlodipine"]})
        assert result["document_type"] == "lab_report"
        assert result["hospital_name"] == "City General"
        assert len(result["medications"]) == 1

    @pytest.mark.asyncio
    async def test_returns_fallback_on_invalid_json(self):
        mock_response = {
            "choices": [{"message": {"content": "not valid json at all {{"}}]
        }
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_resp_obj = MagicMock()
            mock_resp_obj.json.return_value = mock_response
            mock_resp_obj.raise_for_status = MagicMock()
            mock_post.return_value = mock_resp_obj
            from app.services.extraction import structure_with_groq
            # Should NOT raise — should return fallback dict
            result = await structure_with_groq("text", {}, retry=False)
        assert result["document_type"] == "other"
        assert "manually" in result["summary"]

    @pytest.mark.asyncio
    async def test_strips_markdown_fences(self):
        content = '```json\n{"document_type": "prescription", "diagnosis": [], "medications": [], "lab_values": [], "document_date": null, "hospital_name": null, "doctor_name": null, "patient_name": null, "follow_up_date": null, "follow_up_instructions": null, "summary": "test"}\n```'
        mock_response = {"choices": [{"message": {"content": content}}]}
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_resp_obj = MagicMock()
            mock_resp_obj.json.return_value = mock_response
            mock_resp_obj.raise_for_status = MagicMock()
            mock_post.return_value = mock_resp_obj
            from app.services.extraction import structure_with_groq
            result = await structure_with_groq("text", {})
        assert result["document_type"] == "prescription"


class TestExtractEntitiesMed7:

    def test_returns_empty_dict_on_blank_model(self):
        from app.services.extraction import extract_entities_med7
        # blank spaCy model returns no entities — should not crash
        result = extract_entities_med7("Patient was given Metformin 500mg twice daily")
        assert isinstance(result, dict)