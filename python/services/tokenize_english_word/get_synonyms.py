from nltk.corpus import wordnet
from services.tokenize_english_word.get_wordnet_POS import GetWordNetPos


class GetSynonyms:
    def __init__(self, token_data):
        if not token_data:
            raise ValueError("Token data is required")
        self.token_data = token_data

    def execute(self):
        token = self.token_data
        wn_pos = GetWordNetPos(token["pos"]).get()
        word = token["lemma"].lower()

        # Fetch synsets with POS filter
        synsets = wordnet.synsets(word, pos=wn_pos)

        # Fallback if no synsets found with specific POS
        if not synsets:
            synsets = wordnet.synsets(word)

        if not synsets:
            return []

        synonyms = set()

        # Iterate through ALL synsets to catch the rich vocabulary
        for synset in synsets:
            for lemma in synset.lemmas():
                candidate = lemma.name().replace("_", " ").lower()

                # Ensure it's not the original word and doesn't just contain it (e.g., "goodness")
                if candidate != word and word not in candidate.split():
                    synonyms.add(candidate)

        return sorted(list(synonyms))