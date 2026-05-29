from flask import jsonify


def register_error_handlers(app):

    @app.errorhandler(ValueError)
    def handle_value_error(error):
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400


    @app.errorhandler(FileNotFoundError)
    def handle_file_error(error):
        return jsonify({
            "success": False,
            "message": str(error)
        }), 404


    @app.errorhandler(IOError)
    def handle_io_error(error):
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


    @app.errorhandler(Exception)
    def handle_exception(error):
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500