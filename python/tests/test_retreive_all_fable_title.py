from services.retreive_all_fable_title import RetrieveAllFableTitle


def test_class_initialization():

    retriever = RetrieveAllFableTitle()

    assert retriever.data is not None
    assert isinstance(retriever.data, dict)


def test_stories_are_loaded():

    retriever = RetrieveAllFableTitle()

    assert isinstance(retriever.stories, list)


def test_validate_story():

    retriever = RetrieveAllFableTitle()

    valid_story = {
        "storyNumber": "aesop01",
        "used": False
    }

    invalid_story = {
        "storyNumber": "aesop02",
        "used": True
    }

    assert retriever.validate_story(valid_story) is True
    assert retriever.validate_story(invalid_story) is False


def test_only_used_stories_returned():

    retriever = RetrieveAllFableTitle()

    for story in retriever.stories:
        assert story.get("used") is False