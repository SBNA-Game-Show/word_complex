import os
import json


class FileSystemReader:

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "data")

    def __init__(self, file_name):

        self.file_name = file_name
        self.file_path = self.build_path()

    def build_path(self):

        # ✅ FIX: if absolute path is given, use it directly
        if os.path.isabs(self.file_name):
            return self.file_name

        return os.path.join(self.DATA_DIR, self.file_name)

    def read_file(self):

        try:
            with open(self.file_path, "r", encoding="utf-8") as file:
                return json.load(file)

        except FileNotFoundError:
            return {
                "success": False,
                "message": f"File not found: {self.file_path}",
                "data": None
            }

        except json.JSONDecodeError as e:
            return {
                "success": False,
                "message": "Invalid JSON format",
                "error": str(e),
                "data": None
            }