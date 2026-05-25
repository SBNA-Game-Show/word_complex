from services.extract_data_learnsanskrit import ExtractDataFromLearnSanskrit


# ✅ VALID JSON STRING
valid_data = """
{
    "title": "The Rabbit / Fox (Story)",
    "storyNumber": "aesop01",
    "used": false,
    "actors": [
        "rabbit",
        "fox"
    ]
}
"""


# ❌ INVALID JSON STRING
invalid_data = """
{
    title: "The Rabbit / Fox (Story)",
    storyNumber: "aesop01",
    used: false,
}
"""


def test_valid_json():

    extractor = ExtractDataFromLearnSanskrit(valid_data)

    assert extractor.valid_json is True


def test_invalid_json():

    extractor = ExtractDataFromLearnSanskrit(invalid_data)

    assert extractor.valid_json is False