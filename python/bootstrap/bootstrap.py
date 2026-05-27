import json
class AppBootstrap:

    def __init__(self, db, json_path):
        self.db = db
        self.json_path = json_path
        self.collection = db["stories"]

    def already_seeded(self):
        return self.collection.count_documents({}) > 0

    def load_json(self):
        with open(self.json_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def transform(self, data):

        # CASE 1: single story dict
        if isinstance(data, dict):
            data["type"] = "fable"
            return [data]

        # CASE 2: list of stories
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    item["type"] = "fable"
            return data

        raise ValueError(f"Unsupported data type: {type(data)}")

    def seed(self):

        if self.already_seeded():
            print("MongoDB already seeded")
            return

        data = self.load_json()
        documents = self.transform(data)

        self.collection.insert_many(documents)

        print("MongoDB bootstrapped successfully")