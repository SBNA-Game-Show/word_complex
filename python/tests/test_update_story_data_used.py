import json
import os
import pytest

from repository.update_story_data_used import UpdateStoryDataUsedStatus


BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FILE_PATH = os.path.join(BASE_DIR, "data", "stories_data.json")


@pytest.fixture(autouse=True)
def reset_file():
    """
    Reset JSON before each test
    """

    with open(FILE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Reset all stories
    for category in data:
        for story in category.get("story_description", []):
            story["used"] = False
            story.pop("updatedOn", None)

    with open(FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    yield


def test_class_initialization():

    story_identifier = "aesop01"

    updater = UpdateStoryDataUsedStatus(story_identifier)

    assert updater.story_identifier == story_identifier
    assert updater.used is True


def test_execute_update():

    story_identifier = "aesop01"

    updater = UpdateStoryDataUsedStatus(story_identifier)

    result = updater.execute()

    assert result["success"] is True
    assert result["storyIdentifier"] == story_identifier
    assert result["used"] is True


def test_invalid_story():

    updater = UpdateStoryDataUsedStatus("invalid_story")

    result = updater.execute()

    assert result["success"] is False
    assert "not found" in result["message"]


def test_story_file_updated():

    story_identifier = "aesop01"

    updater = UpdateStoryDataUsedStatus(story_identifier)

    updater.execute()

    with open(FILE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated_story = None

    for category in data:
        for story in category.get("story_description", []):

            if (
                story.get("_id") == story_identifier
                or story.get("vendorId") == story_identifier
            ):
                updated_story = story
                break

    assert updated_story is not None
    assert updated_story["used"] is True
    assert "updatedOn" in updated_story