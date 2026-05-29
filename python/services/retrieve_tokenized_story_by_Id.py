from repository.get_tokenized_story_by_Id import GetTokenizedStoryById


class RetrieveTokenizedStoryById:

    def __init__(self, story_id):

        if story_id is None:
            raise ValueError("story_id cannot be None")

        self.story_id = story_id

    def retrieve_story(self):

        repository = GetTokenizedStoryById(self.story_id)

        story = repository.retrieve_story()

        if story is None:
            raise LookupError("Story not found")

        return story