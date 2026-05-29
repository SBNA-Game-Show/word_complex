from flask import Blueprint
from controller.story_data_learnsanskrit_controller import fetch_all_story_data


story_data_bp = Blueprint("story_data_bp",__name__)


story_data_bp.route("/getAll", methods=["GET"])(fetch_all_story_data)