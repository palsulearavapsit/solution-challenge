import pytest

from src.ai_extractor import _local_extract, extract_need


class TestLocalExtract:
    def test_detects_food_need(self):
        result = _local_extract("People need food and meals in Dharavi")
        assert result["need_type"] == "Food Distribution"

    def test_detects_medical_need(self):
        result = _local_extract("Medical attention required for patients")
        assert result["need_type"] == "Medical Camp"

    def test_detects_water_sanitation(self):
        result = _local_extract("Water supply and sanitation problem in the colony")
        assert result["need_type"] == "Sanitation Drive"

    def test_detects_education_need(self):
        result = _local_extract("Schools closed, children need education support")
        assert result["need_type"] == "Education Support"

    def test_detects_shelter_need(self):
        result = _local_extract("Displaced families need shelter after flood")
        assert result["need_type"] == "Shelter Assistance"

    def test_detects_critical_urgency(self):
        result = _local_extract("This is an emergency — immediate help needed")
        assert result["urgency"] == "Critical"

    def test_detects_low_urgency(self):
        result = _local_extract("Minor repairs needed whenever convenient")
        assert result["urgency"] == "Low"

    def test_extracts_area_from_sentence(self):
        result = _local_extract("Food needed in Kurla due to flooding")
        assert "Kurla" in result["area"]

    def test_falls_back_to_mumbai_when_no_area(self):
        result = _local_extract("urgent food needed")
        assert result["area"] == "Mumbai"

    def test_returns_all_required_keys(self):
        result = _local_extract("anything")
        assert "area" in result
        assert "need_type" in result
        assert "urgency" in result


class TestExtractNeed:
    def test_without_api_key_uses_local(self):
        result = extract_need("Urgent medical help needed in Andheri", api_key=None)
        assert result["need_type"] == "Medical Camp"
        assert result["urgency"] == "Critical"

    def test_returns_dict_with_required_keys(self):
        result = extract_need("some description")
        assert isinstance(result, dict)
        assert all(k in result for k in ("area", "need_type", "urgency"))
