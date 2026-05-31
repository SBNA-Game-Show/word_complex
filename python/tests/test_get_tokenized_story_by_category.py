from unittest.mock import patch
from repository.get_tokenized_story_by_category import GetTokenizedStoryByCategory

class TestGetTokebizedStoryByCategory:
    @patch(
        "repository.get_tokenized_story_by_category"
    )
    def 