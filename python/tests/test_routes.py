from server import app

def test_get_unused_stories_route():

    client = app.test_client()

    response = client.get("/api/v1/python/getAllFableTitle")

    assert response.status_code == 200

    data = response.get_json()

    assert "success" in data
    assert "data" in data