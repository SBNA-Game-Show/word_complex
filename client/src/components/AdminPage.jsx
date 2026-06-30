import { useEffect, useState } from "react";

import {
  getAllStories,
  getAllTokenizedStories,
  addNewStory,
  writeMeta, uploadStory,
} from "../services/admin/AdminControls";

export default function AdminPage() {
  const [stories, setStories] = useState([]);
  const [tokenizedStories, setTokenizedStories] = useState([]);
  const [activeView, setActiveView] = useState("available");

  const [storyId, setStoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [language, setLanguage] = useState("english");
  const allStories = stories.flatMap(
    (collection) => collection.story_description || []
  );

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    setLoading(true);

    try {
      const response = await getAllStories();

      console.log("Stories Response:", response);

      setStories(response.data || []);

      setActiveView("available");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStory() {
    if (!storyId.trim()) {
      alert("Enter a Story ID");
      return;
    }

    try {
      await addNewStory(storyId);

      alert("Story added successfully");

      setStoryId("");

      loadStories();
    } catch (error) {
      alert("Failed to add story");
    }
  }

  async function handleWriteMeta() {
    try {
        const result = await writeMeta();

        alert(
        result?.message ||
        "Meta Data downloaded successfully"
        );
    } catch (error) {
        console.error(error);

        alert(
        error?.message ||
        "Internal server error"
        );
    }
    }
    async function handleUpload() {
        if (!uploadFile) {
            alert("Please choose a file.");
            return;
        }

        try {
            setLoading(true);

            const result = await uploadStory(uploadFile, language);

            alert(result.message);

            setUploadFile(null);

            loadStories();
        } catch (error) {
            alert(error.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    }
  async function handleGetTokenizedStories() {
    try {
      setLoading(true);

      const response = await getAllTokenizedStories();

      console.log("Tokenized Stories:", response);

      setTokenizedStories(response.data || []);
      console.log("First tokenized story:", response.data?.[0]);
      setActiveView("tokenized");
    } catch (error) {
      alert("Failed to retrieve tokenized stories");
    } finally {
      setLoading(false);
    }
  }

  async function handleUseStory(story) {
    const storyId = story._id;

    try {
      const result = await addNewStory(storyId);

      alert(
        result?.data?.message ||
        result?.message ||
        "Story downloaded successfully"
      );

      loadStories();
    } catch (error) {
      console.error(error);
      alert("Failed to process story");
    }
  }
  async function handleUseTokenizedStory(story) {
    console.log("Using tokenized story:", story);

    alert(
        story.title?.englishversion ||
        story.title?.englishVersion ||
        "Story selected"
    );
  }
  const actionButtonStyle = {
    background: "#f8a53c",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "14px 28px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "16px",
    minWidth: "220px",
    boxShadow: "0 4px 12px rgba(248,165,60,0.3)",
    };
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7edd3 0%, #f6efdb 35%, #d9ef9f 100%)",
        padding: "20px",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          width: "100%",   
          margin: "0 auto",
          background: "#f8f1e0",
          borderRadius: "24px",
          padding: "30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        }}
      >
        <h1
          style={{
            color: "#1f2b6b",
            fontSize: "36px",
            marginBottom: "20px",
          }}
        >
          Word Complex Admin 
        </h1>

        <hr />

        <div
            style={{
                display: "flex",
                gap: "20px",
                marginBottom: "30px",
                flexWrap: "wrap",
                alignItems: "center",
            }}
            >
            <input
                type="text"
                placeholder="Story ID"
                value={storyId}
                onChange={(e) => setStoryId(e.target.value)}
                style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                minWidth: "250px",
                fontSize: "15px",
                }}
            />

            <button
                onClick={handleAddStory}
                style={actionButtonStyle}
            >
                Add New Story
            </button>

            {/* <button
                onClick={handleWriteMeta}
                style={actionButtonStyle}
            >
                Write Meta
            </button> */}

            <button
                onClick={handleGetTokenizedStories}
                style={actionButtonStyle}
            >
                Get Tokenized Stories
            </button>

            <button
                onClick={loadStories}
                style={actionButtonStyle}
            >
                Refresh
            </button>
        </div>

        {activeView === "available" ? (
            <>
                <h2
                style={{
                    fontSize: "34px",
                    color: "#1f2b6b",
                    marginBottom: "24px",
                }}
                >
                Available Stories ({allStories.length})
                </h2>
                 {/* ---------- Upload Story Section ---------- */}

                <div
                    style={{
                        background: "white",
                        borderRadius: "18px",
                        padding: "24px",
                        marginBottom: "30px",
                        boxShadow: "0 2px 10px rgba(0,0,0,.08)",
                    }}
                >
                    <h3
                        style={{
                            color: "#1f2b6b",
                            marginTop: 0,
                            marginBottom: "20px",
                        }}
                    >
                        Upload Asset
                    </h3>

                    <div
                        style={{
                            display: "flex",
                            gap: "20px",
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <input
                            type="file"
                            accept=".pdf,.json,.txt,.doc,.docx,image/*"
                            onChange={(e) => setUploadFile(e.target.files[0])}
                        />

                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{
                                padding: "12px",
                                borderRadius: "10px",
                                fontSize: "15px",
                            }}
                        >
                            <option value="english">English</option>
                            <option value="sanskrit">Sanskrit</option>
                        </select>

                        <button
                            onClick={handleUpload}
                            style={actionButtonStyle}
                        >
                            Upload
                        </button>
                    </div>
                </div>
                {loading ? (
                <p>Loading...</p>
                ) : (
                <div
                    style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "18px",
                    }}
                >
                    {allStories.map((story) => (
                    <div
                        key={story._id}
                        style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "18px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                        }}
                    >
                        <details>
                            <summary
                                style={{
                                    cursor: "pointer",
                                    fontWeight: "700",
                                    color: "#1f2b6b",
                                    fontSize: "17px",
                                }}
                            >
                                {story.storyTitle}
                            </summary>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                    marginTop: "16px",
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    onClick={() => handleUseStory(story)}
                                    style={actionButtonStyle}
                                >
                                    Download Story
                                </button>

                                <button
                                    onClick={handleWriteMeta}
                                    style={actionButtonStyle}
                                >
                                    Write Metadata
                                </button>
                            </div>
                        </details>
                    </div>
                    ))}
                </div>
                )}
            </>
        ) : (
        <>
        <h2
            style={{
            fontSize: "34px",
            color: "#1f2b6b",
            marginBottom: "24px",
            }}
        >
            Tokenized Stories ({tokenizedStories.length})
        </h2>

        {loading ? (
            <p>Loading...</p>
        ) : (
            <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(430px,1fr))",
                gap: "20px",
            }}
            >
            {tokenizedStories.map((story) => (
                <div
                key={story._id}
                style={{
                    padding: "18px",
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                }}
                >
                <h3
                    style={{
                    marginTop: 0,
                    color: "#1f2b6b",
                    }}
                >
                    {story.storyTitle ||
                    story.title?.englishversion ||
                    story.title?.englishVersion ||
                    "Untitled Story"}
                </h3>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                    }}
                    >
                    <p
                        style={{
                        margin: 0,
                        }}
                    >
                        <strong>Category:</strong> {story.category}
                    </p>

                    <button
                        onClick={() => handleUseTokenizedStory(story)}
                        style={{
                        background: "#3aa655",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        padding: "8px 16px",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "14px",
                        }}
                    >
                        Use Story
                    </button>
                </div>

                <p>
                    <strong>Actors:</strong> {story.actors?.join(", ")}
                </p>

                <details>
                    <summary
                    style={{
                        cursor: "pointer",
                        fontWeight: "600",
                    }}
                    >
                    View English Text
                    </summary>

                    <p
                    style={{
                        marginTop: "10px",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.6",
                    }}
                    >
                    {story.englishVersion}
                    </p>
                </details>
                </div>
            ))}
            </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}