from config.dbconfig import connect_db


class GetTokenizedStoryByIdFromMongoDB:

    def __init__(self, story_id):
        self.db = connect_db()
        self.collection = self.db["tokenized_stories"]
        self.story_id = story_id

    def get_story(self):
        data = self.collection.find_one({"_id": self.story_id})

        if data is None:
            return {
                "success": False,
                "message": "No tokenized story found for the given ID."
            }

        return data