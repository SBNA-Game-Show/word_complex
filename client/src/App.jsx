import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import VideoBackground from "./components/VideoBackground";
import LoginPage from "./components/LoginPage";
import Launcher from "./components/Launcher";
import GameScreen from "./components/GameScreen";
import HowToPlay from "./components/HowToPlay";
import AboutPage from "./components/AboutPage";
import CharacterSelect from "./components/CharacterSelect";
import "./App.css";

const CHARACTER_STORAGE_KEY = "wc:selectedCharacter";

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();
  const [screen, setScreen] = useState("launcher");
  const [activeGameId, setActiveGameId] = useState("sentence-builder");
  const [selectedCharacterId, setSelectedCharacterId] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(CHARACTER_STORAGE_KEY);
  });
  const [transitionPhase, setTransitionPhase] = useState("idle");

  useEffect(() => {
    if (!isAuthenticated) {
      setScreen("launcher");
    }
  }, [isAuthenticated]);

  function openGame(gameId) {
    setActiveGameId(gameId);
    setScreen("game");
  }

  function openHowToPlay(gameId = activeGameId) {
    setActiveGameId(gameId);
    setScreen("how-to-play");
  }

  function selectCharacter(characterId) {
    setSelectedCharacterId(characterId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHARACTER_STORAGE_KEY, characterId);
    }
  }

  function openCharacters() {
    if (transitionPhase !== "idle") return;
    setTransitionPhase("zoom-in");
    window.setTimeout(() => {
      setScreen("characters");
      setTransitionPhase("idle");
    }, 700);
  }

  return (
    <div className={`app${transitionPhase === "zoom-in" ? " is-zooming-house" : ""}`}>
      <VideoBackground />
      {!isAuthenticated ? (
        <LoginPage />
      ) : screen === "launcher" ? (
          <Launcher
            onStart={openGame}
            onAbout={() => setScreen("about")}
            onHowToPlay={openHowToPlay}
            onChooseCharacter={openCharacters}
            isZooming={transitionPhase === "zoom-in"}
          />
      ) : screen === "characters" ? (
        <CharacterSelect
          selectedId={selectedCharacterId}
          onSelect={selectCharacter}
          onBack={() => setScreen("launcher")}
        />
      ) : screen === "about" ? (
        <AboutPage
          onBack={() => setScreen("launcher")}
          onPlay={() => openGame("sentence-builder")}
        />
      ) : screen === "how-to-play" ? (
        <HowToPlay
          gameId={activeGameId}
          onBack={() => setScreen("launcher")}
          onPlay={() => openGame(activeGameId)}
        />
      ) : (
        <GameScreen gameId={activeGameId} onBack={() => setScreen("launcher")} />
      )}
    </div>
  );
}
