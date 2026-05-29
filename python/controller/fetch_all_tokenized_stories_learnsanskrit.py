from services.retreive_all_tokenized_stories import RetrieveTokenizedStories

class FetchAllTokenizedStories:
    
    def __init__(self, service=None):
        
        # Instantiate the orchestration service safely
        if service is None:
            self.service = RetrieveTokenizedStories()
        else:
            self.service = service
            
    
   
        
    