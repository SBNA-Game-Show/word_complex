from repository.get_tokenized_stories_by_category_from_mongodb import GetTokenizedStoriesByCategoryFromMongoDB
from repository.get_tokenized_story_by_category import GetTokenizedStoryByCategory


class RetrieveTokenizedStoryByCategory:
    
    def __init__(self, category_name):
        
        
        self.category = category_name
        
        
    
    def get_by_category(self):
        try:
            # # reading from file system
            # repo = GetTokenizedStoryByCategory(self.category)
            # data = repo.retrieve_story()
            
            # # From Databases
            repo = GetTokenizedStoriesByCategoryFromMongoDB(self.category)
            data = repo.get_stories()
            
            return data
            
        except Exception as e:
            return{
                "success":False,
                "message":str(e)
                
            }
    