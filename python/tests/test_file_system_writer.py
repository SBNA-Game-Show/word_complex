import json
from utils.file_system_writer import WriteToFileSystem


def test_creates_new_file(tmp_path, monkeypatch):

    monkeypatch.setattr(
        "utils.file_system_writer.WriteToFileSystem.DATA_DIR",
        tmp_path
    )

    data = {
        "storyNumber": "aesop01",
        "used": False
    }

    WriteToFileSystem("test.json", data)

    file_path = tmp_path / "test.json"

    assert file_path.exists()

    content = json.loads(file_path.read_text())

    assert isinstance(content, list)
    assert content[0]["storyNumber"] == "aesop01"


def test_appends_data(tmp_path, monkeypatch):

    monkeypatch.setattr(
        "utils.file_system_writer.WriteToFileSystem.DATA_DIR",
        tmp_path
    )

    file_path = tmp_path / "test.json"

    # create initial file
    file_path.write_text(json.dumps([
        {"storyNumber": "aesop01", "used": False}
    ]))

    data = {
        "storyNumber": "aesop02",
        "used": False
    }

    WriteToFileSystem("test.json", data)

    content = json.loads(file_path.read_text())

    assert len(content) == 2
    assert content[1]["storyNumber"] == "aesop02"


def test_directory_created(tmp_path, monkeypatch):

    fake_dir = tmp_path / "data"

    monkeypatch.setattr(
        "utils.file_system_writer.WriteToFileSystem.DATA_DIR",
        fake_dir
    )

    data = {
        "storyNumber": "aesop01",
        "used": False
    }

    WriteToFileSystem("test.json", data)

    assert fake_dir.exists()