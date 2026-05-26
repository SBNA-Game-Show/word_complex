from services.retreive_all_fable_title import RetrieveAllFableTitle


def test_class_initialization():

    retriever = RetrieveAllFableTitle()

    assert retriever.data is not None
    assert isinstance(retriever.data, dict)


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


def test_only_unused_stories_returned():

    retriever = RetrieveAllFableTitle()

    result = retriever.return_all_stories()

    # all returned stories must be unused
    for story in result:
        assert story.get("used") is False