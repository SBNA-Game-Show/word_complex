import json
import os
from flask import Flask,jsonify,request
from flask_cors import CORS
from config.envconfig import ENV
from config.dbconfig import connect_db

from flask_swagger_ui import get_swaggerui_blueprint

from controller.get_all_fable_title import GetAllFableTitleController
from controller.add_new_story_learnsanskrit import AddNewStory
from bootstrap.bootstrap import AppBootstrap



app = Flask(__name__)
CORS(app)


db = connect_db()

stories_collection = db.stories

BASE_DIR = os.path.dirname(__file__)

json_path = os.path.join(BASE_DIR, "data", "tokenized_stories.json")
OPENAPI_PATH = os.path.join(BASE_DIR,"config","swaggerconfig.json")


# Bootstrap run
bootstrap = AppBootstrap(db, json_path)
bootstrap.seed()

baseUrl = "/api/v1/python"



# @app.route("/")
# def hello_world():
#     stories_collection.insert_one({
#         "message": "Hello MongoDB"
#     })

#     return "<p>Hello World</p>"

@app.route("/openapi.json")
def openapi():
    with open(OPENAPI_PATH, "r", encoding="utf-8") as f:
        return jsonify(json.load(f))

# Returns the list of all story lists for download with titles
@app.route(f"{baseUrl}/getAllFableInfo", methods=["GET"])    
def get_unused_stories():
    controller = GetAllFableTitleController()
    result = controller.execute()
    return jsonify(result)


# Post request for adding a new story to collection
@app.route(f"{baseUrl}/addNewFable", methods=["POST"])
def add_new_fable():

    story_id = request.args.get("story_id")

    if not story_id:
        return jsonify({
            "success": False,
            "message": "story_id query parameter is required"
        }), 400

    controller = AddNewStory(story_id)

    response = controller.execute()

    return jsonify(response)


SWAGGER_URL = "/api-docs"
API_URL = "/openapi.json"

swagger_ui = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={"app_name": "SB Canada API"}
)

app.register_blueprint(swagger_ui, url_prefix=SWAGGER_URL)




if __name__ == '__main__':
       app.run(
        host="0.0.0.0",
        port=ENV["PORT"],
        debug=ENV["NODE_ENV"] == "development"
    )
    