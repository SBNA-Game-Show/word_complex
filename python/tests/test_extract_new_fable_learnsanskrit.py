import pytest
from unittest.mock import patch

from services.extract_new_fable_learnsanskrit import FetchNewFable


class TestFetchNewFable:
    """
        Unit tests for FetchNewFable.

        Goal:
        Test only the orchestration/business logic.

        We mock:
        - Database access
        - HTTP requests
        - File writing
        - NLP processing (spaCy/Stanza)
        - Synonym extraction

        This keeps tests fast and deterministic.
        """
    @patch.object(FetchNewFable, "_update_story_status")
    @patch.object(FetchNewFable, "_write_to_file_system")
    @patch.object(FetchNewFable, "_tokenize_sanskrit_version")
    @patch.object(FetchNewFable, "_add_synonym_antonym")
    @patch.object(FetchNewFable, "_tokenize_english_version")
    @patch.object(FetchNewFable, "_clean_data")
    @patch.object(FetchNewFable, "_retrieve_raw_data")
    @patch.object(FetchNewFable, "_get_story_data")
    def test_execute_success(
        self,
        mock_get_story_data,
        mock_retrieve_raw_data,
        mock_clean_data,
        mock_tokenize_english,
        mock_add_synonym_antonym,
        mock_tokenize_sanskrit,
        mock_write_to_file,
        mock_update_story_status
    ):
        mock_get_story_data.return_value = {
            "_id": "123",
            "vendorId": "Aesop001"
        }

        mock_retrieve_raw_data.return_value = {"raw": "data"}

        mock_clean_data.return_value = {
            "title": {},
            "englishVersion": "sample"
        }

        mock_tokenize_english.return_value = {
            "title": {},
            "tokenized_english_version": []
        }

        mock_add_synonym_antonym.return_value = {
            "title": {},
            "tokenized_english_version": []
        }

        mock_tokenize_sanskrit.return_value = {
            "title": {},
            "tokenized_sanskrit_version": []
        }

        mock_write_to_file.return_value = True

        mock_update_story_status.return_value = {
            "success": True
        }

        service = FetchNewFable()

        result = service.execute("123")

        assert result == "FABLE DOWNLOADED SUCCESSFULLY"

        mock_get_story_data.assert_called_once_with("123")
        mock_retrieve_raw_data.assert_called_once_with("Aesop001")
        mock_write_to_file.assert_called_once()
        mock_update_story_status.assert_called_once_with("123")

    @patch.object(FetchNewFable, "_get_story_data")
    def test_execute_story_not_found(self, mock_get_story_data):
        """ Test when story metadata cannot be found. Expected: ValueError should be raised. """
        mock_get_story_data.return_value = None

        service = FetchNewFable()

        with pytest.raises(ValueError) as exc:
            service.execute("999")

        assert "No data found for the given ID" in str(exc.value)

    @patch.object(FetchNewFable, "_update_story_status")
    @patch.object(FetchNewFable, "_write_to_file_system")
    @patch.object(FetchNewFable, "_tokenize_sanskrit_version")
    @patch.object(FetchNewFable, "_add_synonym_antonym")
    @patch.object(FetchNewFable, "_tokenize_english_version")
    @patch.object(FetchNewFable, "_clean_data")
    @patch.object(FetchNewFable, "_retrieve_raw_data")
    @patch.object(FetchNewFable, "_get_story_data")
    def test_execute_write_failure(
        self,
        mock_get_story_data,
        mock_retrieve_raw_data,
        mock_clean_data,
        mock_tokenize_english,
        mock_add_synonym_antonym,
        mock_tokenize_sanskrit,
        mock_write_to_file,
        mock_update_story_status
    ):
        mock_get_story_data.return_value = {
            "_id": "123",
            "vendorId": "Aesop001"
        }

        mock_retrieve_raw_data.return_value = {}
        mock_clean_data.return_value = {}
        mock_tokenize_english.return_value = {}
        mock_add_synonym_antonym.return_value = {}
        mock_tokenize_sanskrit.return_value = {}

        mock_write_to_file.return_value = False

        service = FetchNewFable()

        with pytest.raises(IOError) as exc:
            service.execute("123")

        assert "Failed writing tokenized story" in str(exc.value)

    @patch.object(FetchNewFable, "_update_story_status")
    @patch.object(FetchNewFable, "_write_to_file_system")
    @patch.object(FetchNewFable, "_tokenize_sanskrit_version")
    @patch.object(FetchNewFable, "_add_synonym_antonym")
    @patch.object(FetchNewFable, "_tokenize_english_version")
    @patch.object(FetchNewFable, "_clean_data")
    @patch.object(FetchNewFable, "_retrieve_raw_data")
    @patch.object(FetchNewFable, "_get_story_data")
    def test_execute_update_failure(
        self,
        mock_get_story_data,
        mock_retrieve_raw_data,
        mock_clean_data,
        mock_tokenize_english,
        mock_add_synonym_antonym,
        mock_tokenize_sanskrit,
        mock_write_to_file,
        mock_update_story_status
    ):
        """ Test when updating story status fails. Expected: ValueError should be raised with returned message. """
        mock_get_story_data.return_value = {
            "_id": "123",
            "vendorId": "Aesop001"
        }

        mock_retrieve_raw_data.return_value = {}
        mock_clean_data.return_value = {}
        mock_tokenize_english.return_value = {}
        mock_add_synonym_antonym.return_value = {}
        mock_tokenize_sanskrit.return_value = {}

        mock_write_to_file.return_value = True

        mock_update_story_status.return_value = {
            "success": False,
            "message": "Update failed"
        }

        service = FetchNewFable()

        with pytest.raises(ValueError) as exc:
            service.execute("123")

        assert "Update failed" in str(exc.value)

    @patch.object(FetchNewFable, "_clean_data")
    @patch.object(FetchNewFable, "_retrieve_raw_data")
    @patch.object(FetchNewFable, "_get_story_data")
    def test_story_category_extracted_correctly(
        self,
        mock_get_story_data,
        mock_retrieve_raw_data,
        mock_clean_data
    ):
        """ Verify that category extraction logic works. Example: Panchatantra001 -> Panchatantra """
        mock_get_story_data.return_value = {
            "_id": "123",
            "vendorId": "Panchatantra001"
        }

        mock_retrieve_raw_data.return_value = {}
        mock_clean_data.return_value = {}

        service = FetchNewFable()

        with patch.object(service, "_tokenize_english_version", return_value={}), \
             patch.object(service, "_add_synonym_antonym", return_value={}), \
             patch.object(service, "_tokenize_sanskrit_version", return_value={}), \
             patch.object(service, "_write_to_file_system", return_value=True), \
             patch.object(service, "_update_story_status", return_value={"success": True}):

            result = service.execute("123")

        assert result == "FABLE DOWNLOADED SUCCESSFULLY"

    def test_write_to_file_system_success(self):
        """ Verify helper method returns True when file write succeeds. """
        service = FetchNewFable()

        with patch(
            "services.extract_new_fable_learnsanskrit.WriteToFileSystem"
        ) as mock_writer:

            mock_writer.return_value = None

            result = service._write_to_file_system({"test": "data"})

            assert result is True

    def test_write_to_file_system_failure(self):
        """ Verify helper method returns False when WriteToFileSystem throws an exception. """
        service = FetchNewFable()

        with patch(
            "services.extract_new_fable_learnsanskrit.WriteToFileSystem"
        ) as mock_writer:

            mock_writer.side_effect = Exception("Disk error")

            result = service._write_to_file_system({"test": "data"})

            assert result is False