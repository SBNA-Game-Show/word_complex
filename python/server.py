import json
import os
from flask import Flask,jsonify,request
from flask_cors import CORS
from config.envconfig import ENV
from config.dbconfig import connect_db

from flask_swagger_ui import get_swaggerui_blueprint

from controller.get_all_fable_title import GetAllFableTitleController
from bootstrap.bootstrap import AppBootstrap
from middleware.error_handler import (register_error_handlers)
from routes.story_data_routes import tokenize_data_bp



app = Flask(__name__)
CORS(app)


db = connect_db()

stories_collection = db.stories

BASE_DIR = os.path.dirname(__file__)

json_path = os.path.join(BASE_DIR, "data", "tokenized_stories.json")


# Bootstrap run
bootstrap = AppBootstrap(db, json_path)
bootstrap.seed()

baseUrl = "/api/v1/python"



app.register_blueprint(tokenize_data_bp,url_prefix=baseUrl)






# Returns the list of all story lists for download with titles
@app.route(f"{baseUrl}/getAllFableInfo", methods=["GET"])    
def get_unused_stories():
    controller = GetAllFableTitleController()
    result = controller.execute()
    return jsonify(result)




register_error_handlers(app)







if __name__ == '__main__':
       app.run(
        host="0.0.0.0",
        port=ENV["PORT"],
        debug=ENV["NODE_ENV"] == "development"
    )
    