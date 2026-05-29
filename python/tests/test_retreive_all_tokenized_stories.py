import pytest
from unittest.mock import patch

from services.retrieve_all_tokenized_stories import RetrieveTokenizedStories


def test_get_all_success():

    mock_data = [
        {
            "_id": "1",
            "title": "Rabbit Story"
        }
    ]

    with patch(
        "services.retrieve_all_tokenized_stories.GetAllTokenizedStories"
    ) as mock_repo:

        mock_repo.return_value.get_all_stories.return_value = mock_data

        service = RetrieveTokenizedStories()

        result = service.get_all()

        assert result["success"] is True
        assert result["data"] == mock_data
        assert len(result["data"]) == 1


def test_get_all_empty_data():

    with patch(
        "services.retrieve_all_tokenized_stories.GetAllTokenizedStories"
    ) as mock_repo:

        mock_repo.return_value.get_all_stories.return_value = []

        service = RetrieveTokenizedStories()

        result = service.get_all()

        assert result["success"] is True
        assert result["data"] == []


def test_get_all_file_not_found():

    with patch(
        "services.retrieve_all_tokenized_stories.GetAllTokenizedStories"
    ) as mock_repo:

        mock_repo.return_value.get_all_stories.side_effect = (
            FileNotFoundError("tokenized_stories.json not found")
        )

        service = RetrieveTokenizedStories()

        result = service.get_all()

        assert result["success"] is False
        assert "not found" in result["message"]


def test_get_all_invalid_json():

    with patch(
        "services.retrieve_all_tokenized_stories.GetAllTokenizedStories"
    ) as mock_repo:

        mock_repo.return_value.get_all_stories.side_effect = (
            ValueError("Invalid JSON format")
        )

        service = RetrieveTokenizedStories()

        result = service.get_all()

        assert result["success"] is False
        assert "Invalid JSON" in result["message"]


def test_get_all_unexpected_exception():

    with patch(
        "services.retrieve_all_tokenized_stories.GetAllTokenizedStories"
    ) as mock_repo:

        mock_repo.return_value.get_all_stories.side_effect = (
            Exception("Unexpected Error")
        )

        service = RetrieveTokenizedStories()

        result = service.get_all()

        assert result["success"] is False
        assert result["message"] == "Unexpected Error"