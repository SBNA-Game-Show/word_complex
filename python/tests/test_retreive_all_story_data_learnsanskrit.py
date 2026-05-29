import pytest
from unittest.mock import patch

from services.retrieve_all_story_data_learnsanskrit import RetrieveAllStoryDataLearnSanskrit


# =========================================================
# SUCCESS CASE
# =========================================================

def test_retrieve_all_success():

    mock_data = [
        {
            "_id": "1",
            "title": "Rabbit Story"
        }
    ]

    with patch(
        "services.retrieve_all_story_data_learnsanskrit.GetAllStoryDataLearnSanskrit"
    ) as mock_repo:

        mock_repo.return_value.get_all_story_data.return_value = mock_data

        service = RetrieveAllStoryDataLearnSanskrit()

        result = service.retrieve_all()

        assert result["success"] is True
        assert result["data"] == mock_data
        assert len(result["data"]) == 1
        assert result["data"][0]["title"] == "Rabbit Story"


# =========================================================
# EMPTY LIST
# =========================================================

def test_retrieve_all_empty_list():

    with patch(
        "services.retrieve_all_story_data_learnsanskrit.GetAllStoryDataLearnSanskrit"
    ) as mock_repo:

        mock_repo.return_value.get_all_story_data.return_value = []

        service = RetrieveAllStoryDataLearnSanskrit()

        result = service.retrieve_all()

        assert result["success"] is True
        assert result["data"] == []
        assert len(result["data"]) == 0


# =========================================================
# NONE RESPONSE
# =========================================================

def test_retrieve_all_none_response():

    with patch(
        "services.retrieve_all_story_data_learnsanskrit.GetAllStoryDataLearnSanskrit"
    ) as mock_repo:

        mock_repo.return_value.get_all_story_data.return_value = None

        service = RetrieveAllStoryDataLearnSanskrit()

        result = service.retrieve_all()

        assert result["success"] is True
        assert result["data"] is None


# =========================================================
# FILE NOT FOUND
# =========================================================

def test_retrieve_all_file_not_found():

    with patch(
        "services.retrieve_all_story_data_learnsanskrit.GetAllStoryDataLearnSanskrit"
    ) as mock_repo:

        mock_repo.return_value.get_all_story_data.side_effect = (
            FileNotFoundError("stories_data.json not found")
        )

        service = RetrieveAllStoryDataLearnSanskrit()

        result = service.retrieve_all()

        assert result["success"] is False
        assert "not found" in result["message"]


# =========================================================
# INVALID JSON
# =========================================================

def test_retrieve_all_invalid_json():

    with patch(
        "services.retrieve_all_story_data_learnsanskrit.GetAllStoryDataLearnSanskrit"
    ) as mock_repo:

        mock_repo.return_value.get_all_story_data.side_effect = (
            ValueError("Invalid JSON format")
        )

        service = RetrieveAllStoryDataLearnSanskrit()

        result = service.retrieve_all()

        assert result["success"] is False
        assert "Invalid JSON format" in result["message"]


# =========================================================
# GENERIC EXCEPTION
# =========================================================

def test_retrieve_all_generic_exception():

    with patch(
        "services.retrieve_all_story_data_learnsanskrit.GetAllStoryDataLearnSanskrit"
    ) as mock_repo:

        mock_repo.return_value.get_all_story_data.side_effect = (
            Exception("Unexpected Error")
        )

        service = RetrieveAllStoryDataLearnSanskrit()

        result = service.retrieve_all()

        assert result["success"] is False
        assert result["message"] == "Unexpected Error"


# =========================================================
# RESPONSE STRUCTURE
# =========================================================

def test_retrieve_all_response_structure():

    mock_data = [
        {
            "_id": "100",
            "title": "Lion Story"
        }
    ]

    with patch(
        "services.retrieve_all_story_data_learnsanskrit.GetAllStoryDataLearnSanskrit"
    ) as mock_repo:

        mock_repo.return_value.get_all_story_data.return_value = mock_data

        service = RetrieveAllStoryDataLearnSanskrit()

        result = service.retrieve_all()

        assert isinstance(result, dict)
        assert "success" in result
        assert "data" in result


# =========================================================
# VERIFY REPOSITORY METHOD CALLED
# =========================================================

def test_repository_method_called_once():

    with patch(
        "services.retrieve_all_story_data_learnsanskrit.GetAllStoryDataLearnSanskrit"
    ) as mock_repo:

        mock_repo.return_value.get_all_story_data.return_value = []

        service = RetrieveAllStoryDataLearnSanskrit()

        service.retrieve_all()

        mock_repo.return_value.get_all_story_data.assert_called_once()


# =========================================================
# LARGE DATASET
# =========================================================

def test_retrieve_large_dataset():

    mock_data = []

    for i in range(1000):
        mock_data.append({
            "_id": str(i),
            "title": f"Story {i}"
        })

    with patch(
        "services.retrieve_all_story_data_learnsanskrit.GetAllStoryDataLearnSanskrit"
    ) as mock_repo:

        mock_repo.return_value.get_all_story_data.return_value = mock_data

        service = RetrieveAllStoryDataLearnSanskrit()

        result = service.retrieve_all()

        assert result["success"] is True
        assert len(result["data"]) == 1000
        assert result["data"][500]["title"] == "Story 500"