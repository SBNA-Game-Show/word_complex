import pytest
from unittest.mock import patch
from flask import Flask

from controller.story_data_learnsanskrit_controller import fetch_all_story_data


# =========================================================
# FLASK TEST APP
# =========================================================

@pytest.fixture
def app():

    app = Flask(__name__)

    app.testing = True

    return app


# =========================================================
# SUCCESS RESPONSE
# =========================================================

def test_fetch_all_story_data_success(app):

    mock_response = {
        "success": True,
        "data": [
            {
                "_id": "1",
                "title": "Rabbit Story"
            }
        ]
    }

    with app.app_context():

        with patch(
            "controller.story_data_learnsanskrit_controller.RetrieveAllStoryDataLearnSanskrit"
        ) as mock_service:

            mock_service.return_value.retrieve_all.return_value = mock_response

            response, status_code = fetch_all_story_data()

            response_json = response.get_json()

            assert status_code == 200
            assert response_json["success"] is True
            assert len(response_json["data"]) == 1
            assert response_json["data"][0]["title"] == "Rabbit Story"


# =========================================================
# EMPTY DATA RESPONSE
# =========================================================

def test_fetch_all_story_data_empty_data(app):

    mock_response = {
        "success": True,
        "data": []
    }

    with app.app_context():

        with patch(
            "controller.story_data_learnsanskrit_controller.RetrieveAllStoryDataLearnSanskrit"
        ) as mock_service:

            mock_service.return_value.retrieve_all.return_value = mock_response

            response, status_code = fetch_all_story_data()

            response_json = response.get_json()

            assert status_code == 200
            assert response_json["success"] is True
            assert response_json["data"] == []


# =========================================================
# NONE DATA RESPONSE
# =========================================================

def test_fetch_all_story_data_none_data(app):

    mock_response = {
        "success": True,
        "data": None
    }

    with app.app_context():

        with patch(
            "controller.story_data_learnsanskrit_controller.RetrieveAllStoryDataLearnSanskrit"
        ) as mock_service:

            mock_service.return_value.retrieve_all.return_value = mock_response

            response, status_code = fetch_all_story_data()

            response_json = response.get_json()

            assert status_code == 200
            assert response_json["success"] is True
            assert response_json["data"] is None


# =========================================================
# FILE NOT FOUND ERROR
# =========================================================

def test_fetch_all_story_data_file_not_found(app):

    mock_response = {
        "success": False,
        "message": "stories_data.json not found"
    }

    with app.app_context():

        with patch(
            "controller.story_data_learnsanskrit_controller.RetrieveAllStoryDataLearnSanskrit"
        ) as mock_service:

            mock_service.return_value.retrieve_all.return_value = mock_response

            response, status_code = fetch_all_story_data()

            response_json = response.get_json()

            assert status_code == 500
            assert response_json["success"] is False
            assert "not found" in response_json["message"]


# =========================================================
# INVALID JSON ERROR
# =========================================================

def test_fetch_all_story_data_invalid_json(app):

    mock_response = {
        "success": False,
        "message": "Invalid JSON format"
    }

    with app.app_context():

        with patch(
            "controller.story_data_learnsanskrit_controller.RetrieveAllStoryDataLearnSanskrit"
        ) as mock_service:

            mock_service.return_value.retrieve_all.return_value = mock_response

            response, status_code = fetch_all_story_data()

            response_json = response.get_json()

            assert status_code == 500
            assert response_json["success"] is False
            assert "Invalid JSON format" in response_json["message"]


# =========================================================
# GENERIC ERROR
# =========================================================

def test_fetch_all_story_data_generic_error(app):

    mock_response = {
        "success": False,
        "message": "Unexpected Error"
    }

    with app.app_context():

        with patch(
            "controller.story_data_learnsanskrit_controller.RetrieveAllStoryDataLearnSanskrit"
        ) as mock_service:

            mock_service.return_value.retrieve_all.return_value = mock_response

            response, status_code = fetch_all_story_data()

            response_json = response.get_json()

            assert status_code == 500
            assert response_json["success"] is False
            assert response_json["message"] == "Unexpected Error"


# =========================================================
# RESPONSE STRUCTURE
# =========================================================

def test_fetch_all_story_data_response_structure(app):

    mock_response = {
        "success": True,
        "data": [
            {
                "_id": "1",
                "title": "Lion Story"
            }
        ]
    }

    with app.app_context():

        with patch(
            "controller.story_data_learnsanskrit_controller.RetrieveAllStoryDataLearnSanskrit"
        ) as mock_service:

            mock_service.return_value.retrieve_all.return_value = mock_response

            response, status_code = fetch_all_story_data()

            response_json = response.get_json()

            assert isinstance(response_json, dict)
            assert "success" in response_json
            assert "data" in response_json
            assert status_code == 200


# =========================================================
# VERIFY SERVICE METHOD CALLED
# =========================================================

def test_service_method_called_once(app):

    mock_response = {
        "success": True,
        "data": []
    }

    with app.app_context():

        with patch(
            "controller.story_data_learnsanskrit_controller.RetrieveAllStoryDataLearnSanskrit"
        ) as mock_service:

            mock_service.return_value.retrieve_all.return_value = mock_response

            fetch_all_story_data()

            mock_service.return_value.retrieve_all.assert_called_once()


# =========================================================
# LARGE DATASET
# =========================================================

def test_fetch_all_story_data_large_dataset(app):

    large_data = []

    for i in range(1000):

        large_data.append({
            "_id": str(i),
            "title": f"Story {i}"
        })

    mock_response = {
        "success": True,
        "data": large_data
    }

    with app.app_context():

        with patch(
            "controller.story_data_learnsanskrit_controller.RetrieveAllStoryDataLearnSanskrit"
        ) as mock_service:

            mock_service.return_value.retrieve_all.return_value = mock_response

            response, status_code = fetch_all_story_data()

            response_json = response.get_json()

            assert status_code == 200
            assert len(response_json["data"]) == 1000
            assert response_json["data"][500]["title"] == "Story 500"

