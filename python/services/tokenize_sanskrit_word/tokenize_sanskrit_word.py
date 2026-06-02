import stanza

class AnalyzeIsolatedSanskritWord:
    def __init__(self, sanskrit_word):
        self.word = sanskrit_word.strip()
        # Initialize Stanza's Sanskrit pipeline (processors: tokenize and POS/Morphology tagging)
        # 'sa' is the ISO code for Sanskrit
        self.nlp = stanza.Pipeline(lang='sa', processors='tokenize,pos,lemma', download_method=None)

    def execute(self):
        try:
            # Run the neural pipeline on your Sanskrit word
            doc = self.nlp(self.word)
            
            tokens = []
            for sentence in doc.sentences:
                for word in sentence.words:
                    tokens.append({
                        "text": word.text,
                        "lemma": word.lemma,
                        "upos": word.upos,      # e.g., NOUN, VERB, ADJ
                        "feats": str(word.feats) # Morphological features like Case, Number, Gender
                    })
            
            # Return single dictionary if only one token, else return the list
            return tokens[0] if len(tokens) == 1 else tokens
            
        except Exception as e:
            print(f"Stanza Parsing Error: {e}")
            return None

