from datetime import datetime
import json
import os


class UpdateStoryDataUsedStatus:

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "stories_data.json")

    def __init__(self, story_identifier, used=True):
        # Keep constructor lightweight
        self.story_identifier = story_identifier
        self.used = used

    def execute(self):
        """Loads data, searches for the nested story by ID or vendorId, updates it, and saves."""
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            return {
                "success": False,
                "message": f"Failed to open source file: {str(e)}"
            }

        story_found = False

        # Iterate through story categories (Aesop, Panchatantra, etc.)
        for category in data:
            stories = category.get("story_description", [])

            # Iterate through individual nested story objects
            for story in stories:
                # Flexible Match: Check against both unique _id (UUID) and vendorId string
                if (story.get("_id") == self.story_identifier or 
                    story.get("vendorId") == self.story_identifier):

                    story["used"] = self.used
                    story["updatedOn"] = datetime.now().isoformat()

                    story_found = True
                    break

            if story_found:
                break

        if not story_found:
            return {
                "success": False,
                "message": f"Story identifier '{self.story_identifier}' not found in database."
            }

        # Persist variations back to json file storage
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed writing updates to disk: {str(e)}"
            }

        return {
            "success": True,
            "storyIdentifier": self.story_identifier,
            "used": self.used
        }