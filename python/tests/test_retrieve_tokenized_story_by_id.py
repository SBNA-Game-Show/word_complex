import pytest
from unittest.mock import patch

from services.retrieve_tokenized_story_by_Id import RetrieveTokenizedStoryById


class TestRetrieveTokenizedStoryById:

    def test_raises_value_error_when_story_id_is_none(self):

        with pytest.raises(ValueError) as exc:

            RetrieveTokenizedStoryById(None)

        assert str(exc.value) == "story_id cannot be None"

    @patch(
        "services.retrieve_tokenized_story_by_Id.GetTokenizedStoryById"
    )
    def test_returns_story_when_story_exists(
        self,
        mock_repository
    ):

        mock_repository.return_value.retrieve_story.return_value = {
            "_id": "1",
            "title": "Lion and Mouse"
        }

        service = RetrieveTokenizedStoryById("1")

        result = service.retrieve_story()

        assert result == {
            "_id": "1",
            "title": "Lion and Mouse"
        }

    @patch(
        "services.retrieve_tokenized_story_by_Id.GetTokenizedStoryById"
    )
    def test_raises_lookup_error_when_story_not_found(
        self,
        mock_repository
    ):

        mock_repository.return_value.retrieve_story.return_value = None

        service = RetrieveTokenizedStoryById("100")

        with pytest.raises(LookupError) as exc:

            service.retrieve_story()

        assert str(exc.value) == "Story not found"

    @patch(
        "services.retrieve_tokenized_story_by_Id.GetTokenizedStoryById"
    )
    def test_repository_called_with_correct_story_id(
        self,
        mock_repository
    ):

        mock_repository.return_value.retrieve_story.return_value = {
            "_id": "1"
        }

        service = RetrieveTokenizedStoryById("1")

        service.retrieve_story()

        mock_repository.assert_called_once_with("1")

    @patch(
        "services.retrieve_tokenized_story_by_Id.GetTokenizedStoryById"
    )
    def test_repository_retrieve_story_called_once(
        self,
        mock_repository
    ):

        mock_repository.return_value.retrieve_story.return_value = {
            "_id": "1"
        }

        service = RetrieveTokenizedStoryById("1")

        service.retrieve_story()

        mock_repository.return_value.retrieve_story.assert_called_once()

    @patch(
        "services.retrieve_tokenized_story_by_Id.GetTokenizedStoryById"
    )
    def test_propagates_repository_exceptions(
        self,
        mock_repository
    ):

        mock_repository.return_value.retrieve_story.side_effect = (
            Exception("Database error")
        )

        service = RetrieveTokenizedStoryById("1")

        with pytest.raises(Exception) as exc:

            service.retrieve_story()

        assert str(exc.value) == "Database error"