import pytest
from unittest.mock import patch

from repository.get_stroy_data_by_id import GetStoryData


# =========================================================
# SUCCESS CASE
# =========================================================

def test_get_story_data_success():

    mock_data = [
        {
            "category": "Animals",
            "story_description": [
                {
                    "_id": "1",
                    "title": "Rabbit Story"
                },
                {
                    "_id": "2",
                    "title": "Lion Story"
                }
            ]
        }
    ]

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = mock_data

        repo = GetStoryData("1")

        assert repo.response is not None
        assert repo.response["_id"] == "1"
        assert repo.response["title"] == "Rabbit Story"


# =========================================================
# STORY NOT FOUND
# =========================================================

def test_story_not_found():

    mock_data = [
        {
            "category": "Animals",
            "story_description": [
                {
                    "_id": "1",
                    "title": "Rabbit Story"
                }
            ]
        }
    ]

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = mock_data

        repo = GetStoryData("999")

        assert repo.response is None


# =========================================================
# EMPTY FILE DATA
# =========================================================

def test_empty_file_data():

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = []

        repo = GetStoryData("1")

        assert repo.response is None


# =========================================================
# NONE FILE DATA
# =========================================================

def test_none_file_data():

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = None

        repo = GetStoryData("1")

        assert repo.response is None


# =========================================================
# EMPTY story_description
# =========================================================

def test_empty_story_description():

    mock_data = [
        {
            "category": "Animals",
            "story_description": []
        }
    ]

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = mock_data

        repo = GetStoryData("1")

        assert repo.response is None


# =========================================================
# MISSING story_description KEY
# =========================================================

def test_missing_story_description_key():

    mock_data = [
        {
            "category": "Animals"
        }
    ]

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = mock_data

        repo = GetStoryData("1")

        assert repo.response is None


# =========================================================
# MULTIPLE CATEGORIES
# =========================================================

def test_multiple_categories_story_found():

    mock_data = [
        {
            "category": "Animals",
            "story_description": [
                {
                    "_id": "1",
                    "title": "Rabbit Story"
                }
            ]
        },
        {
            "category": "Moral Stories",
            "story_description": [
                {
                    "_id": "2",
                    "title": "Wise King"
                }
            ]
        }
    ]

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = mock_data

        repo = GetStoryData("2")

        assert repo.response is not None
        assert repo.response["title"] == "Wise King"


# =========================================================
# DUPLICATE STORY IDS
# RETURNS FIRST MATCH
# =========================================================

def test_duplicate_story_ids():

    mock_data = [
        {
            "category": "Animals",
            "story_description": [
                {
                    "_id": "1",
                    "title": "First Story"
                }
            ]
        },
        {
            "category": "Other",
            "story_description": [
                {
                    "_id": "1",
                    "title": "Second Story"
                }
            ]
        }
    ]

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = mock_data

        repo = GetStoryData("1")

        assert repo.response["title"] == "First Story"


# =========================================================
# VERIFY FILE NAME
# =========================================================

def test_correct_file_name_used():

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = []

        GetStoryData("1")

        mock_reader.assert_called_once_with("stories_data.json")


# =========================================================
# VERIFY read_file CALLED ONCE
# =========================================================

def test_read_file_called_once():

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = []

        GetStoryData("1")

        mock_reader.return_value.read_file.assert_called_once()


# =========================================================
# LARGE DATASET
# =========================================================

def test_large_dataset():

    stories = []

    for i in range(1000):

        stories.append({
            "_id": str(i),
            "title": f"Story {i}"
        })

    mock_data = [
        {
            "category": "Large Category",
            "story_description": stories
        }
    ]

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.return_value = mock_data

        repo = GetStoryData("500")

        assert repo.response is not None
        assert repo.response["title"] == "Story 500"


# =========================================================
# FILE NOT FOUND ERROR
# =========================================================

def test_file_not_found_error():

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.side_effect = (
            FileNotFoundError("stories_data.json not found")
        )

        with pytest.raises(FileNotFoundError):

            GetStoryData("1")


# =========================================================
# INVALID JSON ERROR
# =========================================================

def test_invalid_json_error():

    with patch(
        "repository.get_stroy_data_by_id.FileSystemReader"
    ) as mock_reader:

        mock_reader.return_value.read_file.side_effect = (
            ValueError("Invalid JSON format")
        )

        with pytest.raises(ValueError):

            GetStoryData("1")

