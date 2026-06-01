from datetime import datetime


class TokenizedStoryMapper:
    
    @staticmethod
    def to_schema(story_data:dict)->dict:
        return{
             "_id": story_data.get("_id"),

            "title": {
                "englishversion": story_data.get("title", {}).get("englishversion"),
                "sanskritversion": story_data.get("title", {}).get("sanskritversion")
            },

            "actors": story_data.get("actors", []),

            "storyMoral": story_data.get("storyMoral", ""),

            "englishVersion": story_data.get("englishVersion", ""),

            "transliteratedVersion": story_data.get(
                "transliteratedVersion",
                []
            ),

            "sanskritVersion": story_data.get(
                "sanskritVersion",
                []
            ),

            "category": story_data.get("category"),

            "tokenized_english_version": story_data.get(
                "tokenized_english_version",
                []
            ),

            "tokenized_sanskrit_version": story_data.get(
                "tokenized_sanskrit_version",
                []
            ),

            "createdAt": datetime.utcnow()
            
        }
    