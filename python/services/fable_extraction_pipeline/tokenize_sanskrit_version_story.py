import stanza
from nlp.stanza_loader import sanskrit_nlp

class TokenizeSanskritVersion:
    def __init__(self, data):
        self.data = data
        # We explicitly activate the 'tokenize' processor with default segmenter options
        self.nlp = sanskrit_nlp
        self.sentences = self.data.get("sanskritVersion", [])
        
    def tag_words(self):
        tokenized_sanskrit = []

        for sentence in self.sentences:
            clean_sentence = str(sentence).strip()
            
            # Stanza will do its best to segment the joined string based on its training data
            doc = self.nlp(clean_sentence)
            sentence_tokens = []

            for sent in doc.sentences:
                for word in sent.words:
                    if not word.text.strip():
                        continue
                        
                    sentence_tokens.append({
                        "text": word.text,
                        "lemma": word.lemma.strip("-").split("_")[0] if word.lemma else word.text,
                        "upos": word.upos,
                        "xpos": word.xpos if word.xpos else None,
                        "feats": word.feats if word.feats else "_"
                    })

            tokenized_sanskrit.append(sentence_tokens)

        return tokenized_sanskrit
    
    def tokenize_sanskrit(self):
        tokenized = self.tag_words()
        new_data = self.data.copy()
        new_data["tokenized_sanskrit_version"] = tokenized
        return new_data