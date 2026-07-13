import React from "react";

export default function TokenizedEnglishEditor({
  story,
  getEditedStory,
  updateStoryField,
}) {
  const editedStory = getEditedStory(story);
  const getTokenColor = (pos) => {
    switch ((pos || "").toUpperCase()) {
        case "NOUN":
        return "#d4edda"; // Light Green
        case "VERB":
        return "#e8ddff"; // Light Lilac
        case "ADJ":
        return "#f8d7da"; // Light Red
        case "ADV":
        return "#d6eaff"; // Light Blue
        case "INTJ":
        return "#fff3cd"; // Butter Yellow
        case "PART":
        return "#ffe5cc"; // Light Orange
        case "PRON":
        return "#fde2f3"; // Light Pink
        case "SCONJ":
        return "#d1f2eb"; // Light Aqua
        case "CCONJ":
        return "#e3f2fd"; // Light Sky Blue
        case "ADP":
        return "#f3e5f5"; // Light Lavender
        default:
        return "#ffffff";
    }
  };
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
              border:
                token.pos === "NOUN"
                    ? "2px solid #28a745"
                    : token.pos === "VERB"
                    ? "2px solid #8e44ad"
                    : token.pos === "ADJ"
                    ? "2px solid #dc3545"
                    : token.pos === "ADV"
                    ? "2px solid #007bff"
                    : token.pos === "INTJ"
                    ? "2px solid #f0ad00"
                    : token.pos === "PART"
                    ? "2px solid #fd7e14"
                    : token.pos === "PRON"
                    ? "2px solid #e83e8c"
                    : token.pos === "SCONJ"
                    ? "2px solid #16a085"
                    : token.pos === "CCONJ"
                    ? "2px solid #1976d2"
                    : token.pos === "ADP"
                    ? "2px solid #8e44ad"
                    : "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              background: getTokenColor(token.pos),
            }}
          >
            <h4
              style={{
                marginTop: 0,
                color:
                    token.pos === "NOUN"
                        ? "#1e7e34"
                        : token.pos === "VERB"
                        ? "#6f42c1"
                        : token.pos === "ADJ"
                        ? "#b21f2d"
                        : token.pos === "ADV"
                        ? "#0056b3"
                        : token.pos === "INTJ"
                        ? "#b8860b"
                        : token.pos === "PART"
                        ? "#d35400"
                        : token.pos === "PRON"
                        ? "#c2185b"
                        : token.pos === "SCONJ"
                        ? "#117864"
                        : token.pos === "CCONJ"
                        ? "#1565c0"
                        : token.pos === "ADP"
                        ? "#6a1b9a"
                        : "#1f2b6b",
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