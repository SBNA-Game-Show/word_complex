import { useEffect, useState } from "react";

import {
  getAllStories,
  getAllTokenizedStories,
  addNewStory,
  writeMeta,
  downloadStory,
} from "../services/admin/AdminControls";

export default function AdminPage() {
  const [stories, setStories] = useState([]);
  const allStories = stories.flatMap((collection) => collection.story_description || []);
  const [storyId, setStoryId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    setLoading(true);

    try {
      const response = await getAllStories();

      console.log("Stories Response:", response);

      setStories(response.data || []);
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
      await writeMeta();

      alert("Metadata written successfully");
    } catch (error) {
      alert("Failed to write metadata");
    }
  }

  async function handleGetTokenizedStories() {
    try {
      const data = await getAllTokenizedStories();

      alert(`Found ${data.length} tokenized stories`);

      console.log(data);
    } catch (error) {
      alert("Failed to retrieve tokenized stories");
    }
  }

  return (
    <div
        style={{
        minHeight: "100vh",
        background:
            "linear-gradient(180deg, #f7edd3 0%, #f6efdb 35%, #d9ef9f 100%)",
        padding: "40px",
        fontFamily: "'Nunito', sans-serif",
        }}
    >
    <div
        style={{
            maxWidth: "1100px",
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
        Word Complex Admin Panel
      </h1>

      <hr />

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Story ID"
          value={storyId}
          onChange={(e) => setStoryId(e.target.value)}
        />

        <button onClick={handleAddStory}>
          Add Story
        </button>

        <button onClick={handleWriteMeta}>
          Write Meta
        </button>

        <button onClick={handleGetTokenizedStories}>
          Get Tokenized
        </button>

        <button onClick={loadStories}>
          Refresh
        </button>
      </div>

      <h2>
        Available Stories ({allStories.length})
        </h2>

        {loading ? (
        <p>Loading...</p>
        ) : (
        allStories.map((story) => (
            <div
            key={story._id}
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                marginBottom: "10px",
                background: "white",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
            >
            <span
                style={{
                fontSize: "18px",
                }}
            >
                {story.storyTitle}
            </span>

            <button
                onClick={() => console.log(story)}
                style={{
                    background: "#f8a53c",
                    color: "white",
                    border: "none",
                    borderRadius: "20px",
                    padding: "8px 18px",
                    cursor: "pointer",
                    fontWeight: "600",
                }}
                >
                Use Story
            </button>
            </div>
        ))
        )}
    </div>
    </div>
  );
}