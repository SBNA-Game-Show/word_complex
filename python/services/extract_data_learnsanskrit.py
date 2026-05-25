import json


class ExtractDataFromLearnSanskrit:

    def __init__(self, data):

        self.data = data
        self.valid_json = self.is_json(data)

    def is_json(self, data):

        try:
            # if data is already a dict/list
            if isinstance(data, (dict, list)):
                return True

            # if data is a JSON string
            json.loads(data)

            return True

        except (ValueError, TypeError):
            return False