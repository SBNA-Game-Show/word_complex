import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import VideoBackground from "./components/VideoBackground";
import LoginPage from "./components/LoginPage";
import Launcher from "./components/Launcher";
import GameScreen from "./components/GameScreen";
import HowToPlay from "./components/HowToPlay";
import AboutPage from "./components/AboutPage";
import CharacterSelect from "./components/CharacterSelect";
import GameScene from "./scenes/GameScene";
import AdminPanel from "./admin";
import { getSceneConfig } from "./scenes/sceneConfig";
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
  const { isAuthenticated, isAdmin } = useAuth();
  const [screen, setScreen] = useState("launcher");
  const [activeGameId, setActiveGameId] = useState("sentence-builder");
  const [selectedCharacterId, setSelectedCharacterId] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(CHARACTER_STORAGE_KEY);
  });
  const [transitionPhase, setTransitionPhase] = useState("idle");
  // "idle" while on the menu, "swiping" during the menu swipe-out before a
  // scene-based game mounts. Used to disable launch buttons and drive the swipe.
  const [launchPhase, setLaunchPhase] = useState("idle");

  useEffect(() => {
    if (!isAuthenticated) {
      setScreen("launcher");
    } else if (isAdmin) {
      // Admins land on the admin panel after login (they can switch to games
      // from there). Non-admins keep the normal launcher flow.
      setScreen("admin");
    }
  }, [isAuthenticated, isAdmin]);

  function openGame(gameId) {
    setActiveGameId(gameId);
    setScreen("game");
  }

  // Launch a game from the menu. Games with a sceneConfig entry get the polished
  // swipe-then-environment treatment; everything else opens instantly.
  function launchGame(gameId) {
    if (launchPhase !== "idle") return; // guard against spam-clicks mid-transition

    const sceneConfig = getSceneConfig(gameId);
    if (!sceneConfig) {
      openGame(gameId);
      return;
    }

    setLaunchPhase("swiping");
    window.setTimeout(() => {
      setActiveGameId(gameId);
      setScreen("scene");
      setLaunchPhase("idle");
    }, sceneConfig.transitionMs);
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
    <div
      className={`app${transitionPhase === "zoom-in" ? " is-zooming-house" : ""}${
        launchPhase === "swiping" ? " is-launching-game" : ""
      }`}
    >
      <VideoBackground />
      {!isAuthenticated ? (
        <LoginPage />
      ) : screen === "admin" ? (
        <AdminPanel onExit={() => setScreen("launcher")} />
      ) : screen === "scene" ? (
        <GameScene
          gameId={activeGameId}
          selectedCharacterId={selectedCharacterId}
          onBack={() => setScreen("launcher")}
        />
      ) : screen === "launcher" ? (
          <Launcher
            onStart={launchGame}
            onAbout={() => setScreen("about")}
            onHowToPlay={openHowToPlay}
            onChooseCharacter={openCharacters}
            onOpenAdmin={() => setScreen("admin")}
            isAdmin={isAdmin}
            isZooming={transitionPhase === "zoom-in"}
            isLaunching={launchPhase !== "idle"}
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
          onPlay={() => launchGame("sentence-builder")}
        />
      ) : screen === "how-to-play" ? (
        <HowToPlay
          gameId={activeGameId}
          onBack={() => setScreen("launcher")}
          onPlay={() => launchGame(activeGameId)}
        />
      ) : (
        <GameScreen gameId={activeGameId} onBack={() => setScreen("launcher")} />
      )}
    </div>
  );
}
