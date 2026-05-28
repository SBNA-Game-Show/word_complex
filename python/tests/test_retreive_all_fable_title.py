from services.retreive_all_fable_title import RetrieveAllFableTitle
from unittest.mock import patch

@patch.object(RetrieveAllFableTitle, "read_data")
def test_class_initialization(mock_read_data):

    mock_read_data.return_value = []

    retriever = RetrieveAllFableTitle()

    assert retriever.data is not None
    assert isinstance(retriever.data, list)


def test_validate_story():
    retriever = RetrieveAllFableTitle()

    valid_story = {
        "vendorId": "aesop01",
        "used": False
    }

    invalid_story = {
        "vendorId": "aesop02",
        "used": True
    }

    assert retriever.validate_story(valid_story) is True
    assert retriever.validate_story(invalid_story) is False

@patch.object(RetrieveAllFableTitle, "read_data")
def test_only_unused_stories_returned(mock_read_data):

    mock_read_data.return_value = [
        {
            "story_description": [
                {"vendorId": "1", "used": False},
                {"vendorId": "2", "used": True},
                {"vendorId": "3", "used": False}
            ]
        }
    ]

    retriever = RetrieveAllFableTitle()

    result = retriever.return_all_stories()

    for story in result:
        assert story.get("used") is False

# test cases (Sabahat)
def test_return_empty_when_no_data(monkeypatch):

    retriever = RetrieveAllFableTitle()

    retriever.data = []

    result = retriever.return_all_stories()

    assert result == []
def test_empty_story_description():

    retriever = RetrieveAllFableTitle()

    retriever.data = [
        {
            "story_description": []
        }
    ]

    result = retriever.return_all_stories()

    assert result == []

def test_story_missing_used_key():

    retriever = RetrieveAllFableTitle()

    retriever.data = [
        {
            "story_description": [
                {
                    "vendorId": "aesop01"
                }
            ]
        }
    ]

    result = retriever.return_all_stories()

    assert result == []
def test_invalid_story_description_type():

    retriever = RetrieveAllFableTitle()

    retriever.data = [
        {
            "story_description": None
        }
    ]

    try:
        retriever.return_all_stories()
    except TypeError:
        assert True
def test_multiple_categories():

    retriever = RetrieveAllFableTitle()

    retriever.data = [
        {
            "story_description": [
                {"vendorId": "1", "used": False}
            ]
        },
        {
            "story_description": [
                {"vendorId": "2", "used": False}
            ]
        }
    ]

    result = retriever.return_all_stories()

    assert len(result) == 2

def test_missing_story_description_key():

    retriever = RetrieveAllFableTitle()

    retriever.data = [
        {
            "category": "Animals"
        }
    ]

    result = retriever.return_all_stories()

    assert result == []
def test_all_stories_used():

    retriever = RetrieveAllFableTitle()

    retriever.data = [
        {
            "story_description": [
                {"vendorId": "1", "used": True},
                {"vendorId": "2", "used": True}
            ]
        }
    ]

    result = retriever.return_all_stories()

    assert result == []