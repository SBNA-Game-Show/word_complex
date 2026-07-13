import { useEffect, useState } from "react";
import TokenizedEnglishEditor from "./TokenizedEnglishEditor";
import TokenizedSanskritEditor from "./TokenizedSanskritEditor";
const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export default function TokenizedEditor() {
  const [stories, setStories] = useState([]);
  const [editedStories, setEditedStories] = useState({});
  const [expandedStory, setExpandedStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const getStories = async () => {
    try {
        setLoading(true);

        const response = await fetch(
        `${API_BASE}/stories/tokenized`
        );

        const result = await response.json();

        if (result.success) {
        setStories(result.data);
        } else {
        alert(result.message);
        }
    } catch (err) {
        console.error(err);
        alert("Unable to load tokenized stories.");
    } finally {
        setLoading(false);
    }
 };
 const getEditedStory = (story) => {
  return editedStories[story._id] || story;
 };
const updateStoryField = (storyId, field, value) => {
  setEditedStories((prev) => {
    const originalStory = stories.find((s) => s._id === storyId);
    return {
      ...prev,
      [storyId]: {
        ...(originalStory || {}),
        ...(prev[storyId] || {}),
        [field]: value,
      },
    };
  });
 };
 const filteredStories = stories.filter((story) => {
    const search = searchTerm.trim().toLowerCase();
    const englishTitle =
        story.title?.englishversion ||
        story.title?.englishVersion ||
        story.title?.english ||
        "";
    const sanskritTitle =
        story.title?.sanskritversion ||
        story.title?.sanskritVersion ||
        "";
    const category =
        story.category || "";
    const matchesSearch =
        englishTitle.toLowerCase().includes(search) ||
        sanskritTitle.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search);
    const matchesCategory =
        selectedCategory === "All" ||
        category === selectedCategory;
    return (
        matchesSearch &&
        matchesCategory
    );
 });
 const categories = [
    "All",
    ...new Set(
        stories
        .map((story) => story.category)
        .filter(Boolean)
    ),
 ];
 const saveStory = async (storyId) => {
    try {
        const story =
        editedStories[storyId];
        if (!story) {
        alert("No changes to save.");
        return;
        }
        const payload = {
        storyMoral:
            story.storyMoral,
        transliteratedVersion:
            story.transliteratedVersion,
        sanskritVersion:
            story.sanskritVersion,
        tokenized_english_version:
            story.tokenized_english_version,
        tokenized_sanskrit_version:
            story.tokenized_sanskrit_version,
        };
        const response =
        await fetch(
            `${API_BASE}/stories/tokenized/${storyId}`,
            {
            method: "PUT",
            headers: {
                "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
                payload
            ),
            }
        );
        const result =
        await response.json();
        if (result.success) {
        alert(
            "Story updated successfully!"
        );
        await getStories();
        setEditedStories((prev) => {
            const copy = {
            ...prev,
            };
            delete copy[storyId];
            return copy;
        });
        } else {
        alert(result.message);
        }
    } catch (err) {
        console.error(err);

        alert(
        "Unable to update story."
        );
    }
 };
 const discardChanges = (storyId) => {
    setEditedStories((prev) => {
        const updated = { ...prev };
        delete updated[storyId];
        return updated;
    });
 };
 const hasUnsavedChanges = (storyId) => {
    return editedStories.hasOwnProperty(storyId);
 };
  useEffect(() => {
    getStories();
  }, []);

  return (
    <div
      style={{
        padding: "30px",
        background: "#f7f4e8",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <button
            onClick={() => {
                window.location.href = "/admin";
            }}
            >
            ← Back to Admin
          </button>
          <h1
            style={{
              color: "#1f2b6b",
              margin: 0,
            }}
          >
            Tokenized Story Editor
          </h1>

          <p>
            Showing {filteredStories.length} of {stories.length} stories
          </p>
        </div>

        <button
          onClick={getStories}
          style={{
            background: "#f9a825",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh
        </button>
      </div>
      <div
        style={{
            display: "flex",
            gap: "20px",
            marginBottom: "25px",
            alignItems: "center",
        }}
        >
        <input
            type="text"
            placeholder="Search title or category..."
            value={searchTerm}
            onChange={(e) =>
            setSearchTerm(e.target.value)
            }
            style={{
            flex: 1,
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "15px",
            }}
        />
        <select
            value={selectedCategory}
            onChange={(e) =>
            setSelectedCategory(e.target.value)
            }
            style={{
            width: "220px",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "15px",
            background: "white",
            }}
        >
            {categories.map((category) => (
            <option
                key={category}
                value={category}
            >
                {category}
            </option>
            ))}
        </select>
      </div>
      <div
        style={{
            marginBottom: "20px",
        }}
        >
        <button
            onClick={() => {
            setSearchTerm("");
            setSelectedCategory("All");
            }}
            style={{
            background: "#777",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            cursor: "pointer",
            }}
        >
            Clear Filters
        </button>
        </div>
      {loading && (
        <h3>Loading stories...</h3>
      )}

      {/* 4-column Grid */}

      <div
        style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "22px",
            alignItems: "start",
        }}
      >
        {filteredStories.map((story) => (
          <div
            key={story._id}
            style={{
              background: "white",
              borderRadius: "15px",
              padding: "18px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,.08)",
            }}
          >
            <div
              onClick={() =>
                setExpandedStory(
                  expandedStory === story._id
                    ? null
                    : story._id
                )
              }
              style={{
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    color: "#1f2b6b",
                  }}
                >
                  {story.title?.englishversion ||
                    story.title?.englishVersion ||
                    "Untitled Story"}
                </h3>

                <span style={{ fontSize: "20px" }}>
                  {expandedStory === story._id
                    ? "▲"
                    : "▼"}
                </span>
              </div>

              <p>
                <strong>Category:</strong>{" "}
                {story.category}
              </p>
            </div>

            {expandedStory === story._id && (
                <div
                    style={{
                        marginTop: "15px",
                        borderTop: "1px solid #ddd",
                        paddingTop: "15px",
                    }}
                >
                    <h3
                    style={{
                        color: "#1f2b6b",
                        marginBottom: "20px",
                    }}
                >
                    Read Only Information
                </h3>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                    }}
                >
                    <div>
                        <label
                            style={{
                                fontWeight: "bold",
                            }}
                        >
                            Story ID
                        </label>

                        <input
                            disabled
                            value={story._id}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "#eee",
                                marginTop: "6px",
                            }}
                        />
                    </div>
                    <div>
                        <label
                            style={{
                                fontWeight: "bold",
                            }}
                        >
                            English Title
                        </label>

                        <input
                            disabled
                            value={
                                story.title?.englishversion ||
                                story.title?.englishVersion ||
                                story.title?.english ||
                                ""
                            }
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "#eee",
                                marginTop: "6px",
                            }}
                        />
                    </div>
                    <div>
                        <label
                            style={{
                                fontWeight: "bold",
                            }}
                        >
                            Sanskrit Title
                        </label>

                        <input
                            disabled
                            value={
                                story.title?.sanskritversion ||
                                story.title?.sanskritVersion ||
                                ""
                            }
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "#eee",
                                marginTop: "6px",
                            }}
                        />
                    </div>
                    <div>
                        <label
                            style={{
                                fontWeight: "bold",
                            }}
                        >
                            Category
                        </label>

                        <input
                            disabled
                            value={story.category}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "#eee",
                                marginTop: "6px",
                            }}
                        />
                    </div>
                    </div>
                    <div
                        style={{
                            marginTop: "25px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "bold",
                            }}
                        >
                            Actors
                        </label>

                        <textarea
                            disabled
                            rows={3}
                            value={
                                story.actors?.join(", ") || ""
                            }
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                background: "#eee",
                                marginTop: "6px",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            marginTop: "25px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "bold",
                            }}
                        >
                            English Passage
                        </label>

                        <textarea
                            disabled
                            rows={12}
                            value={
                                story.englishVersion ||
                                story.englishversion ||
                                ""
                            }
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                background: "#eee",
                                marginTop: "6px",
                                resize: "vertical",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            marginTop: "25px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "bold",
                            }}
                        >
                            Created At
                        </label>

                        <input
                            disabled
                            value={
                                story.createdAt
                                    ? new Date(
                                        story.createdAt
                                    ).toLocaleString()
                                    : ""
                            }
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "#eee",
                                marginTop: "6px",
                            }}
                        />
                    </div>
                    {hasUnsavedChanges(story._id) && (
                        <div
                            style={{
                            background: "#fff3cd",
                            color: "#856404",
                            border: "1px solid #ffeeba",
                            borderRadius: "8px",
                            padding: "10px 15px",
                            marginBottom: "20px",
                            fontWeight: "bold",
                            }}
                        >
                            ⚠ Unsaved Changes
                        </div>
                    )}
                    <hr />
                    <h2
                        style={{
                            color:"#1f2b6b"
                        }}
                    >
                        Editable Fields
                    </h2>
                    <div style={{ marginTop: "20px" }}>
                        <label
                            style={{
                            fontWeight: "bold",
                            }}
                        >
                            Story Moral
                        </label>
                        <textarea
                            rows={3}
                            value={getEditedStory(story).storyMoral || ""}
                            onChange={(e) =>
                            updateStoryField(
                                story._id,
                                "storyMoral",
                                e.target.value
                            )
                            }
                            style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            marginTop: "6px",
                            }}
                        />
                    </div>
                    <div style={{ marginTop: "25px" }}>
                        <label
                            style={{
                            fontWeight: "bold",
                            display: "block",
                            marginBottom: "10px",
                            }}
                        >
                            Sanskrit Version
                        </label>
                        {getEditedStory(story).sanskritVersion?.map(
                            (sentence, index) => (
                            <textarea
                                key={index}
                                rows={2}
                                value={sentence}
                                onChange={(e) => {
                                const updated = [
                                    ...getEditedStory(story).sanskritVersion,
                                ];
                                updated[index] = e.target.value;
                                updateStoryField(
                                    story._id,
                                    "sanskritVersion",
                                    updated
                                );
                                }}
                                style={{
                                width: "100%",
                                marginBottom: "10px",
                                padding: "10px",
                                borderRadius: "8px",
                                }}
                            />
                            )
                        )}
                    </div>
                    <div style={{ marginTop: "25px" }}>
                        <label
                            style={{
                            fontWeight: "bold",
                            display: "block",
                            marginBottom: "10px",
                            }}
                        >
                            Transliterated Version
                        </label>
                        {getEditedStory(story).transliteratedVersion?.map(
                            (sentence, index) => (
                            <textarea
                                key={index}
                                rows={2}
                                value={sentence}
                                onChange={(e) => {
                                const updated = [
                                    ...getEditedStory(story)
                                    .transliteratedVersion,
                                ];
                                updated[index] = e.target.value;
                                updateStoryField(
                                    story._id,
                                    "transliteratedVersion",
                                    updated
                                );
                                }}
                                style={{
                                width: "100%",
                                marginBottom: "10px",
                                padding: "10px",
                                borderRadius: "8px",
                                }}
                            />
                            )
                        )}
                    </div>
                    <TokenizedEnglishEditor
                        story={story}
                        getEditedStory={getEditedStory}
                        updateStoryField={updateStoryField}
                    />
                    <TokenizedSanskritEditor
                        story={story}
                        getEditedStory={getEditedStory}
                        updateStoryField={updateStoryField}
                    />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "12px",
                            marginTop: "30px",
                        }}
                    >
                        <button
                            onClick={() => saveStory(story._id)}
                            disabled={!hasUnsavedChanges(story._id)}
                            style={{
                                background: hasUnsavedChanges(story._id)
                                ? "#1f2b6b"
                                : "#cccccc",
                                color: "white",
                                border: "none",
                                padding: "12px 24px",
                                borderRadius: "8px",
                                cursor: hasUnsavedChanges(story._id)
                                ? "pointer"
                                : "not-allowed",
                                fontWeight: "bold",
                            }}
                            >
                            Save Changes
                        </button>
                        <button
                            onClick={() =>
                                discardChanges(story._id)
                            }
                            disabled={!hasUnsavedChanges(story._id)}
                            style={{
                                background: hasUnsavedChanges(story._id)
                                ? "#d32f2f"
                                : "#cccccc",
                                color: "white",
                                border: "none",
                                padding: "12px 24px",
                                borderRadius: "8px",
                                cursor: hasUnsavedChanges(story._id)
                                ? "pointer"
                                : "not-allowed",
                                fontWeight: "bold",
                                marginLeft: "12px",
                            }}
                            >
                            Discard Changes
                        </button>
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}