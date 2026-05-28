from repository.get_stroy_data_by_id import GetStoryData
# FIXED: Typo in 'upadate' -> 'update'
from repository.update_story_data_used import UpdateStoryDataUsedStatus
from services.fable_extraction_pipeline.fetch_fable_from_learnsanskrit_complete import RetrieveStoryFromLearnSanskrit
from services.fable_extraction_pipeline.extract_data_learnsanskrit import ExtractDataFromLearnSanskrit
from services.fable_extraction_pipeline.tokenize_english_version_story import TokenizeEnglishVersion
from services.fable_extraction_pipeline.tokenize_sanskrit_version_story import TokenizeSanskritVersion
from utils.file_system_writer import WriteToFileSystem

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

        # 2. Extract & Transform
        raw_data = self._retrieve_raw_data(vendor_id)
        cleaned_data = self._clean_data(raw_data)
        
        cleaned_data["_id"] = story_id
        
        # 3. Enrich / Tokenize
        tokenized_english = self._tokenize_english_version(cleaned_data)
        final_version = self._tokenize_sanskrit_version(tokenized_english)
        

        
        # 4. Load / Persist
        write_success = self._write_to_file_system(final_version)
        if not write_success:
            return "ERROR OCCURRED ATTEMPTING TO WRITE FILE."
       
        # 5. DB Updates
        update_status = self._update_story_status(story_id)
        if not update_status:
            return "UNABLE TO UPDATE STATUS"
            
        return "FABLE DOWNLOADED SUCCESSFULLY"

    # Helper methods 
    def _get_story_data(self, story_id):
        return GetStoryData(story_id).response
    
    def _retrieve_raw_data(self, vendor_id):
        return RetrieveStoryFromLearnSanskrit(vendor_id).send_request()
        
    def _clean_data(self, raw_data):
        return ExtractDataFromLearnSanskrit(raw_data).get_json_data()
        
    def _tokenize_english_version(self, cleaned_data):
        return TokenizeEnglishVersion(cleaned_data).tokenize_english_version()
        
    def _tokenize_sanskrit_version(self, tokenized_english):
        return TokenizeSanskritVersion(tokenized_english).tokenize_sanskrit()
    
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