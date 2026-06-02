from config.dbconfig import connect_db


class GetTokenizedStoriesByCategoryFromMongoDB:

    def __init__(self, category_name):
        self.db = connect_db()
        self.collection = self.db["tokenized_stories"]
        self.category = category_name

    def get_stories(self):
        data = list(
            self.collection.find({"category": self.category})
        )

        if not data:
            return {
                "success": False,
                "message": f"No tokenized stories found for category '{self.category}'."
            }

        return {
            "success": True,
            "count": len(data),
            "data": data
        }