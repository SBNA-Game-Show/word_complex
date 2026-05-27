import json
from utils.file_system_reader import FileSystemReader


def test_read_valid_json(monkeypatch):

    sample_data = {"message": "hello world"}

    def mock_open(*args, **kwargs):
        from io import StringIO
        return StringIO(json.dumps(sample_data))

    monkeypatch.setattr("builtins.open", mock_open)

    reader = FileSystemReader("dummy.json")
    result = reader.read_file()

    assert result["message"] == "hello world"
    assert isinstance(result, dict)


def test_invalid_json(monkeypatch):

    def mock_open(*args, **kwargs):
        from io import StringIO
        return StringIO("{ invalid json }")

    monkeypatch.setattr("builtins.open", mock_open)

    reader = FileSystemReader("dummy.json")
    result = reader.read_file()

    assert result["success"] is False
    assert result["message"] == "Invalid JSON format"
    assert "error" in result


def test_file_not_found(monkeypatch):

    def mock_open(*args, **kwargs):
        raise FileNotFoundError()

    monkeypatch.setattr("builtins.open", mock_open)

    reader = FileSystemReader("missing.json")
    result = reader.read_file()

    assert result["success"] is False
    assert "File not found" in result["message"]