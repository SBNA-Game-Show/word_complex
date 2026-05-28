import spacy


class TokenizeEnglishVersion:

    def __init__(self, data):
        self.data = data
        self.nlp = spacy.load("en_core_web_sm")

    def load_english_version_story(self):

        if isinstance(self.data, dict):
            return self.data.get("englishVersion", "")

        if isinstance(self.data, list):
            # try safe extraction from list of dicts
            return " ".join(
                item.get("englishVersion", "")
                for item in self.data
                if isinstance(item, dict)
            )

        return ""

    def load_sentence_to_model(self):
        text = self.load_english_version_story()
        return self.nlp(text)

    def tag_words(self):
        doc = self.load_sentence_to_model()

        tagged_words = []

        for token in doc:
            tagged_words.append({
                "text": token.text,
                "lemma": token.lemma_,
                "pos": token.pos_,
                # "tag": token.tag_,
                # "dep": token.dep_,
                # "is_alpha": token.is_alpha,
                # "is_stop": token.is_stop
            })

        return tagged_words

    def tokenize_english_version(self):
        """
        Pipeline step:
        enrich original object and pass forward
        """

        tokenized = self.tag_words()

        # IMPORTANT: do not mutate original object directly
        new_data = self.data.copy()

        new_data["tokenized_english_version"] = tokenized

        return new_data