from bs4 import BeautifulSoup
import requests
import urllib3
import json


class RetrieveStoryFromLearnSanskrit:
    """Sends request to the page to extract t"""

    BASE_URL = "https://learnsanskrit.cc/fables/story"

    def __init__(self, storyNumber):

        self.storyNumber = storyNumber

        # disable SSL warnings
        urllib3.disable_warnings(
            urllib3.exceptions.InsecureRequestWarning
        )

        # generate URL automatically
        self.url = self.generate_url()


    def generate_url(self):
        """Generating required URL using the input"""

        return f"{self.BASE_URL}?name={self.storyNumber}&active=true"

    def send_request(self):
        response = requests.get(
            self.url,
            verify=False,
            timeout=10
        )

        # safer handling (prevents crash if response is not JSON)
        try:
            return response.json()
        except ValueError:
            return {
                "success": False,
                "error": "Invalid JSON response",
                "status_code": response.status_code,
                "text": response.text
            }