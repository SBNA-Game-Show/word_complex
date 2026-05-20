import logging
import logging.config
import json
from flask import Flask

app = Flask(__name__)







@app.route("/")
def hello_world():
    """Home endpoint that returns a greeting."""
    return "<p>Hello World</p>"




if __name__ == '__main__':
    app.run(debug=True,use_reloader=False, host='0.0.0.0', port=5001)