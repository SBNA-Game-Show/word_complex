import json
from bs4 import BeautifulSoup


class ExtractDataFromLearnSanskrit:
    """Given raw data this class extracts all the required files from the data provided
    NOTE: Specific to learnsanskrit.cc page
    """

    def __init__(self, data):

        self.data = self.parse_json(data)
        
        self.english_title = self.extract_english_title()
        self.actors = self.extract_actors()
        self.moral = self.extract_moral()
        self.english_version = self.extract_english_version_story()
        self.transliterated_version = self.extract_transliterated_version_story()
        self.sanskrit_version = self.extract_sanskrit_version_story()
        self.sanskrit_title = self.extracting_sanskrit_version_story_title()
        
    
    def parse_json(self,data):
        """Parsing the input json data"""
        try:
            if isinstance (data,(dict,list)):
                return data
            
            return json.loads(data)
        
        except(ValueError,TypeError):
            raise ValueError("INVALID JSON DATA")
        

       
    def extract_english_title(self):
        """Extracting English Title from fable"""
        title_data = self.data['data']['summary_head']
        return title_data[0]
    
    def extract_actors(self):
        """Extracting Actor Names"""
        title = self.english_title
        title.replace(" ","")
        return title.split(", ")
    
    def extract_moral(self):
        """Extracting Moral from Fable"""
        title_data = self.data['data']['summary_head']
        story_moral = title_data[1]
        story_moral.replace("(","")
        story_moral.replace(")","")
        return story_moral
    
    def extract_english_version_story(self):
        """Extracting english version story"""
        return self.data['data']['summary_text']
    
    
    def extract_transliterated_version_story(self):
        """Extracting Transliterd version"""
        transliterated_version =[]
        transliterated_texts = self.data["data"]["texts"]
        
        for section in transliterated_texts:
            
            soup = BeautifulSoup(section,"html.parser")
            divs = soup.find_all("div")
            
            words =[]
            
            for div in divs:
                data = div.get_text(strip=True)
                data.replace("\n","").replace("","")
                
                if data == "":
                    continue
                
                if data.isdigit():
                    continue
                
                words.append(data)
                
            if words:
                transliterated_version.append(" ".join(words))
            
        
        return transliterated_version
    
    def extract_sanskrit_version_story(self):
        """Extracting Transliterd version"""
        sanskrit_version =[]
        sanskrit_texts = self.data["data"]["textsdeva"]
        
        for section in sanskrit_texts:
            
            soup = BeautifulSoup(section,"html.parser")
            divs = soup.find_all("div")
            
            words =[]
            
            for div in divs:
                data = div.get_text(strip=True)
                data = data.replace("\n","").replace("\\","")
                
                
                if data == "":
                    continue
                
                if data.isdigit():
                    continue
                
                words.append(data)
                
            if words:
                sanskrit_version.append(" ".join(words))
            
        
        return sanskrit_version
    
    def extracting_sanskrit_version_story_title(self):
        return self.sanskrit_version[0]
    
    
    def get_json_data(self):
        return {
            "title": {
                "englishversion": self.english_title,
                "sanskritversion": self.sanskrit_title
            },
            "actors": self.actors,
            "storyMoral": self.moral,
            "englishVersion": self.english_version,
            "transliteratedVersion": self.transliterated_version,
            "sanskritVersion": self.sanskrit_version
        }
        
        
        
        