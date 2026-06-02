from config.dbconfig import connect_db

from utils.tokenized_story_mapper import TokenizedStoryMapper


class WriteTokenizedStoryToMongoDB:
    def __init__(self, story_data):
        self.data = story_data
        self.db = connect_db()
        self.collection = self.db["tokenized_stories"]
        
    def save_story(self):
        doc = TokenizedStoryMapper.to_schema(self.data)
        
        result = self.collection.insert_one(doc)
        
        return f"{result.inserted_id} tokenized and added to DB"
        
    