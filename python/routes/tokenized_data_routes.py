from flask import Blueprint
from controller.tokenized_data_learnsanskrit_controller import add_new_story,fetch_all_tokenized_stories,fetch_tokenized_story_by_id


tokenize_data_bp = Blueprint("tokenize_data_bp",__name__)



#Post route that will take an id retrieve data from learn sanskrit.cc tokenize it and store it in data folder

tokenize_data_bp.route("/addNew",methods=["POST"])(add_new_story)

## Get all tokenized stories
tokenize_data_bp.route("/getAllTokenized",methods=["GET"])(fetch_all_tokenized_stories)

## Get tokenized story by Id
tokenize_data_bp.route("/getTokenizedById",methods=["GET"])(fetch_tokenized_story_by_id)