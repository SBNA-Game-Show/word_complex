import json
import os
from utils.file_system_reader import FileSystemReader


class RetrieveAllFableTitle:

    def __init__(self):
        self.FILE_NAME = "stories_data.json"
        self.data = self.read_data()

    def read_data(self):
        reader = FileSystemReader(self.FILE_NAME)
        return reader.read_file()

    def validate_story(self, story):
        return story.get("used") is False

    def return_all_stories(self):
        """Returning all stories"""

        unused_stories = []

        # data is a list of categories
        for category in self.data:

            stories = category.get("story_description", [])

            for story in stories:

                if self.validate_story(story):
                    unused_stories.append(story)

        return unused_stories