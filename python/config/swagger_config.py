# swagger_config.py

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec_1",
            "route": "/apispec_1.json",
            "rule_filter": lambda rule: True,  # Document all endpoints
            "model_filter": lambda tag: True,  # Document all schemas
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api-docs/"                    # The URL path to view your UI
}

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "SB Python Module API's",
        "description": "This is Python module.",
        "version": "1.0.0"
    },
        "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme. Example: Bearer <token>"
        }
        }
}