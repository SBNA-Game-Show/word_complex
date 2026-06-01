import pytest
from unittest.mock import patch

from services.fable_extraction_pipeline.extract_english_synonym_antonym import (
    ExtractEnglishSynonymAntonym
)

# Tests synonym and antonym extraction functionality using mocked dependencies.
class TestExtractEnglishSynonymAntonym:

    # Provides sample tokenized English data for testing.
    @pytest.fixture
    def sample_data(self):
        return {
            "tokenized_english_version": [
                {
                    "text": "good",
                    "lemma": "good",
                    "pos": "ADJ"
                },
                {
                    "text": "run",
                    "lemma": "run",
                    "pos": "VERB"
                }
            ]
        }
    # Verifies extraction of tokenized English data from the input dictionary.
    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    def test_extract_data(self, mock_load_model):

        extractor = ExtractEnglishSynonymAntonym({
            "tokenized_english_version": [{"word": "test"}]
        })

        result = extractor._extract_data(extractor.data)

        assert result == [{"word": "test"}]
    # Verifies an empty list is returned when tokenized data is missing.
    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    def test_extract_data_missing_key(self, mock_load_model):

        extractor = ExtractEnglishSynonymAntonym({})

        result = extractor._extract_data(extractor.data)

        assert result == []
    # Verifies NOUN POS tags are correctly mapped to WordNet constants.
    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    def test_get_wordnet_pos_noun(self, mock_load_model):

        extractor = ExtractEnglishSynonymAntonym({})

        assert extractor._get_wordnet_pos("NOUN") is not None
    # Verifies VERB POS tags are correctly mapped to WordNet constants.
    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    def test_get_wordnet_pos_verb(self, mock_load_model):

        extractor = ExtractEnglishSynonymAntonym({})

        assert extractor._get_wordnet_pos("VERB") is not None
    # Verifies ADJ POS tags are correctly mapped to WordNet constants.
    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    def test_get_wordnet_pos_adj(self, mock_load_model):

        extractor = ExtractEnglishSynonymAntonym({})

        assert extractor._get_wordnet_pos("ADJ") is not None
        
    # Verifies ADV POS tags are correctly mapped to WordNet constants.
    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    def test_get_wordnet_pos_adv(self, mock_load_model):

        extractor = ExtractEnglishSynonymAntonym({})

        assert extractor._get_wordnet_pos("ADV") is not None
    # Verifies unsupported POS tags return None.
    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    def test_get_wordnet_pos_invalid(self, mock_load_model):

        extractor = ExtractEnglishSynonymAntonym({})

        assert extractor._get_wordnet_pos("XYZ") is None

    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    @patch.object(
        ExtractEnglishSynonymAntonym,
        "_get_synonyms",
        return_value=["excellent", "great"]
    )
    @patch.object(
        ExtractEnglishSynonymAntonym,
        "_get_antonyms",
        return_value=["bad"]
    )
    # Verifies valid tokens are enriched with synonyms and antonyms.
    def test_tokenize_words_valid(
        self,
        mock_antonyms,
        mock_synonyms,
        mock_load_model
    ):

        extractor = ExtractEnglishSynonymAntonym({})

        tokens = [
            {
                "lemma": "good",
                "pos": "ADJ"
            }
        ]

        result = extractor._tokenize_words(tokens)

        assert result[0]["synonyms"] == [
            "excellent",
            "great"
        ]

        assert result[0]["antonyms"] == [
            "bad"
        ]
    # Verifies tokens with unsupported POS tags receive empty synonym and antonym lists.
    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    def test_tokenize_words_invalid_pos(self, mock_load_model):

        extractor = ExtractEnglishSynonymAntonym({})

        tokens = [
            {
                "lemma": "good",
                "pos": "UNKNOWN"
            }
        ]

        result = extractor._tokenize_words(tokens)

        assert result[0]["synonyms"] == []
        assert result[0]["antonyms"] == []
    # Verifies non-alphabetic lemmas are skipped during synonym and antonym extraction.
    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    def test_tokenize_words_non_alpha(self, mock_load_model):

        extractor = ExtractEnglishSynonymAntonym({})

        tokens = [
            {
                "lemma": "12345",
                "pos": "NOUN"
            }
        ]

        result = extractor._tokenize_words(tokens)

        assert result[0]["synonyms"] == []
        assert result[0]["antonyms"] == []

    @patch.object(ExtractEnglishSynonymAntonym, "load_model")
    @patch.object(
        ExtractEnglishSynonymAntonym,
        "_tokenize_words"
    )
    # Verifies execute returns the enriched tokenized English data structure.
    def test_execute(self, mock_tokenize_words, mock_load_model):

        mock_tokenize_words.return_value = [
            {
                "lemma": "good",
                "synonyms": ["great"],
                "antonyms": ["bad"]
            }
        ]

        data = {
            "tokenized_english_version": [
                {
                    "lemma": "good",
                    "pos": "ADJ"
                }
            ]
        }

        extractor = ExtractEnglishSynonymAntonym(data)

        result = extractor.execute()

        assert "tokenized_english_version" in result

        assert result["tokenized_english_version"][0]["synonyms"] == [
            "great"
        ]

        assert result["tokenized_english_version"][0]["antonyms"] == [
            "bad"
        ]