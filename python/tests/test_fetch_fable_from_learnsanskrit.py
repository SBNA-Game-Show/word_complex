from services.fetch_fable_from_learnsanskrit_complete import RetrieveStoryFromLearnSanskrit


# Fake response object
class FakeResponse:
    def json(self):
        return {
            "storyNumber": "aesop01",
            "title": "Rabbit Story",
            "used": False
        }


def fake_requests_get(*args, **kwargs):
    return FakeResponse()


# Test 1: URL generation
def test_generate_url():

    obj = RetrieveStoryFromLearnSanskrit.__new__(RetrieveStoryFromLearnSanskrit)
    obj.storyNumber = "aesop01"

    url = obj.generate_url()

    assert url == (
        "https://learnsanskrit.cc/fables/story?"
        "name=aesop01&active=true"
    )


# Test 2: Class initialization
def test_class_initialization(monkeypatch):

    monkeypatch.setattr(
        "services.fetch_fable_from_learnsanskrit_complete.requests.get",
        fake_requests_get
    )

    obj = RetrieveStoryFromLearnSanskrit("aesop01")

    assert obj.storyNumber == "aesop01"
    assert obj.url == (
        "https://learnsanskrit.cc/fables/story?"
        "name=aesop01&active=true"
    )

    # ✅ FIX: call method explicitly
    result = obj.send_request()

    assert isinstance(result, dict)
    assert result["storyNumber"] == "aesop01"
    assert result["used"] is False


# Test 3: send_request method
def test_send_request(monkeypatch):

    monkeypatch.setattr(
        "services.fetch_fable_from_learnsanskrit_complete.requests.get",
        fake_requests_get
    )

    obj = RetrieveStoryFromLearnSanskrit.__new__(RetrieveStoryFromLearnSanskrit)
    obj.url = "dummy-url"

    result = obj.send_request()

    assert result["storyNumber"] == "aesop01"
    assert result["used"] is False


# Test 4: ensure response is dict
def test_response_type(monkeypatch):

    monkeypatch.setattr(
        "services.fetch_fable_from_learnsanskrit_complete.requests.get",
        fake_requests_get
    )

    obj = RetrieveStoryFromLearnSanskrit("aesop01")

    # ✅ FIX: no attribute check, just method output
    result = obj.send_request()

    assert isinstance(result, dict)