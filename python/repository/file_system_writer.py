import os
import json
from datetime import datetime
"""  
 Given file name and data writes the data to the file in json format
 
 case1 if file exists it adds to it
 case2 if file does not exists creates a new one
 
"""


class WriteToFileSystem:

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "data")

    def __init__(self, fileName, data):

        self.fileName = fileName
        self.data = data

        self.file_path = os.path.join(self.DATA_DIR, self.fileName)

        self.ensure_directory_exists()
        self.write_data()

    def ensure_directory_exists(self):

        if not os.path.exists(self.DATA_DIR):
            os.makedirs(self.DATA_DIR)

    def write_data(self):

        # Case 1: file does not exist create new
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([self.data], f, indent=4, ensure_ascii=False)
            return

        # Case 2: file exists append data
        with open(self.file_path, "r", encoding="utf-8") as f:
            existing_data = json.load(f)

        # ensure it's a list
        if not isinstance(existing_data, list):
            existing_data = [existing_data]

        existing_data.append({
            **self.data,
            "createdAt": datetime.now().isoformat()
        })

        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4, ensure_ascii=False)