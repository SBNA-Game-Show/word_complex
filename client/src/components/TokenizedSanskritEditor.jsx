import React from "react";

export default function TokenizedSanskritEditor({
  story,
  getEditedStory,
  updateStoryField,
}) {
  const editedStory = getEditedStory(story);

  const tokenizedSanskrit = editedStory.tokenized_sanskrit_version || [];

  /*
   * SANSKRIT TOKEN NORMALIZATION:
   * Some stored stories use a nested sentence array, while older data may use
   * one flat word array. Normalize both shapes before every edit so rendering
   * and mutations always operate on the same sentence/word structure.
   */
  const createEmptyWord = () => ({
    text: "",
    lemma: "",
    upos: "",
    xpos: "",
    feats: "",
    definition: "",
  });

  const normalizeWord = (word) => {
    if (word && typeof word === "object" && !Array.isArray(word)) {
      return {
        ...createEmptyWord(),
        ...word,
      };
    }

    return {
      ...createEmptyWord(),
      text: typeof word === "string" ? word : "",
    };
  };

  const normalizedSentences =
    tokenizedSanskrit.length === 0
      ? []
      : Array.isArray(tokenizedSanskrit[0])
        ? tokenizedSanskrit.map((sentence) => sentence.map(normalizeWord))
        : [tokenizedSanskrit.map(normalizeWord)];

  const cloneSentences = () =>
    normalizedSentences.map((sentence) =>
      sentence.map((word) => ({ ...word })),
    );

  // E2E TEST SELECTORS:
  // These selectors expose the existing Sanskrit sentence and word controls to
  // Playwright. They do not bypass editor rules or alter saved token data.

  const getWordColor = (upos) => {
    switch ((upos || "").toUpperCase()) {
      case "NOUN":
        return "#d4edda";
      case "ADJ":
        return "#f8d7da";
      case "ADV":
        return "#d6eaff";
      case "VERB":
        return "#e8ddff";
      case "INTJ":
        return "#fff3cd";
      case "PART":
        return "#ffe5cc";
      case "PRON":
        return "#fde2f3";
      case "SCONJ":
        return "#d1f2eb";
      default:
        return "#ffffff";
    }
  };

  const updateWordField = (sentenceIndex, wordIndex, field, value) => {
    const updatedSentences = cloneSentences();

    if (!updatedSentences[sentenceIndex]?.[wordIndex]) {
      return;
    }

    updatedSentences[sentenceIndex][wordIndex] = {
      ...updatedSentences[sentenceIndex][wordIndex],
      [field]: value,
    };

    updateStoryField(story._id, "tokenized_sanskrit_version", updatedSentences);
  };

  /*
   * Add a new editable word after the selected word.
   */
  const addWord = (sentenceIndex, wordIndex) => {
    const updatedSentences = cloneSentences();

    if (!updatedSentences[sentenceIndex]) {
      return;
    }

    updatedSentences[sentenceIndex].splice(wordIndex + 1, 0, createEmptyWord());

    updateStoryField(story._id, "tokenized_sanskrit_version", updatedSentences);
  };

  /*
   * Delete one word, while never allowing an empty sentence.
   */
  const deleteWord = (sentenceIndex, wordIndex) => {
    const updatedSentences = cloneSentences();

    if (
      !updatedSentences[sentenceIndex] ||
      updatedSentences[sentenceIndex].length <= 1
    ) {
      return;
    }

    updatedSentences[sentenceIndex].splice(wordIndex, 1);

    updateStoryField(story._id, "tokenized_sanskrit_version", updatedSentences);
  };

  /*
   * Add one new sentence containing a valid empty word object.
   */
  const addSentence = (sentenceIndex) => {
    const updatedSentences = cloneSentences();

    updatedSentences.splice(sentenceIndex + 1, 0, [createEmptyWord()]);

    updateStoryField(story._id, "tokenized_sanskrit_version", updatedSentences);
  };

  /*
   * Delete one sentence, while preserving at least one sentence.
   */
  const deleteSentence = (sentenceIndex) => {
    if (normalizedSentences.length <= 1) {
      return;
    }

    const updatedSentences = cloneSentences();

    updatedSentences.splice(sentenceIndex, 1);

    updateStoryField(story._id, "tokenized_sanskrit_version", updatedSentences);
  };
  return (
    <div
      data-testid={`tokenized-sanskrit-editor-${story._id}`}
      style={{
        marginTop: "40px",
      }}
    >
      <h2
        style={{
          color: "#1f2b6b",
          marginBottom: "20px",
        }}
      >
        Tokenized Sanskrit Version
      </h2>
      {tokenizedSanskrit.length === 0 ? (
        <div
          data-testid={`tokenized-sanskrit-empty-${story._id}`}
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
        normalizedSentences.map((sentence, sentenceIndex) => (
          <div
            key={sentenceIndex}
            data-testid={`tokenized-sanskrit-sentence-${story._id}-${sentenceIndex}`}
            data-sentence-index={sentenceIndex}
            data-word-count={sentence.length}
            style={{
              background: "#fafafa",
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "20px",
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
                  data-testid={`tokenized-sanskrit-add-sentence-${story._id}-${sentenceIndex}`}
                  type="button"
                  onClick={() => addSentence(sentenceIndex)}
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
                  data-testid={`tokenized-sanskrit-delete-sentence-${story._id}-${sentenceIndex}`}
                  type="button"
                  onClick={() => deleteSentence(sentenceIndex)}
                  disabled={normalizedSentences.length <= 1}
                  style={{
                    background:
                      normalizedSentences.length <= 1 ? "#cccccc" : "#d32f2f",
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
                    data-testid={`tokenized-sanskrit-word-${story._id}-${sentenceIndex}-${wordIndex}`}
                    data-sentence-index={sentenceIndex}
                    data-word-index={wordIndex}
                    data-upos={word.upos || ""}
                    style={{
                      border:
                        word.upos === "NOUN"
                          ? "2px solid #28a745"
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
                      data-testid={`tokenized-sanskrit-text-${story._id}-${sentenceIndex}-${wordIndex}`}
                      type="text"
                      value={word.text ?? ""}
                      onChange={(e) =>
                        updateWordField(
                          sentenceIndex,
                          wordIndex,
                          "text",
                          e.target.value,
                        )
                      }
                    />
                    <label>Lemma</label>
                    <input
                      data-testid={`tokenized-sanskrit-lemma-${story._id}-${sentenceIndex}-${wordIndex}`}
                      type="text"
                      value={word.lemma ?? ""}
                      onChange={(e) =>
                        updateWordField(
                          sentenceIndex,
                          wordIndex,
                          "lemma",
                          e.target.value,
                        )
                      }
                    />
                    <label>UPOS</label>
                    <input
                      data-testid={`tokenized-sanskrit-upos-${story._id}-${sentenceIndex}-${wordIndex}`}
                      type="text"
                      value={word.upos ?? ""}
                      onChange={(e) =>
                        updateWordField(
                          sentenceIndex,
                          wordIndex,
                          "upos",
                          e.target.value,
                        )
                      }
                    />
                    <label>XPOS</label>
                    <input
                      data-testid={`tokenized-sanskrit-xpos-${story._id}-${sentenceIndex}-${wordIndex}`}
                      type="text"
                      value={word.xpos ?? ""}
                      onChange={(e) =>
                        updateWordField(
                          sentenceIndex,
                          wordIndex,
                          "xpos",
                          e.target.value,
                        )
                      }
                    />
                    <label>Feats</label>
                    <input
                      data-testid={`tokenized-sanskrit-feats-${story._id}-${sentenceIndex}-${wordIndex}`}
                      type="text"
                      value={word.feats ?? ""}
                      onChange={(e) =>
                        updateWordField(
                          sentenceIndex,
                          wordIndex,
                          "feats",
                          e.target.value,
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
                      <label>Definition</label>
                      <textarea
                        data-testid={`tokenized-sanskrit-definition-${story._id}-${sentenceIndex}-${wordIndex}`}
                        rows={2}
                        value={word.definition ?? ""}
                        onChange={(e) =>
                          updateWordField(
                            sentenceIndex,
                            wordIndex,
                            "definition",
                            e.target.value,
                          )
                        }
                      />
                      <button
                        data-testid={`tokenized-sanskrit-add-word-${story._id}-${sentenceIndex}-${wordIndex}`}
                        aria-label={`Add word after Sanskrit word ${wordIndex + 1}`}
                        type="button"
                        onClick={() => addWord(sentenceIndex, wordIndex)}
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
                        data-testid={`tokenized-sanskrit-delete-word-${story._id}-${sentenceIndex}-${wordIndex}`}
                        aria-label={`Delete Sanskrit word ${wordIndex + 1}`}
                        onClick={() => deleteWord(sentenceIndex, wordIndex)}
                        disabled={sentence.length <= 1}
                        style={{
                          background:
                            sentence.length <= 1 ? "#cccccc" : "#d32f2f",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 14px",
                          cursor:
                            sentence.length <= 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ))
      )}
      <div
        style={{
          marginTop: "25px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          data-testid={`tokenized-sanskrit-add-sentence-end-${story._id}`}
          type="button"
          onClick={() => addSentence(normalizedSentences.length - 1)}
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
