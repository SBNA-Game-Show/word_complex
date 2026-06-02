from flask import Blueprint
from flasgger import swag_from


from controller.dictionary_controller import tokenize_english_word


dictionary_bp = Blueprint("dictionary_bp",__name__)


# Get Route to tokenize english word with parts of speech and synonyms and antonyms

decorated_english_controller = swag_from("../swaggerdocs/dictionary/process_english_word.yml")(tokenize_english_word)
dictionary_bp.route("/getEnglish",methods=["GET"])(decorated_english_controller)
