import spacy
import nltk
from nltk.corpus import wordnet


class ExtractEnglishSynonymAntonym:
    """Extract synonyms and antonyms using spaCy + WordNet"""

    def __init__(self, data):
        self.data = data
        self.nlp = self.load_model()

    def load_model(self):

        nltk.download("wordnet", quiet=True)
        nltk.download("omw-1.4", quiet=True)

        return spacy.load("en_core_web_sm")

    def _extract_data(self, data):
        return data.get("tokenized_english_version", [])

    def _get_synonyms(self, word, wn_pos):
        synonyms = set()

        for syn in wordnet.synsets(word, pos=wn_pos):
            for lemma in syn.lemmas():
                synonyms.add(lemma.name())

        return list(synonyms)

    def _get_antonyms(self, word, wn_pos):
        antonyms = set()

        for syn in wordnet.synsets(word, pos=wn_pos):
            for lemma in syn.lemmas():
                for ant in lemma.antonyms():
                    antonyms.add(ant.name())

        return list(antonyms)

    def _get_wordnet_pos(self, pos):
        if pos == "NOUN":
            return wordnet.NOUN
        elif pos == "VERB":
            return wordnet.VERB
        elif pos == "ADJ":
            return wordnet.ADJ
        elif pos == "ADV":
            return wordnet.ADV
        return None

    def _tokenize_words(self, data):

        updated_tokens = []

        for token in data:

            lemma = token.get("lemma", "")
            pos = token.get("pos")

            wn_pos = self._get_wordnet_pos(pos)

            if wn_pos is None or not isinstance(lemma, str) or not lemma.isalpha():
                token["synonyms"] = []
                token["antonyms"] = []
                updated_tokens.append(token)
                continue

            token["synonyms"] = self._get_synonyms(lemma, wn_pos)
            token["antonyms"] = self._get_antonyms(lemma, wn_pos)

            updated_tokens.append(token)

        return updated_tokens

    def execute(self):

        data = self._extract_data(self.data)
        tokenized_data = self._tokenize_words(data)

        new_data = self.data.copy()
        new_data["tokenized_english_version"] = tokenized_data

        return new_data