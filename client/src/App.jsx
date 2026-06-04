import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import VideoBackground from "./components/VideoBackground";
import LoginPage from "./components/LoginPage";
import Launcher from "./components/Launcher";
import GameScreen from "./components/GameScreen";
import HowToPlay from "./components/HowToPlay";
import AboutPage from "./components/AboutPage";
import "./App.css";

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

  return (
    <div className="app">
      <VideoBackground />
      {!isAuthenticated ? (
        <LoginPage />
      ) : screen === "launcher" ? (
          <Launcher
            onStart={openGame}
            onAbout={() => setScreen("about")}
            onHowToPlay={openHowToPlay}
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
