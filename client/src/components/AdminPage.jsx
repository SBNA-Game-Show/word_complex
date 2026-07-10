import { useState, useEffect } from "react";

import {
  getAllStories,
  getAllTokenizedStories,
  addNewStory,
  addNewSamskrutamStory,
  writeLearnSanskritMeta,
  writeSamskrutamMeta,
  uploadStory,
  getUnusedStories,
} from "../services/admin/AdminControls";
// imports from StorySetService
import {
    getStorySets,
    createStorySet,
    activateStorySet,
    deleteStorySet,
} from "../services/admin/StorySetService";

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
  // Story Sets States
  const [storySets, setStorySets] = useState([]);  
  const [selectedStories, setSelectedStories] = useState([]);
  const [storySetName, setStorySetName] = useState("");
  const [storySetLoading, setStorySetLoading] = useState(false);
  
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

        const result = await addNewSamskrutamStory(story._id);

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
// handler function for learn sanskrit stories write meta data
  async function handleWriteLearnMeta() {
    try {
        setLoading(true);
        const result = await writeLearnSanskritMeta();
        alert(
            result.message ||
            "LearnSanskrit metadata generated successfully."
        );
    }
    catch (error) {
        console.error(error);
        alert("LearnSanskrit metadata generation failed.");
    }
    finally {
        setLoading(false);
    }
}
  // handler function to write meta data for samskrutam stories
  async function handleWriteSamskrutamMeta() {
    try {
        setLoading(true);
        const result = await writeSamskrutamMeta();
        alert(
            result.message ||
            "Samskrutam metadata generated successfully."
        );
    }
    catch (error) {
        console.error(error);
        alert("Samskrutam metadata generation failed.");
    }
    finally {
        setLoading(false);
    }
}
// handler for upload
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
      await loadStorySets();
      setActiveView("tokenized");
    } catch (error) {
      alert("Failed to retrieve tokenized stories");
    } finally {
      setLoading(false);
    }
  }
  async function loadStorySets() {
        try {
            setStorySetLoading(true);
            const result = await getStorySets();
            setStorySets(result.data || []);
        }
        catch (error) {
            console.error(error);
            alert(error.message);
        }
        finally {
            setStorySetLoading(false);
        }
    }
    function toggleStorySelection(storyId) {
        setSelectedStories((previous) => {
            if (previous.includes(storyId)) {
                return previous.filter(id => id !== storyId);
            }
            if (previous.length >= 4) {
                alert("You can only select up to 4 stories.");
                return previous;
            }
            return [...previous, storyId];
        });
    }
    async function handleCreateStorySet() {
        if (!storySetName.trim()) {
            alert("Please enter a Story Set name.");
            return;
        }
        if (selectedStories.length === 0) {
            alert("Please select at least one story.");
            return;
        }
        try {
            setStorySetLoading(true);
            const created = await createStorySet(
                storySetName,
                selectedStories
            );
            await activateStorySet(created.data._id);
            alert("Story Set created and activated.");
            setStorySetName("");
            setSelectedStories([]);
            await loadStorySets();
        }
        catch (error) {
            console.error(error);
            alert(error.message);
        }
        finally {
            setStorySetLoading(false);
        }
    }
    async function handleActivateStorySet(setId) {
        try {
            await activateStorySet(setId);
            await loadStorySets();
            alert("Story Set activated.");
        }
        catch (error) {
            console.error(error);
            alert(error.message);
        }
    } 
    async function handleDeleteStorySet(setId) {
        if (!window.confirm("Delete this Story Set?")) {
            return;
        }
        try {
            await deleteStorySet(setId);
            await loadStorySets();
        }
        catch (error) {
            console.error(error);
            alert(error.message);
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
        setLearnExpanded(false);
        setSanskritExpanded(false);
        setLearnStories([]);
        setSanskritStories([]);
        setLearnLoaded(false);
        setSanskritLoaded(false);
        setActiveView("available");
        setUploadFile(null);
        setTokenizedStories([]);
        // Story Set cleanup
        setSelectedStories([]);
        setStorySetName("");
        setStorySets([]);
    }
  useEffect(() => {
    loadStorySets();
}, []);
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
                                    <button onClick={handleWriteLearnMeta}>
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
                                        <button onClick={handleWriteSamskrutamMeta}>
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
                        background: selectedStories.includes(story._id)
                            ? "#f3fff2"
                            : "white",
                        borderRadius: "16px",
                        border: selectedStories.includes(story._id)
                            ? "2px solid #3aa655"
                            : "1px solid #e3e3e3",
                        boxShadow: "0 2px 10px rgba(0,0,0,.08)",
                        transition: "all .2s ease",
                    }}
                >
                <h3
                    style={{
                        marginTop: 0,
                        marginBottom: "14px",
                        color: "#1f2b6b",
                        fontSize: "20px",
                        lineHeight: "1.3",
                    }}
                >
                    {story.storyTitle ||
                    story.title?.englishversion ||
                    story.title?.englishVersion ||
                    story.english_title ||
                    "Untitled Story"}
                </h3>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "14px",
                        gap: "16px",
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: 0,
                                marginBottom: "8px",
                            }}
                        >
                            <strong>Category:</strong> {story.category}
                        </p>
                    </div>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: "700",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={selectedStories.includes(story._id)}
                            onChange={() => toggleStorySelection(story._id)}
                        />
                        Select
                    </label>
                </div>
                <p
                    style={{
                        marginTop: "14px",
                        marginBottom: "16px",}}>
                    <strong>Actors:</strong>
                    {" "}
                    {story.actors?.length
                        ? story.actors.join(", ")
                        : "None"}
                </p>
                <details>
                    <summary
                        style={{
                            cursor: "pointer",
                            fontWeight: "700",
                            color: "#1f2b6b",}}
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
        {/* ============================================
            Story Set Creation Panel
        ============================================ */}
        <div
            style={{
                marginTop: "35px",
                background: "white",
                borderRadius: "18px",
                padding: "24px",
                boxShadow: "0 2px 10px rgba(0,0,0,.08)",
            }}
        >
            <h2
                style={{
                    color: "#1f2b6b",
                    marginTop: 0,
                    marginBottom: "20px",
                }}
            >
                Create Story Set
            </h2>
            <p
                style={{
                    marginTop: 0,
                    marginBottom: "20px",
                    color: "#555",
                    fontSize: "16px",
                }}
            >
                Selected Stories:
                <strong>
                    {" "}
                    {selectedStories.length} / 4
                </strong>
            </p>
            <div
                style={{
                    marginBottom: "20px",
                }}
            >
                <label
                    style={{
                        display: "block",
                        fontWeight: "700",
                        marginBottom: "10px",
                        color: "#1f2b6b",
                    }}
                >
                    Story Set Name
                </label>
                {selectedStories.length > 0 && (
                    <div
                        style={{
                            background: "#f5f8ff",
                            border: "1px solid #d6e2ff",
                            borderRadius: "12px",
                            padding: "14px",
                            marginBottom: "20px",
                        }}
                    >
                        <strong>Selected Stories</strong>
                        <ul
                            style={{
                                marginTop: "10px",
                                marginBottom: 0,
                            }}
                        >
                            {tokenizedStories
                                .filter(story => selectedStories.includes(story._id))
                                .map(story => (
                                    <li key={story._id}>
                                        {story.storyTitle ||
                                        story.title?.englishversion ||
                                        story.title?.englishVersion ||
                                        "Untitled Story"}
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
                <input
                    type="text"
                    placeholder="Enter a Story Set name"
                    value={storySetName}
                    onChange={(e) => setStorySetName(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        border: "1px solid #ccc",
                        fontSize: "16px",
                        boxSizing: "border-box",
                    }}
                />
            </div>
            <button
                onClick={handleCreateStorySet}
                disabled={
                    storySetLoading ||
                    selectedStories.length === 0
                }
                style={{
                    background:
                        selectedStories.length === 0
                            ? "#cccccc"
                            : "#3aa655",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px 30px",
                    fontWeight: "700",
                    fontSize: "16px",
                    cursor:
                        selectedStories.length === 0
                            ? "not-allowed"
                            : "pointer",
                }}
            >
                {storySetLoading
                    ? "Creating..."
                    : "Create & Activate Story Set"}
            </button>
        </div>
        {/* ============================================
            Existing Story Sets
        ============================================ */}
        <div
            style={{
                marginTop: "35px",
                background: "white",
                borderRadius: "18px",
                padding: "24px",
                boxShadow: "0 2px 10px rgba(0,0,0,.08)",
            }}
        >
            <h2
                style={{
                    color: "#1f2b6b",
                    marginTop: 0,
                    marginBottom: "20px",
                }}
            >
                Existing Story Sets
            </h2>
            {storySetLoading ? (
                <p>Loading Story Sets...</p>
            ) : storySets.length === 0 ? (
                <p>No Story Sets created yet.</p>
            ) : (
                storySets.map((set) => (
                    <div
                        key={set._id}
                        style={{
                            border: set.isActive
                                ? "2px solid #3aa655"
                                : "1px solid #ddd",
                            borderRadius: "14px",
                            padding: "18px",
                            marginBottom: "16px",
                            background: set.isActive
                                ? "#f4fff5"
                                : "#fafafa",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        margin: 0,
                                        color: "#1f2b6b",
                                    }}
                                >
                                    {set.name}
                                </h3>
    <div
    style={{
        marginTop: "12px",
    }}
>

    <strong
        style={{
            color: "#1f2b6b",
        }}
    >
        Stories
    </strong>

    <ul
        style={{
            marginTop: "10px",
            marginBottom: 0,
            paddingLeft: "20px",
            color: "#555",
        }}
    >

        {set.storyIds.map((storyId) => {

            const story = tokenizedStories.find(
                (s) => s._id === storyId
            );

            return (
                <li key={storyId}>

                    {story
                        ? (
                            story.storyTitle ||
                            story.title?.englishversion ||
                            story.title?.englishVersion ||
                            "Untitled Story"
                        )
                        : "Story not loaded"}

                </li>
            );

        })}

    </ul>
    </div>
 </div>
                {set.isActive && (
                    <span
                    style={{
                        background: "#3aa655",
                        color: "white",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontWeight: "700",
                    }}
                >
                    🟢 Active
                </span>
                )}
            </div>
                        <div
                            style={{
                                marginTop: "18px",
                                display: "flex",
                                gap: "14px",
                            }}
                        >
                            {!set.isActive && (
                                <button
                                    onClick={() =>
                                        handleActivateStorySet(set._id)
                                    }
                                    style={{
                                        background: "#3aa655",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "10px",
                                        padding: "10px 18px",
                                        cursor: "pointer",
                                        fontWeight: "700",
                                    }}
                                >
                                    Activate
                                </button>
                            )}
                            <button
                            onClick={() => handleDeleteStorySet(set._id)}
                            disabled={set.isActive}
                            style={{
                                background: set.isActive
                                    ? "#cccccc"
                                    : "#d9534f",
                                color: "white",
                                border: "none",
                                borderRadius: "10px",
                                padding: "10px 18px",
                                cursor: set.isActive
                                    ? "not-allowed"
                                    : "pointer",
                                fontWeight: "700",
                            }}
                        >
                            Delete
                        </button>                            
                    </div>
                    </div>
                ))
            )}
        </div>
        </>
        )}
      </div>
      
    </div>
  );
}