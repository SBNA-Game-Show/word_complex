import pytest
from flask import Flask
from unittest.mock import patch

from controller.tokenized_data_learnsanskrit_controller import (
    add_new_story
)


# =========================================
# CREATE TEST APP
# =========================================

@pytest.fixture
def client():

    app = Flask(__name__)

    app.add_url_rule(
        "/addNew",
        view_func=add_new_story,
        methods=["POST"]
    )

    with app.test_client() as client:
        yield client


# =========================================
# SUCCESS CASE
# =========================================

def test_add_new_story_success(client):

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.FetchNewFable"
    ) as mock_service:

        mock_service.return_value.execute.return_value = (
            "FABLE DOWNLOADED SUCCESSFULLY"
        )

        response = client.post(
            "/addNew?story_id=aesop01"
        )

        data = response.get_json()

        assert response.status_code == 200
        assert data["success"] is True
        assert data["data"] == "FABLE DOWNLOADED SUCCESSFULLY"


# =========================================
# MISSING QUERY PARAM
# =========================================

def test_add_new_story_missing_story_id(client):

    response = client.post("/addNew")

    data = response.get_json()

    assert response.status_code == 400
    assert data["success"] is False
    assert (
        data["message"]
        == "story_id query parameter is required"
    )


# =========================================
# SERVICE FAILURE
# =========================================

def test_add_new_story_service_failure(client):

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.FetchNewFable"
    ) as mock_service:

        mock_service.return_value.execute.side_effect = (
            Exception("Pipeline Failure")
        )

        response = client.post(
            "/addNew?story_id=aesop01"
        )

        # Flask returns HTML for unhandled exceptions by default
        assert response.status_code == 500


# =========================================
# EMPTY STRING STORY ID
# =========================================

def test_add_new_story_empty_story_id(client):

    response = client.post(
        "/addNew?story_id="
    )

    data = response.get_json()

    assert response.status_code == 400
    assert data["success"] is False


# =========================================
# INVALID STORY ID
# =========================================

def test_add_new_story_invalid_story_id(client):

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.FetchNewFable"
    ) as mock_service:

        mock_service.return_value.execute.return_value = (
            "NO DATA FOUND"
        )

        response = client.post(
            "/addNew?story_id=invalid123"
        )

        data = response.get_json()

        assert response.status_code == 200
        assert data["success"] is True