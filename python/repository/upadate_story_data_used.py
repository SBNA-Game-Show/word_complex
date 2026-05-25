import os
import json
from datetime import datetime


class UpdateStoryDataUsedStatus:

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "data", "stories_data.json")

    def __init__(self, storyName, used=True):

        self.storyName = storyName
        self.used = used

        with open(self.file_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

        self.result = self.execute_update()

    def execute_update(self):

        story_found = False

        for category, stories in self.data.items():

            for story in stories:

                if story.get("storyNumber") == self.storyName:

                    story["used"] = self.used
                    story["updatedOn"] = datetime.now().isoformat()

                    story_found = True
                    break

            if story_found:
                break

        if not story_found:
            return {
                "success": False,
                "message": f"Story '{self.storyName}' not found"
            }

        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=4, ensure_ascii=False)

        return {
            "success": True,
            "storyNumber": self.storyName,
            "used": self.used
        }