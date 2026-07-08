import { useState } from "react";

import {
  getAllStories,
  getAllTokenizedStories,
  addNewStory,
  writeMeta,
  uploadStory,
  getUnusedStories,
} from "../services/admin/AdminControls";

export default function AdminPage() {
  // -------------------------------
  // Story Sources
  // -------------------------------
  const [learnStories, setLearnStories] = useState([]);
  const [sanskritStories, setSanskritStories] = useState([]);

  const [learnLoaded, setLearnLoaded] = useState(false);
  const [sanskritLoaded, setSanskritLoaded] = useState(false);

  const [learnExpanded, setLearnExpanded] = useState(false);
  const [sanskritExpanded, setSanskritExpanded] = useState(false);
  // -------------------------------
  // Existing
  // -------------------------------
  const [tokenizedStories, setTokenizedStories] = useState([]);
  const [activeView, setActiveView] = useState("available");
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  
  async function loadLearnStories() {

    if (learnLoaded) {
        return;
    }

    setLoading(true);

    try {

        const response = await getAllStories();

        const stories =
            (response.data || []).flatMap(
                (collection) =>
                    collection.story_description || []
            );

        setLearnStories(stories);

        setLearnLoaded(true);

    } catch (error) {

        console.error(error);

        alert("Failed to load LearnSanskrit stories");

    } finally {

        setLoading(false);

    }

    }
    async function loadSanskritStories() {

        if (sanskritLoaded) {
            return;
        }

        setLoading(true);

        try {

            const response = await getUnusedStories();

            setSanskritStories(response.data || []);

            setSanskritLoaded(true);

        } catch (error) {

            console.error(error);

            alert("Failed to load Sanskrit stories");

        } finally {

            setLoading(false);

        }

    }
    async function refreshStories() {

    setLearnLoaded(false);

    setSanskritLoaded(false);

    setLearnStories([]);

    setSanskritStories([]);

    if (learnExpanded) {

        await loadLearnStories();

    }

    if (sanskritExpanded) {

        await loadSanskritStories();

    }

}
async function toggleLearnStories() {

    const next = !learnExpanded;

    setLearnExpanded(next);

    if (next) {

        await loadLearnStories();

    }

}
async function toggleSanskritStories() {

    const next = !sanskritExpanded;

    setSanskritExpanded(next);

    if (next) {

        await loadSanskritStories();

    }

}
  async function handleDownloadLearnStory(story) {

    try {

        const result = await addNewStory(story._id);

        alert(

            result?.data?.message ||

            result?.message ||

            "Story downloaded successfully"

        );

    } catch (error) {

        console.error(error);

        alert("Failed to download story");

    }

}
async function handleDownloadSanskritStory(story) {

    try {

        const result = await addNewStory(story._id);

        alert(

            result?.data?.message ||

            result?.message ||

            "Story downloaded successfully"

        );

    } catch (error) {

        console.error(error);

        alert("Failed to download story");

    }

}
  async function handleWriteMeta() {

        try {

            setLoading(true);

            const result = await writeMeta();

            alert(

                result.message ||

                "Metadata generated successfully."

            );

        }

        catch(error){

            console.error(error);

            alert("Metadata generation failed.");

        }

        finally{

            setLoading(false);

        }

    }
    async function handleUpload() {
        if (!uploadFile) {
            alert("Please choose a file.");
            return;
        }
        try {
            setLoading(true);

            const result = await uploadStory(uploadFile);

            alert(result.message);

            setUploadFile(null);

            await refreshStories();
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
    async function handleRefresh() {

    // Collapse both sections
    setLearnExpanded(false);
    setSanskritExpanded(false);

    // Clear loaded data
    setLearnStories([]);
    setSanskritStories([]);

    // Mark them as not loaded
    setLearnLoaded(false);
    setSanskritLoaded(false);

    // Return to Available Stories page
    setActiveView("available");

    // Clear upload selection
    setUploadFile(null);

    // Clear tokenized stories
    setTokenizedStories([]);
}
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
        {
            loading && (

            <div
            style={{
            background:"#fff7e7",
            border:"1px solid #f8a53c",
            padding:"15px",
            borderRadius:"12px",
            marginBottom:"20px",
            fontWeight:"700",
            color:"#1f2b6b",
            }}
            >

            Loading...

            </div>

            )
            }

        <div
            style={{
                display: "flex",
                gap: "20px",
                marginBottom: "30px",
                flexWrap: "wrap",
                alignItems: "center",
            }}
            >
            <button
                onClick={handleGetTokenizedStories}
                style={actionButtonStyle}
            >
                Get Tokenized Stories
            </button>

            <button
                onClick={handleRefresh}
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
                        Available Stories
                    </h2>

                    {/* Upload Asset */}

                    <div
                        style={{
                            background: "white",
                            borderRadius: "18px",
                            padding: "24px",
                            marginBottom: "35px",
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
                            <button
                                onClick={handleUpload}
                                style={actionButtonStyle}
                            >
                                Upload
                            </button>
                        </div>
                    </div>

                    {/* Learn Sanskrit Section */}

                    <div
                        style={{
                            background:"white",
                            borderRadius:"18px",
                            marginBottom:"24px",
                            padding:"20px",
                            boxShadow:"0 2px 10px rgba(0,0,0,.08)",
                        }}
                    >

                        <div
                            style={{
                                display:"flex",
                                justifyContent:"space-between",
                                alignItems:"center",
                                cursor:"pointer",
                            }}
                            onClick={toggleLearnStories}
                        >

                            <h3
                                style={{
                                    margin: 0,
                                    color: "#1f2b6b",
                                    fontSize: "20px",
                                    fontWeight: "700",
                                }}
                                >
                                {learnExpanded ? "▼" : "▶"} Stories from LearnSanskrit.cc{" "}
                                {learnLoaded && (
                                    <span
                                    style={{
                                        color: "#666",
                                        fontWeight: "600",
                                    }}
                                    >
                                    ({learnStories.length} stories)
                                    </span>
                                )}
                                </h3>
                        </div>
                        {
                            learnExpanded && (

                                <>

                                    <div
                                        style={{
                                            marginTop:"20px",
                                            marginBottom:"20px",
                                            display:"flex",
                                            justifyContent:"center",
                                        }}
                                    >

                                        <button
                                            onClick={handleWriteMeta}
                                            style={actionButtonStyle}
                                        >
                                            Write Metadata
                                        </button>

                                    </div>

                                    {

                                        loading && !learnLoaded ? (

                                            <p>Loading stories...</p>

                                        ) : (

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                                    gap: "18px",
                                                    width: "100%",
                                                }}
                                            >
                                                {learnStories.map((story) => (
                                                    <div
                                                        key={story._id}
                                                        style={{
                                                            background: "white",
                                                            border: "1px solid #e5e5e5",
                                                            borderRadius: "14px",
                                                            overflow: "hidden",
                                                            width: "100%",
                                                            boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                                                        }}
                                                    >
                                                        <details>
                                                            <summary
                                                                style={{
                                                                    padding: "16px",
                                                                    cursor: "pointer",
                                                                    fontWeight: "700",
                                                                    color: "#1f2b6b",
                                                                    fontSize: "17px",
                                                                    background: "#fafafa",
                                                                }}
                                                            >
                                                                {story.storyTitle}
                                                            </summary>

                                                            <div
                                                                style={{
                                                                    padding: "18px",
                                                                    display: "flex",
                                                                    justifyContent: "center",
                                                                }}
                                                            >
                                                                <button
                                                                    onClick={() => handleDownloadLearnStory(story)}
                                                                    style={actionButtonStyle}
                                                                >
                                                                    Download Story
                                                                </button>
                                                            </div>
                                                        </details>
                                                    </div>
                                                ))}
                                            </div>

                                        )

                                    }

                                </>

                            )

                        }

                    </div>

                    {/* Sanskrit Section */}

                    <div
                        style={{
                            background:"white",
                            borderRadius:"18px",
                            padding:"20px",
                            boxShadow:"0 2px 10px rgba(0,0,0,.08)",
                        }}
                    >

                        <div
                            style={{
                                display:"flex",
                                justifyContent:"space-between",
                                alignItems:"center",
                                cursor:"pointer",
                            }}
                            onClick={toggleSanskritStories}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    color: "#1f2b6b",
                                    fontSize: "20px",
                                    fontWeight: "700",
                                }}
                                >
                                {sanskritExpanded ? "▼" : "▶"} Stories from Sanskrit.Samskrutam.com{" "}
                                {sanskritLoaded && (
                                    <span
                                    style={{
                                        color: "#666",
                                        fontWeight: "600",
                                    }}
                                    >
                                    ({sanskritStories.length} stories)
                                    </span>
                                )}
                            </h3>
                        </div>
                        {

                            sanskritExpanded && (

                                <>

                                    <div
                                        style={{
                                            marginTop:"20px",
                                            marginBottom:"20px",
                                            display:"flex",
                                            justifyContent:"center",
                                        }}
                                    >

                                        <button
                                            onClick={handleWriteMeta}
                                            style={actionButtonStyle}
                                        >
                                            Write Metadata
                                        </button>

                                    </div>

                                    {

                                        loading && !sanskritLoaded ? (

                                            <p>Loading stories...</p>

                                        ) : (
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                                    gap: "18px",
                                                    width: "100%",
                                                }}
                                            >
                                                {sanskritStories.map((story) => (
                                                    <div
                                                        key={story._id}
                                                        style={{
                                                            background: "white",
                                                            border: "1px solid #e5e5e5",
                                                            borderRadius: "14px",
                                                            overflow: "hidden",
                                                            width: "100%",
                                                            boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                                                        }}
                                                    >
                                                        <details>
                                                          <summary
                                                            style={{
                                                                cursor: "pointer",
                                                                fontWeight: "700",
                                                                color: "#1f2b6b",
                                                                fontSize: "16px",
                                                                padding: "14px",
                                                            }}
                                                        >
                                                            {story.english_title}

                                                            <span
                                                                style={{
                                                                    float: "right",
                                                                    color: "#666",
                                                                    fontWeight: "500",
                                                                    fontSize: "14px",
                                                                }}
                                                            >
                                                                {story.sanskrit_title}
                                                            </span>
                                                        </summary>
                                                            <div
                                                                style={{
                                                                    padding: "18px",
                                                                    display: "flex",
                                                                    justifyContent: "center",
                                                                }}
                                                            >
                                                                <button
                                                                    onClick={() => handleDownloadSanskritStory(story)}
                                                                    style={actionButtonStyle}
                                                                >
                                                                    Download Story
                                                                </button>
                                                            </div>
                                                        </details>
                                                    </div>
                                                ))}
                                            </div>

                                        )

                                    }

                                </>

                            )

                        }

                    </div>

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