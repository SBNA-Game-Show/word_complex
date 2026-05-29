from flask import jsonify, request
from services.extract_new_fable_learnsanskrit import FetchNewFable


## Adding a new story to the collection
def add_new_story():

    # FETCH QUERY PARAM
    story_id = request.args.get("story_id")

    # validate input
    if not story_id:
        return jsonify({
            "success": False,
            "message": "story_id query parameter is required"
        }), 400

    service = FetchNewFable()
    result = service.execute(story_id)

    return jsonify({
        "success": True,
        "data": result
    }), 200
    
## Get All tokenized stories from collection

## Get tokenized story by id

## Get tokenized story by category

