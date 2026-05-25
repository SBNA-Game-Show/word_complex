from repository.upadate_story_data_used import UpdateStoryDataUsedStatus



from repository.upadate_story_data_used import UpdateStoryDataUsedStatus


def test_class_initialization():

    story_name = "aesop01"

    updater = UpdateStoryDataUsedStatus(story_name)

    assert updater.storyName == story_name
    assert updater.result is not None
    
def test_execute_update():

    story_Number = "aesop01"

    updater = UpdateStoryDataUsedStatus(story_Number)

    result = updater.result

    assert result["success"] is True
    assert result["storyNumber"] == story_Number
    assert result["used"] is True
    
def test_invalid_story():

    updater = UpdateStoryDataUsedStatus("invalid_story")

    result = updater.result

    assert result["success"] is False
    assert "not found" in result["message"]
        
