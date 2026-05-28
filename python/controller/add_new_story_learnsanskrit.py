from services.extract_new_fable_learnsanskrit import (
    FetchNewFable
)


class AddNewStory:

    def __init__(self, story_id, service=None):
        self.story_id = story_id
        
        # Instantiate the orchestration service safely
        if service is None:
            self.service = FetchNewFable()
        else:
            self.service = service

    def execute(self):
        try:
            # Pass the story_id to the execute method of the service
            pipeline_message = self.service.execute(self.story_id)

            # Check if our service explicitly returned an inner pipeline error string
            if "ERROR" in pipeline_message or "UNABLE" in pipeline_message:
                return {
                    "success": False,
                    "message": pipeline_message
                }, 400

            return {
                "success": True,
                "data": pipeline_message
            }

        except ValueError as e:
            return {
                "success": False,
                "message": str(e)
            }, 400

        except FileNotFoundError as e:
            return {
                "success": False,
                "message": str(e)
            }, 404

        except Exception as e:
            return {
                "success": False,
                "message": f"Internal Server Error: {str(e)}"
            }, 500