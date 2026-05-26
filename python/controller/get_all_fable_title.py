from services.retreive_all_fable_title import RetrieveAllFableTitle


class GetAllFableTitleController:

    def __init__(self, service=None):

        if service is None:
            service = RetrieveAllFableTitle()

        self.service = service

    def execute(self):

        stories = self.service.return_all_stories()

        if not stories:
            return {
                "success": True,
                "count": 0,
                "message": "YOU HAVE DOWNLOADED ALL STORIES FROM LEARN SANSKRIT WEB PAGE",
                "data": []
            }

        return {
            "success": True,
            "count": len(stories),
            "data": stories
        }