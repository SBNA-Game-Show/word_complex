from repository.get_tokenized_story_by_Id import GetTokenizedStoryById
from repository.get_tokenized_story_by_id_from_mongodb import GetTokenizedStoryByIdFromMongoDB


class RetrieveTokenizedStoryById:

    def __init__(self, story_id):

        if story_id is None:
            raise ValueError("story_id cannot be None")

        self.story_id = story_id

    def retrieve_story(self):
        
        # # Retrieves from file system
        # repository = GetTokenizedStoryById(self.story_id)

        # story = repository.retrieve_story()
        
        # Retrieving from Database
        
        repo = GetTokenizedStoryByIdFromMongoDB(self.story_id)
        story = repo.get_story()

        if story is None:
            raise LookupError("Story not found")

        return story