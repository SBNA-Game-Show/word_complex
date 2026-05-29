from flask import Blueprint
from controller.tokenized_data_learnsanskrit_controller import add_new_story


tokenize_data_bp = Blueprint("tokenize_data_bp",__name__)



#Post route that will take an id retrieve data from learn sanskrit.cc tokenize it and store it in data folder

tokenize_data_bp.route("/addNew",methods=["POST"])(add_new_story)