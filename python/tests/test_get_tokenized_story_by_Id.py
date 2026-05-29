from unittest.mock import patch

from repository.get_tokenized_story_by_Id import GetTokenizedStoryById


class TestGetTokenizedStoryById:

    @patch(
        "repository.get_tokenized_story_by_Id.FileSystemReader"
    )
    def test_returns_matching_story(self, mock_reader):

        mock_reader.return_value.read_file.return_value = [
            {"_id": "1", "title": "Story One"},
            {"_id": "2", "title": "Story Two"},
        ]

        service = GetTokenizedStoryById("2")

        result = service.retrieve_story()

        assert result == {
            "_id": "2",
            "title": "Story Two",
        }

    @patch(
        "repository.get_tokenized_story_by_Id.FileSystemReader"
    )
    def test_returns_none_when_data_is_none(self, mock_reader):

        mock_reader.return_value.read_file.return_value = None

        service = GetTokenizedStoryById("1")

        result = service.retrieve_story()

        assert result is None

    @patch(
        "repository.get_tokenized_story_by_Id.FileSystemReader"
    )
    def test_returns_none_when_data_is_empty_list(self, mock_reader):

        mock_reader.return_value.read_file.return_value = []

        service = GetTokenizedStoryById("1")

        result = service.retrieve_story()

        assert result is None

    @patch(
        "repository.get_tokenized_story_by_Id.FileSystemReader"
    )
    def test_returns_none_when_story_not_found(self, mock_reader):

        mock_reader.return_value.read_file.return_value = [
            {"_id": "1", "title": "Story One"},
            {"_id": "2", "title": "Story Two"},
        ]

        service = GetTokenizedStoryById("3")

        result = service.retrieve_story()

        assert result is None

    @patch(
        "repository.get_tokenized_story_by_Id.FileSystemReader"
    )
    def test_skips_non_dict_items(self, mock_reader):

        mock_reader.return_value.read_file.return_value = [
            "invalid",
            123,
            ["list"],
            {"_id": "5", "title": "Valid Story"},
        ]

        service = GetTokenizedStoryById("5")

        result = service.retrieve_story()

        assert result == {
            "_id": "5",
            "title": "Valid Story",
        }

    @patch(
        "repository.get_tokenized_story_by_Id.FileSystemReader"
    )
    def test_returns_none_when_all_items_are_invalid(self, mock_reader):

        mock_reader.return_value.read_file.return_value = [
            "invalid",
            123,
            ["list"],
        ]

        service = GetTokenizedStoryById("1")

        result = service.retrieve_story()

        assert result is None

    @patch(
        "repository.get_tokenized_story_by_Id.FileSystemReader"
    )
    def test_handles_missing_id_key(self, mock_reader):

        mock_reader.return_value.read_file.return_value = [
            {"title": "Missing ID"},
            {"_id": "2", "title": "Valid Story"},
        ]

        service = GetTokenizedStoryById("2")

        result = service.retrieve_story()

        assert result == {
            "_id": "2",
            "title": "Valid Story",
        }

    @patch(
        "repository.get_tokenized_story_by_Id.FileSystemReader"
    )
    def test_read_file_called_once(self, mock_reader):

        mock_reader.return_value.read_file.return_value = []

        GetTokenizedStoryById("1")

        mock_reader.return_value.read_file.assert_called_once()

    @patch(
        "repository.get_tokenized_story_by_Id.FileSystemReader"
    )
    def test_file_name_is_passed_correctly(self, mock_reader):

        mock_reader.return_value.read_file.return_value = []

        GetTokenizedStoryById("1")

        mock_reader.assert_called_once_with(
            "tokenized_stories.json"
        )
        

        
