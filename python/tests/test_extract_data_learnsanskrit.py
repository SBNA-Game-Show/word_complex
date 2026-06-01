import json
import pytest

from services.fable_extraction_pipeline.extract_data_learnsanskrit import (
    ExtractDataFromLearnSanskrit
)

# Tests data extraction and transformation from LearnSanskrit API responses.
class TestExtractDataFromLearnSanskrit:

    # Provides sample LearnSanskrit API response data for testing.
    @pytest.fixture
    def sample_data(self):
        """
        Sample data that mimics the LearnSanskrit API response.
        """
        return {
            "data": {
                "summary_head": [
                    "Lion, Mouse",
                    "Kindness is rewarded"
                ],
                "summary_text": "A lion once spared a mouse.",
                "texts": [
                    "<div>siṃhaḥ</div><div>mūṣakaḥ</div>"
                ],
                "textsdeva": [
                    "<div>सिंहः</div><div>मूषकः</div>"
                ]
            }
        }
    # Verifies that dictionary input is accepted without modification.
    def test_parse_json_dictionary(self, sample_data):
        extractor = ExtractDataFromLearnSanskrit(sample_data)
        assert extractor.data == sample_data
    # Verifies that a JSON string is correctly parsed into a dictionary.
    def test_parse_json_string(self, sample_data):
        json_string = json.dumps(sample_data)

        extractor = ExtractDataFromLearnSanskrit(json_string)

        assert extractor.data == sample_data
    # Verifies that invalid JSON input raises a ValueError.
    def test_parse_json_invalid_data(self):
        with pytest.raises(ValueError) as exc:
            ExtractDataFromLearnSanskrit("INVALID_JSON")

        assert str(exc.value) == "INVALID JSON DATA"
    # Verifies extraction of the English story title.
    def test_extract_english_title(self, sample_data):
        extractor = ExtractDataFromLearnSanskrit(sample_data)

        assert extractor.english_title == "Lion, Mouse"
    # Verifies extraction of actor names from the title.
    def test_extract_actors(self, sample_data):
        extractor = ExtractDataFromLearnSanskrit(sample_data)

        assert extractor.actors == [
            "Lion",
            "Mouse"
        ]
    # Verifies extraction of the story moral.
    def test_extract_moral(self, sample_data):
        extractor = ExtractDataFromLearnSanskrit(sample_data)

        assert extractor.moral == "Kindness is rewarded"
    # Verifies extraction of the English version of the story.
    def test_extract_english_story(self, sample_data):
        extractor = ExtractDataFromLearnSanskrit(sample_data)

        assert extractor.english_version == "A lion once spared a mouse."
    # Verifies extraction of transliterated Sanskrit content.
    def test_extract_transliterated_version(self, sample_data):
        extractor = ExtractDataFromLearnSanskrit(sample_data)

        assert extractor.transliterated_version == [
            "siṃhaḥ mūṣakaḥ"
        ]
    # Verifies extraction of Sanskrit text content.
    def test_extract_sanskrit_version(self, sample_data):
        extractor = ExtractDataFromLearnSanskrit(sample_data)

        assert extractor.sanskrit_version == [
            "सिंहः मूषकः"
        ]
    # Verifies the Sanskrit title is extracted from the first Sanskrit entry.
    def test_extract_sanskrit_title(self, sample_data):
        extractor = ExtractDataFromLearnSanskrit(sample_data)

        assert extractor.sanskrit_title == "सिंहः मूषकः"

    # Verifies the final JSON structure contains all expected fields.
    def test_get_json_data(self, sample_data):
        extractor = ExtractDataFromLearnSanskrit(sample_data)

        result = extractor.get_json_data()

        assert result == {
            "title": {
                "englishversion": "Lion, Mouse",
                "sanskritversion": "सिंहः मूषकः"
            },
            "actors": [
                "Lion",
                "Mouse"
            ],
            "storyMoral": "Kindness is rewarded",
            "englishVersion": "A lion once spared a mouse.",
            "transliteratedVersion": [
                "siṃhaḥ mūṣakaḥ"
            ],
            "sanskritVersion": [
                "सिंहः मूषकः"
            ]
        }
# Verifies empty and numeric transliterated values are ignored.
    def test_empty_transliterated_sections(self):
        data = {
            "data": {
                "summary_head": [
                    "Lion",
                    "Moral"
                ],
                "summary_text": "Story",
                "texts": [
                    "<div></div><div>123</div><div>word</div>"
                ],
                "textsdeva": [
                    "<div>शब्द</div>"
                ]
            }
        }

        extractor = ExtractDataFromLearnSanskrit(data)

        assert extractor.transliterated_version == [
            "word"
        ]
    # Verifies empty and numeric Sanskrit values are ignored.
    def test_empty_sanskrit_sections(self):
        data = {
            "data": {
                "summary_head": [
                    "Lion",
                    "Moral"
                ],
                "summary_text": "Story",
                "texts": [
                    "<div>word</div>"
                ],
                "textsdeva": [
                    "<div></div><div>123</div><div>शब्द</div>"
                ]
            }
        }

        extractor = ExtractDataFromLearnSanskrit(data)

        assert extractor.sanskrit_version == [
            "शब्द"
        ]