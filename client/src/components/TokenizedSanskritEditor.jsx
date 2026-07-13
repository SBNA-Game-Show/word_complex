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

  const updateWord = (
    sentenceIndex,
    wordIndex,
    value
  ) => {
    const updatedSentences =
      tokenizedSanskrit.map(
        (sentence) => [...sentence]
      );
    updatedSentences[sentenceIndex][wordIndex] =
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
        ""
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
                  display:"flex",
                  flexWrap:"wrap",
                  gap:"10px",
                }}
              >
                {(Array.isArray(sentence) ? sentence : []).map(
                    (word, wordIndex) => (
                  <div
                    key={wordIndex}
                    style={{
                      display:"flex",
                      flexDirection:"column",
                      minWidth:"120px",
                      flex:"1 0 120px",
                    }}
                  >
                    <label
                      style={{
                        fontSize:"12px",
                        color:"#666",
                        marginBottom:"4px",
                      }}
                    >
                      Word {wordIndex+1}
                    </label>
                    <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                    >
                    <input
                        type="text"
                        value={word}
                        onChange={(e) =>
                        updateWord(
                            sentenceIndex,
                            wordIndex,
                            e.target.value
                        )
                        }
                        style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        }}
                    />
                    <button
                        type="button"
                        onClick={() =>
                        addWord(
                            sentenceIndex,
                            wordIndex
                        )
                        }
                        title="Add Word"
                        style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#4caf50",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "18px",
                        }}
                    >
                        +
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                        deleteWord(
                            sentenceIndex,
                            wordIndex
                        )
                        }
                        title="Delete Word"
                        style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#d32f2f",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "bold",
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