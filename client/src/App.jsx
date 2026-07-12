import { useEffect, useState } from "react";
import { AuthProvider, LoginPage, useAuth } from "./auth";
import { ProgressProvider, StreakToast } from "./progress";
import VideoBackground from "./components/VideoBackground";
import Launcher from "./components/Launcher";
import GameScreen from "./components/GameScreen";
import HowToPlay from "./components/HowToPlay";
import AboutPage from "./components/AboutPage";
import CharacterSelect from "./components/CharacterSelect";
import StreakRewards from "./components/StreakRewards";
import StoryPicker from "./storyPicker/StoryPicker";
import {
  getSelectedStoryId,
  setSelectedStoryId,
  clearSelectedStoryId,
} from "./storyPicker/activeStory";
import { LeaderboardPage } from "./leaderboard";
import GameScene from "./scenes/GameScene";
import { getSceneConfig } from "./scenes/sceneConfig";
import { usePreloadImages } from "./preloadImages";
import "./App.css";
import AdminPage from "./components/AdminPage";

const CHARACTER_STORAGE_KEY = "wc:selectedCharacter";

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <AuthenticatedApp />
      </ProgressProvider>
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isInitializing } = useAuth();
  const isAdminRoute =
    typeof window !== "undefined" && window.location.pathname === "/admin";
  const [screen, setScreen] = useState("launcher");
  const [activeGameId, setActiveGameId] = useState("sentence-builder");
  const [selectedCharacterId, setSelectedCharacterId] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(CHARACTER_STORAGE_KEY);
  });
  // Chosen story for this session. Not persisted — the picker gates every login,
  // so a fresh load starts null and the player picks again. Mirrored into the
  // activeStory store so the per-game fetch services can read it at request time.
  const [selectedStoryId, setSelectedStoryIdState] = useState(() =>
    getSelectedStoryId(),
  );
  const [transitionPhase, setTransitionPhase] = useState("idle");
  // "idle" while on the menu, "swiping" during the menu swipe-out before a
  // scene-based game mounts. Used to disable launch buttons and drive the swipe.
  const [launchPhase, setLaunchPhase] = useState("idle");

  // Warm the character + scene art in the background once the user is in, so it
  // is already cached by the time they open Choose Character or launch a game.
  usePreloadImages(undefined, isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setScreen("launcher");
      // Clear the session story on logout so the next login re-gates the picker.
      clearSelectedStoryId();
      setSelectedStoryIdState(null);
    }
  }, [isAuthenticated]);

  // Commit a story pick: update the shared store (read by game services) and the
  // React state (drives the gate/UI), then head to the launcher.
  function chooseStory(storyId) {
    setSelectedStoryId(storyId);
    setSelectedStoryIdState(storyId);
    setScreen("launcher");
  }

  // Admins skip the game shell entirely (after all hooks have run).
  if (isAdminRoute) {
    return <AdminPage />;
  }

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
      {/* Hold the daily-streak celebration until the player is past the story
          gate, so it lands on the launcher after they pick a story rather than
          on the picker itself. The award is already waiting in context. */}
      {isAuthenticated && selectedStoryId && <StreakToast />}
      {isInitializing ? (
        <div className="auth-splash" role="status" aria-live="polite">
          <p className="splash-word">Word Complex</p>
          <p className="splash-sub">Getting your adventure ready…</p>
        </div>
      ) : !isAuthenticated ? (
        <LoginPage />
      ) : !selectedStoryId ? (
        // Gate: every session must pick a story before reaching the launcher.
        <StoryPicker onConfirm={chooseStory} />
      ) : screen === "story" ? (
        // Re-pick opened from the launcher — has a Back button.
        <StoryPicker
          currentStoryId={selectedStoryId}
          onConfirm={chooseStory}
          onBack={() => setScreen("launcher")}
        />
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
          onChooseStory={() => setScreen("story")}
          onLeaderboard={() => setScreen("leaderboard")}
          onOpenStreak={() => setScreen("streak")}
          isZooming={transitionPhase === "zoom-in"}
        />
      ) : screen === "leaderboard" ? (
        <LeaderboardPage onBack={() => setScreen("launcher")} />
      ) : screen === "streak" ? (
        <StreakRewards onBack={() => setScreen("launcher")} />
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
        <GameScreen
          gameId={activeGameId}
          onBack={() => setScreen("launcher")}
        />
      )}
    </div>
  );
}
