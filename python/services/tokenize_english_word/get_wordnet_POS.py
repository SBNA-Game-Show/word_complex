from nltk.corpus import wordnet


class GetWordNetPos:

    def __init__(self, pos):
        self.pos = pos

    def get(self):
        if self.pos == "NOUN":
            return wordnet.NOUN
        elif self.pos == "VERB":
            return wordnet.VERB
        elif self.pos == "ADJ":
            return wordnet.ADJ
        elif self.pos == "ADV":
            return wordnet.ADV

        return None