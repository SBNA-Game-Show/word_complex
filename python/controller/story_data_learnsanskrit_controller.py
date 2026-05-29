
from flask import jsonify
from services.retrieve_all_story_data_learnsanskrit import RetrieveAllStoryDataLearnSanskrit



def fetch_all_story_data():

    service = RetrieveAllStoryDataLearnSanskrit()

    response = service.retrieve_all()

    if response["success"]:
        return jsonify(response), 200

    return jsonify(response), 500

