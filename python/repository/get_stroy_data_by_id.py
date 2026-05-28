from utils.file_system_reader import FileSystemReader


class GetStoryData:

    def __init__(self, story_id):
        self.FILE_NAME = "stories_data.json"
        self.story_id = story_id

        self.data = self.read_file()
        self.response = self.retrieve_story_data()

    def read_file(self):
        req = FileSystemReader(self.FILE_NAME)
        return req.read_file()

    def retrieve_story_data(self):

        if not self.data:
            return None

        for category in self.data:

            stories = category.get("story_description", [])

            for story in stories:

                if story.get("_id") == self.story_id:
                    return story

        return None