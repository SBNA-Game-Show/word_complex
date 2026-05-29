from utils.file_system_reader import FileSystemReader


class GetTokenizedStoryById:
    
    def __init__(self, story_id):
        self.FILE_NAME = "tokenized_stories.json"
        self.story_id = story_id
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
            
            if story.get("_id") == self.story_id:
                                
                return story
            
        return None