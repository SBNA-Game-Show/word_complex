import React from "react";

export default function TokenizedEnglishEditor({
  story,
  getEditedStory,
  updateStoryField,
}) {
  const editedStory = getEditedStory(story);

  const updateToken = (index, field, value) => {
    const updatedTokens = [
      ...(editedStory.tokenized_english_version || []),
    ];

    updatedTokens[index] = {
      ...updatedTokens[index],
      [field]: value,
    };

    updateStoryField(
      story._id,
      "tokenized_english_version",
      updatedTokens
    );
  };

  return (
    <div style={{ marginTop: "35px" }}>
      <h2
        style={{
          color: "#1f2b6b",
          marginBottom: "20px",
        }}
      >
        Tokenized English Version
      </h2>

      {(editedStory.tokenized_english_version || []).map(
        (token, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              background: "#fafafa",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                color: "#1f2b6b",
              }}
            >
              Token {index + 1}
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "15px",
              }}
            >
              {/* Text */}

              <div>
                <label>Text</label>

                <input
                  value={token.text || ""}
                  onChange={(e) =>
                    updateToken(
                      index,
                      "text",
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                  }}
                />
              </div>

              {/* Lemma */}

              <div>
                <label>Lemma</label>

                <input
                  value={token.lemma || ""}
                  onChange={(e) =>
                    updateToken(
                      index,
                      "lemma",
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                  }}
                />
              </div>

              {/* POS */}

              <div>
                <label>POS</label>

                <select
                  value={token.pos || ""}
                  onChange={(e) =>
                    updateToken(
                      index,
                      "pos",
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                  }}
                >
                  <option value="">Select</option>

                  <option value="NOUN">NOUN</option>
                  <option value="VERB">VERB</option>
                  <option value="ADJ">ADJ</option>
                  <option value="ADV">ADV</option>
                  <option value="PRON">PRON</option>
                  <option value="DET">DET</option>
                  <option value="ADP">ADP</option>
                  <option value="SCONJ">SCONJ</option>
                  <option value="CCONJ">CCONJ</option>
                  <option value="AUX">AUX</option>
                  <option value="NUM">NUM</option>
                  <option value="PART">PART</option>
                  <option value="INTJ">INTJ</option>
                  <option value="PUNCT">PUNCT</option>
                  <option value="X">X</option>
                </select>
              </div>
            </div>
            {/* Definition */}
            <div
            style={{
                marginTop: "18px",
            }}
            >
            <label
                style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "6px",
                }}
            >
                Definition
            </label>
            <textarea
                rows={3}
                value={token.definition || ""}
                onChange={(e) =>
                updateToken(
                    index,
                    "definition",
                    e.target.value
                )
                }
                style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                resize: "vertical",
                border: "1px solid #ccc",
                fontFamily: "inherit",
                fontSize: "14px",
                }}
            />
            </div>
            {/* Synonyms */}
            <div
            style={{
                marginTop: "18px",
            }}
            >
            <label
                style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "6px",
                }}
            >
                Synonyms
            </label>
            <input
                type="text"
                value={(token.synonyms || []).join(", ")}
                onChange={(e) =>
                updateToken(
                    index,
                    "synonyms",
                    e.target.value
                    .split(",")
                    .map((word) => word.trim())
                    .filter(Boolean)
                )
                }
                placeholder="word1, word2, word3"
                style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                }}
            />
            </div>
            {/* Antonyms */}
            <div
            style={{
                marginTop: "18px",
            }}
            >
            <label
                style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "6px",
                }}
            >
                Antonyms
            </label>
            <input
                type="text"
                value={(token.antonyms || []).join(", ")}
                onChange={(e) =>
                updateToken(
                    index,
                    "antonyms",
                    e.target.value
                    .split(",")
                    .map((word) => word.trim())
                    .filter(Boolean)
                )
                }
                placeholder="word1, word2, word3"
                style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                }}
            />
            </div>
          </div>
        )
      )}
    </div>
  );
}