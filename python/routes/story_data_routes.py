from flask import Blueprint
from flasgger import swag_from


from controller.story_data_learnsanskrit_controller import fetch_all_story_data



story_data_bp = Blueprint("story_data_bp",__name__)

decorated_controller = swag_from("../swaggerdocs/story_data/get_available_story_data_learnsanskrit.yml")(fetch_all_story_data)
story_data_bp.route("/getAll", methods=["GET"])(decorated_controller)