import spacy

class TokenizeEnglishWord:

    def __init__(self, english_word):
        if not english_word:
            raise ValueError("English Word is Required")

        self.word = english_word

        # load model once per instance (works, but see note below for optimization)
        self.nlp = spacy.load("en_core_web_sm")

    def tokenize(self):
        doc = self.nlp(self.word)

        # safer: handle full doc, not just first token
        token = doc[0]

        return {
            "text": token.text,
            "pos": token.pos_,      # VERB, NOUN, ADJ, ADV
            "lemma": token.lemma_
        }