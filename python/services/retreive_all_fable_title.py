import json
import os


class RetrieveAllFableTitle:

    def __init__(self):
        BASE_DIR = os.path.dirname(os.path.dirname(__file__))

        json_path = os.path.join(
            BASE_DIR,
            "data",
            "stories_data.json"
        )

        with open(json_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

    def validate_story(self, story):
        """
        Example validation
        """
        return True

    def return_all_stories(self):
        """Returning all stories"""

        unused_stories = []

        # self.data is a LIST
        for story in self.data:

            if self.validate_story(story):
                unused_stories.append(story)

        return unused_stories