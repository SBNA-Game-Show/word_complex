from config.dbconfig import connect_db

db = connect_db()

story_validator = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "_id",
            "title",
            "englishVersion",
            "sanskritVersion",
            "category",
            "createdAt"
        ],
        "properties": {
            "_id": {
                "bsonType": "string",
                "description": "Story UUID"
            },

            "title": {
                "bsonType": "object",
                "required": [
                    "englishversion",
                    "sanskritversion"
                ],
                "properties": {
                    "englishversion": {
                        "bsonType": "string"
                    },
                    "sanskritversion": {
                        "bsonType": "string"
                    }
                }
            },

            "actors": {
                "bsonType": "array",
                "items": {
                    "bsonType": "string"
                }
            },

            "storyMoral": {
                "bsonType": "string"
            },

            "englishVersion": {
                "bsonType": "string"
            },

            "transliteratedVersion": {
                "bsonType": "array",
                "items": {
                    "bsonType": "string"
                }
            },

            "sanskritVersion": {
                "bsonType": "array",
                "items": {
                    "bsonType": "string"
                }
            },

            "category": {
                "bsonType": "string"
            },

            "createdAt": {
                "bsonType": "date"
            },

            "tokenized_english_version": {
                "bsonType": "array",
                "items": {
                    "bsonType": "object",
                    "properties": {
                        "text": {
                            "bsonType": "string"
                        },
                        "lemma": {
                            "bsonType": "string"
                        },
                        "pos": {
                            "bsonType": "string"
                        },
                        "synonyms": {
                            "bsonType": "array",
                            "items": {
                                "bsonType": "string"
                            }
                        },
                        "antonyms": {
                            "bsonType": "array",
                            "items": {
                                "bsonType": "string"
                            }
                        }
                    }
                }
            },

            "tokenized_sanskrit_version": {
                "bsonType": "array",
                "items": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "properties": {
                            "text": {
                                "bsonType": "string"
                            },
                            "lemma": {
                                "bsonType": "string"
                            },
                            "upos": {
                                "bsonType": "string"
                            },
                            "xpos": {
                                "bsonType": [
                                    "string",
                                    "null"
                                ]
                            },
                            "feats": {
                                "bsonType": "string"
                            }
                        }
                    }
                }
            }
        }
    }
}

db.create_collection(
    "tokenized_stories",
    validator=story_validator
)