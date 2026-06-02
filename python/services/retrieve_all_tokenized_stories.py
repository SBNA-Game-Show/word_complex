from repository.get_all_tokenized_stories_learnsanskrit import GetAllTokenizedStories
from repository.get_all_tokenized_stories_from_mongodb import GetAllTokenizedStoriesFromMongoDB

class RetrieveTokenizedStories:

    def get_all(self):
        try:
            # #using file system to write data
            # data = GetAllTokenizedStories().get_all_stories()
            
            # Query database
            repo = GetAllTokenizedStoriesFromMongoDB()
            data = repo.get_all()

            return {
                "success": True,
                "data": data
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }