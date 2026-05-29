from utils.file_system_reader import FileSystemReader
import json

class GetAllStoryDataLearnSanskrit:
    FILE_NAME = "stories_data.json"
    
    
    def get_all_story_data(self):
        try:
            reader = FileSystemReader(self.FILE_NAME)
            data = reader.read_file()
            
            if data is None:
                raise ValueError("Stories Data file is empty")
            
            return data
        
        except FileNotFoundError as e:
            raise FileNotFoundError(f"{self.FILE_NAME} not found") from e
        
        except json.JSONDecodeError as e:
            raise ValueError("Invalid JSON format in story data file")from e