import json
import os


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

        documents = []

        for category, stories in data.items():

            for story in stories:

                story["category"] = category
                documents.append(story)

        return documents

    def seed(self):

        if self.already_seeded():
            print("MongoDB already seeded")
            return

        data = self.load_json()
        documents = self.transform(data)

        self.collection.insert_many(documents)

        print("MongoDB bootstrapped successfully")