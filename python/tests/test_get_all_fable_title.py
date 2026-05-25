from controller.get_all_fable_title import GetAllFableTitleController


class FakeService:
    def __init__(self):
        self.stories = [
            {"storyNumber": "aesop01", "used": False},
            {"storyNumber": "aesop02", "used": False}
        ]


def test_controller_returns_data():

    service = FakeService()
    controller = GetAllFableTitleController(service=service)

    result = controller.execute()

    assert result["success"] is True
    assert result["count"] == 2
    assert isinstance(result["data"], list)
    assert len(result["data"]) == 2