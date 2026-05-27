import json
import os
import pytest
from repository.upadate_story_data_used import UpdateStoryDataUsedStatus

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FILE_PATH = os.path.join(BASE_DIR, "data", "stories_data.json")


@pytest.fixture(autouse=True)
def reset_file():
    """Reset JSON before each test"""

    with open(FILE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # FIX: iterate list of categories
    for category in data:
        for story in category.get("story_description", []):
            story["used"] = False
            story.pop("updatedOn", None)

    with open(FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    yield


def test_class_initialization():
    story_name = "aesop01"

    updater = UpdateStoryDataUsedStatus(story_name)

    assert updater.storyName == story_name
    assert updater.result is not None


def test_execute_update():
    story_number = "aesop01"

    updater = UpdateStoryDataUsedStatus(story_number)

    result = updater.result

    assert result["success"] is True
    assert result["storyNumber"] == story_number
    assert result["used"] is True


def test_invalid_story():
    updater = UpdateStoryDataUsedStatus("invalid_story")

    result = updater.result

    assert result["success"] is False
    assert "not found" in result["message"]