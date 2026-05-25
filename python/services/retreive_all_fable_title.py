import os
import json


class RetrieveAllFableTitle:

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # /app
    file_path = os.path.join(BASE_DIR, "data", "stories_data.json")

    def __init__(self):

        with open(self.file_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

        self.stories = self.return_all_stories()

    def validate_story(self, story):
        return story.get("used") is False

    def return_all_stories(self):

        unused_stories = []

        for category, stories in self.data.items():
            for story in stories:
                if self.validate_story(story):
                    unused_stories.append(story)

        return unused_stories