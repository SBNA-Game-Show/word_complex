from services.extract_new_fable_learnsanskrit import (
    FetchNewFable
)


class AddNewStory:

    def __init__(self, story_id, service=None):

        self.story_id = story_id

        if service is None:

            service = FetchNewFable

        self.service = service

    def execute(self):

        try:

            result = self.service(
                self.story_id
            )

            return {
                "success": True,
                "message": "Story added successfully",
                "data": result.final_version
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