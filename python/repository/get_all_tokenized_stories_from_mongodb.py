from config.dbconfig import connect_db

class GetAllTokenizedStoriesFromMongoDB:
    def __init__(self):
        self.db = connect_db()
        self.collection = self.db["tokenized_stories"]
        
        
    def get_all(self):
        stories = list(self.collection.find())


        return {
            "success": True,
            "count": len(stories),
            "data": stories
        }
        