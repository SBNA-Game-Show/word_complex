from repository.get_all_tokenized_stories_learnsanskrit import GetAllTokenizedStories

class RetrieveTokenizedStories:

    def get_all(self):
        try:
            data = GetAllTokenizedStories().get_all_stories()

            return {
                "success": True,
                "data": data
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }