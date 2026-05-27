from flask import Blueprint, jsonify
from controller.get_all_fable_title import GetAllFableTitleController

fable_titles = Blueprint(
    "fable_bp",
    __name__,
    url_prefix="/api/v1/python"
)


@fable_titles.route("/getAllFableTitle", methods=["GET"])
def get_all_fable_titles():
    """
    Get all unused fable titles
    ---
    tags:
      - Fables

    responses:
      200:
        description: List of unused stories
        schema:
          type: object
          properties:
            success:
              type: boolean

            count:
              type: integer

            message:
              type: string

            data:
              type: array
              items:
                type: object
    """

    controller = GetAllFableTitleController()

    return jsonify(controller.execute())