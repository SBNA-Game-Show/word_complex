# swagger_config.py

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec_1",
            "route": "/apispec_1.json",
            "rule_filter": lambda rule: True,  # all endpoints
            "model_filter": lambda tag: True,  # all models
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs/"
}

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "Fable Extraction API",
        "description": "API documentation for the Sanskrit fable ingestion engine",
        "version": "1.0.0"
    }
}