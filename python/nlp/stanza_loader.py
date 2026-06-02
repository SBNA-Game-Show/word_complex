
import stanza

sanskrit_nlp = stanza.Pipeline(
    lang="sa",
    processors = "tokenize,pos,lemma",
    use_gpu=False
    )