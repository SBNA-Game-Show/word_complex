
from repository.get_stroy_data_by_id import GetStoryData
from services.fable_extraction_pipeline.fetch_fable_from_learnsanskrit_complete import RetrieveStoryFromLearnSanskrit
from services.fable_extraction_pipeline.extract_data_learnsanskrit import ExtractDataFromLearnSanskrit
from services.fable_extraction_pipeline.tokenize_english_version_story import TokenizeEnglishVersion
from services.fable_extraction_pipeline.tokenize_sanskrit_version_story import TokenizeSanskritVersion
from utils.file_system_writer import WriteToFileSystem
class FetchNewFable:
    """Fetches the fable from learnsanskrit.cc cleans, tokenize both versions
    and writes to data folder
    """
    def __init__(self, id):
        self.FILE_NAME ="tokenized_stories.json"
        self.id = id        
        
        self.story_data = self.get_story_data()
        if not self.story_data:
            raise ValueError( "NO DATA FOUND BY GIVEN ID")
        
        self.vendor_id = self.get_vendor_id()
        self.raw_data = self.retrieve_raw_data()
        self.cleaned_data = self.clean_data()
        self.tokenized_english_version = self.tokenize_english_version()
        self.final_version = self.tokenize_sanskrit_version()
        
        self.write_to_file_system()
        
    
    ## step:1 Check if ID exists 1. CREATE A GENERIC READER CLASS THAT FILE NAME AS INPUT AND OUTPUTS THE DATA IN JSON FORMAT
    def get_story_data(self):
        
        story = GetStoryData(self.id)
        return story.response
    
    ## step:2 Fetch vendor id
    def get_vendor_id(self):
        return self.story_data.get("vendorId")
    
    ## step:3 Call RetrieveStoryFromLearnSanskrit
    def retrieve_raw_data(self):
        req = RetrieveStoryFromLearnSanskrit(self.vendor_id)
        return req.send_request()
        
    
    ## step:4 Call ExtractDataFromLearnSanskrit
    def clean_data(self):
        req = ExtractDataFromLearnSanskrit(self.raw_data)
        return req.get_json_data()
        
    
    ## step:5 Call TokenizeEnglishVersion
    
    def tokenize_english_version(self):
        req = TokenizeEnglishVersion(self.cleaned_data)
        return req.tokenize_english_version()
        
    
    ## step 6 Call TokenizeSanskritVersion
    
    def tokenize_sanskrit_version(self):
        req = TokenizeSanskritVersion(self.tokenized_english_version)
        return req.tokenize_sanskrit()
    
    ## step 7 Call WriteToFileSystem "WRITES TO DATA FOLDER"
    
    def write_to_file_system(self):
        return WriteToFileSystem(self.FILE_NAME,self.final_version)
    
    ## STEP 8 TO WRITE TO DATABASE 1. CREATE MONOGO SCHEMA 2. CREATE A CLASS THAT TAKES THE OUTPUT FROM TOKENIZEDSANSKRIT VERSION AND WRITES TO THE DATABASE
