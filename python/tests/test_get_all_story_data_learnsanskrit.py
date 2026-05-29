
import json
import pytest
from unittest.mock import patch, MagicMock

from repository.get_all_tokenized_stories_learnsanskrit import (
    GetAllTokenizedStories
)


# =========================================================
# SUCCESS CASE
# =========================================================

def test_get_all_stories_success():

    mock_data = [
        {
            "_id": "1",
            "title": "Rabbit Story"
        }
    ]

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()
        mock_instance.read_file.return_value = mock_data

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        result = repo.get_all_stories()

        assert result == mock_data
        assert len(result) == 1
        assert result[0]["title"] == "Rabbit Story"


# =========================================================
# EMPTY LIST SHOULD STILL BE VALID
# =========================================================

def test_get_all_stories_empty_list():

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()
        mock_instance.read_file.return_value = []

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        result = repo.get_all_stories()

        assert result == []
        assert len(result) == 0


# =========================================================
# NONE RETURNED
# =========================================================

def test_get_all_stories_none_data():

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()
        mock_instance.read_file.return_value = None

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        with pytest.raises(ValueError) as exc_info:
            repo.get_all_stories()

        assert "Tokenized stories file is empty" in str(exc_info.value)


# =========================================================
# FILE NOT FOUND
# =========================================================

def test_get_all_stories_file_not_found():

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()

        mock_instance.read_file.side_effect = FileNotFoundError()

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        with pytest.raises(FileNotFoundError) as exc_info:
            repo.get_all_stories()

        assert "tokenized_stories.json not found" in str(exc_info.value)


# =========================================================
# INVALID JSON
# =========================================================

def test_get_all_stories_invalid_json():

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()

        mock_instance.read_file.side_effect = json.JSONDecodeError(
            "Invalid JSON",
            doc="",
            pos=0
        )

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        with pytest.raises(ValueError) as exc_info:
            repo.get_all_stories()

        assert "Invalid JSON format in tokenized stories file" in str(exc_info.value)


# =========================================================
# UNEXPECTED ERROR
# =========================================================

def test_get_all_stories_unexpected_exception():

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()

        mock_instance.read_file.side_effect = Exception("Unexpected Error")

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        with pytest.raises(Exception) as exc_info:
            repo.get_all_stories()

        assert "Unexpected Error" in str(exc_info.value)


# =========================================================
# VERIFY FILE NAME PASSED CORRECTLY
# =========================================================

def test_correct_file_name_used():

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()
        mock_instance.read_file.return_value = []

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        repo.get_all_stories()

        mock_reader.assert_called_once_with(
            "tokenized_stories.json"
        )


# =========================================================
# LARGE DATASET
# =========================================================

def test_large_dataset():

    mock_data = []

    for i in range(1000):
        mock_data.append({
            "_id": str(i),
            "title": f"Story {i}"
        })

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()
        mock_instance.read_file.return_value = mock_data

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        result = repo.get_all_stories()

        assert len(result) == 1000
        assert result[500]["title"] == "Story 500"


# =========================================================
# RETURN TYPE VALIDATION
# =========================================================

def test_return_type_is_list():

    mock_data = [
        {
            "_id": "1",
            "title": "Test"
        }
    ]

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()
        mock_instance.read_file.return_value = mock_data

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        result = repo.get_all_stories()

        assert isinstance(result, list)


# =========================================================
# STORY OBJECT STRUCTURE
# =========================================================

def test_story_contains_required_fields():

    mock_data = [
        {
            "_id": "1",
            "title": "Test Story"
        }
    ]

    with patch(
        "repository.get_all_tokenized_stories_learnsanskrit.FileSystemReader"
    ) as mock_reader:

        mock_instance = MagicMock()
        mock_instance.read_file.return_value = mock_data

        mock_reader.return_value = mock_instance

        repo = GetAllTokenizedStories()

        result = repo.get_all_stories()

        story = result[0]

        assert "_id" in story
        assert "title" in story

