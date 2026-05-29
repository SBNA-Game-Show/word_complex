from utils.file_system_reader import FileSystemReader
import json


class GetAllTokenizedStories:
    """Repository: reads tokenized stories from file"""

    FILE_NAME = "tokenized_stories.json"

    def get_all_stories(self):
        try:
            reader = FileSystemReader(self.FILE_NAME)
            data = reader.read_file()

            if data is None:
                raise ValueError("Tokenized stories file is empty")

            return data

        except FileNotFoundError as e:
            raise FileNotFoundError(f"{self.FILE_NAME} not found") from e

        except json.JSONDecodeError as e:
            raise ValueError("Invalid JSON format in tokenized stories file") from e