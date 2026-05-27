import stanza
class TokenizeSanskritVersion:
    def __init__(self,data):
        self.data = data
        self.nlp = self.load_model()
        self.text = self.load_sanskrit_story()
        self.doc = self.load_sentence_to_model()
        
    def load_model(self):
        return stanza.Pipeline('sa')
        
    def load_sanskrit_story(self):
        return self.data.get("sanskritVersion")
    
    def load_sentence_to_model(self):
        
        text = self.load_sanskrit_story()
        
        return self.nlp(text)
    
    def tag_words(self):

        tokenized_sanskrit = []

        for sentence in self.doc.sentences:

            sentence_tokens = []

            for word in sentence.words:

                sentence_tokens.append({
                    "text": word.text,
                    "lemma": word.lemma.strip("-").split("_")[0] if word.lemma else word.text,
                    "upos": word.upos,
                    "xpos": word.xpos,
                    "feats": word.feats if word.feats else "_"
                })

            tokenized_sanskrit.append(sentence_tokens)

        return tokenized_sanskrit
    
    def tokenize_sanskrit(self):
            
            tokenized = self.tag_words()
            
            new_data = self.data.copy()
            
            new_data["tokenized_sanskrit_version"] = tokenized
            
            return new_data