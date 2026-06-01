import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import VideoBackground from "./components/VideoBackground";
import LoginPage from "./components/LoginPage";
import Launcher from "./components/Launcher";
import GameScreen from "./components/GameScreen";
import HowToPlay from "./components/HowToPlay";
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

  return (
    <div className="app">
      <VideoBackground />
      {!isAuthenticated ? (
        <LoginPage />
      ) : screen === "launcher" ? (
        <Launcher
          onStart={() => openGame("sentence-builder")}
          onHowToPlay={() => setScreen("how-to-play")}
        />
      ) : screen === "how-to-play" ? (
        <HowToPlay
          onBack={() => setScreen("launcher")}
          onPlay={() => openGame("sentence-builder")}
        />
      ) : (
        <GameScreen gameId={activeGameId} onBack={() => setScreen("launcher")} />
      )}
    </div>
  );
}
