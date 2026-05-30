from utils.file_system_reader import FileSystemReader

class GetTokenizedStoryByCategory:
    
    def __init__(self,category):
        self.FILE_NAME = "tokenized_stories.json"
        self.category = category
        self.data = self.read_file()
    
    def read_file(self):
        req = FileSystemReader(self.FILE_NAME)
        return req.read_file()
    
    
    def retrieve_story(self):
        
        if not self.data:
            return None
        
        for story in self.data:
            if not isinstance(story,dict):
                continue
            
            if story.get("category") == self.category:
                
                return story
            
        return None