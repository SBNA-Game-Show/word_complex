import React from "react";

export default function TokenizedSanskritEditor({
  story,
  getEditedStory,
  updateStoryField,
}) {

  const editedStory = getEditedStory(story);

  const tokenizedSanskrit =
    editedStory.tokenized_sanskrit_version || [];
  const normalizedSentences =
  Array.isArray(tokenizedSanskrit[0])
    ? tokenizedSanskrit
    : [tokenizedSanskrit];
  const getWordColor = (upos) => {
        switch ((upos || "").toUpperCase()) {
            case "NOUN":
                return "#d4edda";      // light green
            case "ADJ":
                return "#f8d7da";      // light red
            case "ADV":
                return "#d6eaff";      // light blue
            case "VERB":
                return "#e8ddff";      // light lilac
            case "INTJ":
                return "#fff3cd";      // Butter Yellow
            case "PART":
                return "#ffe5cc";      // Light Orange
            case "PRON":
                return "#fde2f3";      // Light Pink
            case "SCONJ":
                return "#d1f2eb"; // Light Aqua
            default:
                return "#ffffff";      // white
        }
  };
  const updateWordField = (
        sentenceIndex,
        wordIndex,
        field,
        value
    ) => {
        const updatedSentences =
            JSON.parse(JSON.stringify(tokenizedSanskrit));
        updatedSentences[sentenceIndex][wordIndex][field] =
            value;
        updateStoryField(
            story._id,
            "tokenized_sanskrit_version",
            updatedSentences
        );
    };  
  /*
 * Add a new word after the selected word.
 */
const addWord = (
    sentenceIndex,
    wordIndex
    ) => {
    const updatedSentences =
        tokenizedSanskrit.map(
        (sentence) => [...sentence]
        );
    updatedSentences[sentenceIndex].splice(
        wordIndex + 1,
        0,
        {
            text: "",
            lemma: "",
            upos: "",
            xpos: "",
            feats: "",
            definition: ""
        }
    );
    updateStoryField(
        story._id,
        "tokenized_sanskrit_version",
        updatedSentences
    );
  };
  /*
 * Delete one word.
 */
const deleteWord = (
  sentenceIndex,
  wordIndex
) => {
  const updatedSentences =
    tokenizedSanskrit.map(
      (sentence) => [...sentence]
    );
  /*
   * Never allow an empty sentence.
   */
  if (
    updatedSentences[sentenceIndex].length <= 1
  ) {
    return;
  }
  updatedSentences[sentenceIndex].splice(
    wordIndex,
    1
  );
  updateStoryField(
    story._id,
    "tokenized_sanskrit_version",
    updatedSentences
  );
  };
  /*
 * Add a new empty sentence after the current sentence.
 */
const addSentence = (sentenceIndex) => {
    const updatedSentences =
        tokenizedSanskrit.map(
        (sentence) => [...sentence]
        );
    updatedSentences.splice(
        sentenceIndex + 1,
        0,
        [""]
    );
    updateStoryField(
        story._id,
        "tokenized_sanskrit_version",
        updatedSentences
    );
    };
    /*
    * Delete one sentence.
    */
    const deleteSentence = (sentenceIndex) => {
    /*
    * Never delete the last sentence.
    */
    if (tokenizedSanskrit.length <= 1) {
        return;
    }
    const updatedSentences =
        tokenizedSanskrit.filter(
        (_, index) => index !== sentenceIndex
        );
    updateStoryField(
        story._id,
        "tokenized_sanskrit_version",
        updatedSentences
    );
    };
  return (

    <div
      style={{
        marginTop: "40px",
      }}
    >

      <h2
        style={{
          color:"#1f2b6b",
          marginBottom:"20px",
        }}
      >
        Tokenized Sanskrit Version
      </h2>      
        {tokenizedSanskrit.length === 0 ? (
            <div
                style={{
                padding: "25px",
                background: "#f5f5f5",
                borderRadius: "10px",
                textAlign: "center",
                color: "#666",
                }}
            >
                No Sanskrit sentences found.
            </div>
            ) : (
        normalizedSentences.map(
          (sentence, sentenceIndex)=>(
            <div
              key={sentenceIndex}
              style={{
                background:"#fafafa",
                border:"1px solid #ddd",
                borderRadius:"10px",
                padding:"15px",
                marginBottom:"20px",
              }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px",
                    }}
                    >
                    <h4
                        style={{
                        margin: 0,
                        color: "#1f2b6b",
                        }}
                    >
                        Sentence {sentenceIndex + 1}
                    </h4>
                    <div
                        style={{
                        display: "flex",
                        gap: "10px",
                        }}
                    >
                        <button
                        type="button"
                        onClick={() =>
                            addSentence(sentenceIndex)
                        }
                        style={{
                            background: "#4caf50",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontWeight: "bold",
                        }}
                        >
                        + Sentence
                        </button>
                        <button
                        type="button"
                        onClick={() =>
                            deleteSentence(sentenceIndex)
                        }
                        disabled={normalizedSentences.length <= 1}
                        style={{
                            background:
                            normalizedSentences.length <= 1
                                ? "#cccccc"
                                : "#d32f2f",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            cursor:
                            normalizedSentences.length <= 1
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: "bold",
                        }}
                        >
                        Delete Sentence
                        </button>
                    </div>
                </div>
              <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                    gap: "18px",
                    marginTop: "15px",
                }}
              >
                {(Array.isArray(sentence) ? sentence : []).map(
                    (word, wordIndex) => (
                  <div
                    key={wordIndex}
                    style={{
                        border:
                            word.upos === "NOUN" ? "2px solid #28a745"
                                : word.upos === "ADJ"
                                ? "2px solid #dc3545"
                                : word.upos === "ADV"
                                ? "2px solid #007bff"
                                : word.upos === "VERB"
                                ? "2px solid #8e44ad"
                                : word.upos === "INTJ"
                                ? "2px solid #f0ad00"
                                : word.upos === "PART"
                                ? "2px solid #fd7e14"
                                : word.upos === "PRON"
                                ? "2px solid #e83e8c"
                                : word.upos === "SCONJ"
                                ? "2px solid #1565c0"
                                : "1px solid #ddd",
                        borderRadius: "10px",
                        padding: "15px",
                        background: getWordColor(word.upos),
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                  >
                    <h5
                        style={{
                            margin: "0 0 8px 0",
                            color:
                                word.upos === "NOUN"
                                    ? "#1e7e34"
                                    : word.upos === "ADJ"
                                    ? "#b21f2d"
                                    : word.upos === "ADV"
                                    ? "#0056b3"
                                    : word.upos === "VERB"
                                    ? "#6f42c1"
                                    : word.upos === "INTJ"
                                    ? "#b8860b"
                                    : word.upos === "PART"
                                    ? "#d35400"
                                    : word.upos === "PRON"
                                    ? "#c2185b"
                                    : word.upos === "SCONJ"
                                    ? "#1565c0"
                                    : "#1f2b6b",
                        }}
                    >
                        Word {wordIndex + 1}
                    </h5>
                    <label>Text</label>
                    <input
                        type="text"
                        value={word.text ?? ""}
                        onChange={(e) =>
                            updateWordField(
                                sentenceIndex,
                                wordIndex,
                                "text",
                                e.target.value
                            )
                        }
                    />
                    <label>Lemma</label>
                    <input
                        type="text"
                        value={word.lemma ?? ""}
                        onChange={(e) =>
                            updateWordField(
                                sentenceIndex,
                                wordIndex,
                                "lemma",
                                e.target.value
                            )
                        }
                    />
                    <label>UPOS</label>
                    <input
                        type="text"
                        value={word.upos ?? ""}
                        onChange={(e) =>
                            updateWordField(
                                sentenceIndex,
                                wordIndex,
                                "upos",
                                e.target.value
                            )
                        }
                    />
                    <label>XPOS</label>
                    <input
                        type="text"
                        value={word.xpos ?? ""}
                        onChange={(e) =>
                            updateWordField(
                                sentenceIndex,
                                wordIndex,
                                "xpos",
                                e.target.value
                            )
                        }
                    />
                    <label>Feats</label>
                    <input
                        type="text"
                        value={word.feats ?? ""}
                        onChange={(e) =>
                            updateWordField(
                                sentenceIndex,
                                wordIndex,
                                "feats",
                                e.target.value
                            )
                        }
                    />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "10px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                addWord(sentenceIndex, wordIndex)
                            }
                            style={{
                                background: "#4caf50",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "8px 14px",
                                cursor: "pointer",
                            }}
                        >
                            +
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                deleteWord(sentenceIndex, wordIndex)
                            }
                            style={{
                                background: "#d32f2f",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "8px 14px",
                                cursor: "pointer",
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
                ))}
              </div>
            </div>
          )
        )
      )}
      <div
        style={{
            marginTop: "25px",
            display: "flex",
            justifyContent: "center",
        }}
        >
        <button
            type="button"
            onClick={() =>
            addSentence(normalizedSentences.length - 1)
            }
            style={{
            background: "#1f2b6b",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            }}
        >
            + Add Sentence At End
        </button>
        </div>
    </div>
  );
}