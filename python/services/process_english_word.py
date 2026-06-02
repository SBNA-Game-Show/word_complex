from services.tokenize_english_word.tokenize_english_word import TokenizeEnglishWord
from services.tokenize_english_word.get_synonyms import GetSynonyms
from services.tokenize_english_word.get_antonyms import GetAntonyms


import logging

logger = logging.getLogger(__name__)


class ProcessEnglishWord:

    def __init__(self, english_word):
        if not english_word:
            raise ValueError("English word is required")

        self.word = english_word

    def tokenize(self):
        try:
            token_data = self._tokenize_word(self.word)

            synonyms = self._get_synonyms(token_data)
            antonyms = self._get_antonyms(token_data)

            return {
                "token": token_data,
                "synonyms": synonyms,
                "antonyms": antonyms
            }

        except ValueError:
            # Preserve validation errors exactly as they are
            raise

        except Exception as e:
            logger.exception(
                "Failed processing word '%s'",
                self.word
            )

            raise RuntimeError(
                f"Failed to process word '{self.word}'"
            ) from e

    def _tokenize_word(self, word):
        req = TokenizeEnglishWord(word)
        return req.tokenize()

    def _get_synonyms(self, tokenized_word):
        req = GetSynonyms(tokenized_word)
        return req.execute()

    def _get_antonyms(self, tokenized_word):
        req = GetAntonyms(tokenized_word)
        return req.execute()