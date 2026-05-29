import pytest
from flask import Flask
from unittest.mock import patch

from controller.tokenized_data_learnsanskrit_controller import (
    add_new_story,
    fetch_all_tokenized_stories, fetch_tokenized_story_by_id
)


# =========================================================
# CREATE TEST APP
# =========================================================

@pytest.fixture
def app():

    app = Flask(__name__)

    # Add New Story Route
    app.add_url_rule(
        "/addNew",
        view_func=add_new_story,
        methods=["POST"]
    )

    # Fetch Tokenized Stories Route
    app.add_url_rule(
        "/tokenized-stories",
        view_func=fetch_all_tokenized_stories,
        methods=["GET"]
    )
    
    app.add_url_rule(
        "/getTokenizedById",
        view_func=fetch_tokenized_story_by_id,
        methods=["GET"]
    )

    return app


@pytest.fixture
def client(app):
    return app.test_client()


# =========================================================
# ADD NEW STORY TESTS
# =========================================================

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


def test_add_new_story_missing_story_id(client):

    response = client.post("/addNew")

    data = response.get_json()

    assert response.status_code == 400
    assert data["success"] is False
    assert (
        data["message"]
        == "story_id query parameter is required"
    )


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

        assert response.status_code == 500


def test_add_new_story_empty_story_id(client):

    response = client.post(
        "/addNew?story_id="
    )

    data = response.get_json()

    assert response.status_code == 400
    assert data["success"] is False


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


# =========================================================
# FETCH TOKENIZED STORIES TESTS
# =========================================================

def test_fetch_all_tokenized_stories_success(client):

    mock_response = {
        "success": True,
        "data": [
            {
                "_id": "1",
                "title": "Rabbit Story"
            }
        ]
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        response = client.get("/tokenized-stories")

        data = response.get_json()

        assert response.status_code == 200
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "Rabbit Story"


def test_fetch_all_tokenized_stories_empty_list(client):

    mock_response = {
        "success": True,
        "data": []
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        response = client.get("/tokenized-stories")

        data = response.get_json()

        assert response.status_code == 200
        assert data["data"] == []


def test_fetch_all_tokenized_stories_none_data(client):

    mock_response = {
        "success": True,
        "data": None
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        response = client.get("/tokenized-stories")

        data = response.get_json()

        assert response.status_code == 200
        assert data["data"] is None


def test_fetch_all_tokenized_stories_file_not_found(client):

    mock_response = {
        "success": False,
        "message": "tokenized_stories.json not found"
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        response = client.get("/tokenized-stories")

        data = response.get_json()

        assert response.status_code == 500
        assert data["success"] is False
        assert "not found" in data["message"]


def test_fetch_all_tokenized_stories_invalid_json(client):

    mock_response = {
        "success": False,
        "message": "Invalid JSON format"
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        response = client.get("/tokenized-stories")

        data = response.get_json()

        assert response.status_code == 500
        assert "Invalid JSON format" in data["message"]


def test_fetch_all_tokenized_stories_generic_exception(client):

    mock_response = {
        "success": False,
        "message": "Unexpected Error"
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        response = client.get("/tokenized-stories")

        data = response.get_json()

        assert response.status_code == 500
        assert data["message"] == "Unexpected Error"


def test_fetch_all_tokenized_stories_response_structure(client):

    mock_response = {
        "success": True,
        "data": []
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        response = client.get("/tokenized-stories")

        data = response.get_json()

        assert isinstance(data, dict)
        assert "success" in data
        assert "data" in data


def test_service_method_called_once(client):

    mock_response = {
        "success": True,
        "data": []
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        client.get("/tokenized-stories")

        mock_service.return_value.get_all.assert_called_once()


def test_fetch_all_tokenized_stories_large_dataset(client):

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

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        response = client.get("/tokenized-stories")

        data = response.get_json()

        assert response.status_code == 200
        assert len(data["data"]) == 1000
        assert data["data"][500]["title"] == "Story 500"


def test_fetch_all_tokenized_stories_json_response(client):

    mock_response = {
        "success": True,
        "data": []
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        response = client.get("/tokenized-stories")

        assert response.content_type == "application/json"


def test_service_instantiated_once(client):

    mock_response = {
        "success": True,
        "data": []
    }

    with patch(
        "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStories"
    ) as mock_service:

        mock_service.return_value.get_all.return_value = mock_response

        client.get("/tokenized-stories")

        mock_service.assert_called_once()
        
        
        
## GET Tokenized story by id 
@patch(
    "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStoryById"
)
def test_fetch_story_success(
    mock_service,
    client
):

    mock_service.return_value.retrieve_story.return_value = {
        "_id": "1",
        "title": "Lion and Mouse"
    }

    response = client.get(
        "/getTokenizedById?story_id=1"
    )

    data = response.get_json()

    assert response.status_code == 200

    assert data["success"] is True

    assert data["data"]["_id"] == "1"

    assert data["data"]["title"] == "Lion and Mouse"


# =====================================================
# MISSING QUERY PARAM
# =====================================================

def test_fetch_story_missing_story_id(
    client
):

    response = client.get("/getTokenizedById")

    data = response.get_json()

    assert response.status_code == 400

    assert data["success"] is False

    assert (
        data["message"]
        == "story_id query parameter is required"
    )


# =====================================================
# EMPTY QUERY PARAM
# =====================================================

def test_fetch_story_empty_story_id(
    client
):

    response = client.get(
        "/getTokenizedById?story_id="
    )

    data = response.get_json()

    assert response.status_code == 400

    assert data["success"] is False

    assert (
        data["message"]
        == "story_id query parameter is required"
    )


# =====================================================
# SERVICE CALLED WITH CORRECT ID
# =====================================================

@patch(
    "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStoryById"
)
def test_service_called_with_correct_story_id(
    mock_service,
    client
):

    mock_service.return_value.retrieve_story.return_value = {
        "_id": "1"
    }

    client.get("/getTokenizedById?story_id=1")

    mock_service.assert_called_once_with("1")


# =====================================================
# SERVICE METHOD CALLED ONCE
# =====================================================

@patch(
    "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStoryById"
)
def test_retrieve_story_called_once(
    mock_service,
    client
):

    mock_service.return_value.retrieve_story.return_value = {
        "_id": "1"
    }

    client.get("/getTokenizedById?story_id=1")

    mock_service.return_value.retrieve_story.assert_called_once()


# =====================================================
# LOOKUP ERROR
# =====================================================

@patch(
    "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStoryById"
)
def test_fetch_story_lookup_error(
    mock_service,
    client
):

    mock_service.return_value.retrieve_story.side_effect = (
        LookupError("Story not found")
    )

    response = client.get(
        "/getTokenizedById?story_id=999"
    )

    assert response.status_code == 500


# =====================================================
# VALUE ERROR
# =====================================================

@patch(
    "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStoryById"
)
def test_fetch_story_value_error(
    mock_service,
    client
):

    mock_service.return_value.retrieve_story.side_effect = (
        ValueError("Invalid story id")
    )

    response = client.get(
        "/getTokenizedById?story_id=abc"
    )

    assert response.status_code == 500


# =====================================================
# UNEXPECTED EXCEPTION
# =====================================================

@patch(
    "controller.tokenized_data_learnsanskrit_controller.RetrieveTokenizedStoryById"
)
def test_fetch_story_unexpected_exception(
    mock_service,
    client
):

    mock_service.return_value.retrieve_story.side_effect = (
        Exception("Database crashed")
    )

    response = client.get(
        "/getTokenizedById?story_id=1"
    )

    assert response.status_code == 500