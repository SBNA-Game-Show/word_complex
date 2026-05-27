import json
import os
from flask import Flask,jsonify
from config.envconfig import ENV
from config.dbconfig import connect_db
from flasgger import Swagger


from controller.get_all_fable_title import GetAllFableTitleController
from bootstrap.bootstrap import AppBootstrap
from routes.available_fable_titles import fable_titles

app = Flask(__name__)

Swagger(app)

db = connect_db()

stories_collection = db.stories

BASE_DIR = os.path.dirname(__file__)

json_path = os.path.join(BASE_DIR, "data", "stories_data.json")


# Bootstrap run
bootstrap = AppBootstrap(db, json_path)
bootstrap.seed()

baseUrl = "/api/v1/python"


app.register_blueprint(fable_titles)

# @app.route("/")
# def hello_world():
#     stories_collection.insert_one({
#         "message": "Hello MongoDB"
#     })

#     return "<p>Hello World</p>"

# @app.route(f"{baseUrl}/getAllFableTitle", methods=["GET"])
# def get_unused_stories():
#     controller = GetAllFableTitleController()
#     result = controller.execute()
#     return jsonify(result)




if __name__ == '__main__':
       app.run(
        host="0.0.0.0",
        port=ENV["PORT"],
        debug=ENV["NODE_ENV"] == "development"
    )
    