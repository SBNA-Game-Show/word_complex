import re
from repository.get_stroy_data_by_id import GetStoryData
from repository.update_story_data_used import UpdateStoryDataUsedStatus
from services.fable_extraction_pipeline.fetch_fable_from_learnsanskrit_complete import RetrieveStoryFromLearnSanskrit
from services.fable_extraction_pipeline.extract_data_learnsanskrit import ExtractDataFromLearnSanskrit
from services.fable_extraction_pipeline.tokenize_english_version_story import TokenizeEnglishVersion
from services.fable_extraction_pipeline.tokenize_sanskrit_version_story import TokenizeSanskritVersion
from services.fable_extraction_pipeline.extract_english_synonym_antonym import ExtractEnglishSynonymAntonym
from utils.file_system_writer import WriteToFileSystem
from repository.write_tokenized_stories_to_mongodb import WriteTokenizedStoryToMongoDB

class FetchNewFable:
    """Orchestrates the pipeline to fetch, clean, tokenize, and save a fable."""

    def __init__(self, file_name="tokenized_stories.json"):
        self.file_name = file_name

    def execute(self, story_id):
        """Runs the complete execution pipeline for a given story ID."""
        
        # 1. Fetch metadata
        story_data = self._get_story_data(story_id)
        if not story_data:
            raise ValueError(f"No data found for the given ID: {story_id}")
            
        vendor_id = story_data.get("vendorId")
        
        if not vendor_id:
            raise ValueError("Vendor Id Mismatch")
        
        match = re.match(r"[a-zA-Z]+",vendor_id)
        
        if not match:
            raise ValueError(f"Invalid vendorId format: {vendor_id}")
        story_category = match.group()
        # 2. Extract & Transform
        raw_data = self._retrieve_raw_data(vendor_id)
        cleaned_data = self._clean_data(raw_data)
        ## Adding the same request id for the story
        cleaned_data["_id"] = story_id
        cleaned_data["category"] = story_category
        
        # 3. Enrich / Tokenize
        tokenized_english = self._tokenize_english_version(cleaned_data)
        tokenized_english_with_grammer = self._add_synonym_antonym(tokenized_english)
        final_version = self._tokenize_sanskrit_version(tokenized_english_with_grammer)
        
        
        # writing to mongo db database
        result = self._write_to_mongoDB(final_version)
        
        if result is None:
            return "Internal server Error"
        

        # Writes to the file system    
        # # 4. Load / Persist
        # write_success = self._write_to_file_system(final_version)
        # if not write_success:
        #     raise IOError("Failed writing tokenized story")
       
        # # 5. DB Updates
        # update_status = self._update_story_status(story_id)
        # if not update_status.get("success"):
        #     raise ValueError(update_status.get("message"))
            
        return {
            "success": True,
            "message": "Fable downloaded successfully"
        }

    # Helper methods 
    def _get_story_data(self, story_id):
        return GetStoryData(story_id).response
    
    def _retrieve_raw_data(self, vendor_id):
        return RetrieveStoryFromLearnSanskrit(vendor_id).send_request()
        
    def _clean_data(self, raw_data):
        return ExtractDataFromLearnSanskrit(raw_data).get_json_data()
        
    def _tokenize_english_version(self, cleaned_data):
        return TokenizeEnglishVersion(cleaned_data).tokenize_english_version()
    
    
    def _add_synonym_antonym(self, tokenized_english):
        return ExtractEnglishSynonymAntonym(tokenized_english).execute()
        
    def _tokenize_sanskrit_version(self, tokenized_english_with_grammar):
        return TokenizeSanskritVersion(tokenized_english_with_grammar).tokenize_sanskrit()
    
    def _write_to_mongoDB(self, story):
        writer = WriteTokenizedStoryToMongoDB(story)
        return writer.save_story()
    
    def _write_to_file_system(self, final_data):
        # FIXED: Wrapped in try-except to return a boolean result based on the writer's success
        try:
            WriteToFileSystem(self.file_name, final_data)
            return True
        except Exception as e:
            print(f"File writing error: {e}")
            return False
    
    def _update_story_status(self, story_id):
        updater = UpdateStoryDataUsedStatus(story_id)
        return updater.execute()