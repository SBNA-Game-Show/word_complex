import json
from flask import Flask
from config.envconfig import ENV
from config.dbconfig import connect_db

app = Flask(__name__)

db = connect_db()

stories_collection = db.stories






@app.route("/")
def hello_world():
    stories_collection.insert_one({
        "message": "Hello MongoDB"
    })

    return "<p>Hello World</p>"




if __name__ == '__main__':
    app.run(
        host="0.0.0.0",
        port=ENV["PORT"],
        debug=ENV["NODE_ENV"] == "development"
    )