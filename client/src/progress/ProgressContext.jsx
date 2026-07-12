/**
 * ProgressContext.jsx
 * --------------------------------------------------------------------------
 * The single source of streak/stars/owned-character state for the UI. It talks
 * to the server (progressService) and exposes a small hook — useProgress() —
 * so no component ever calls the API or knows where the data lives.
 *
 * On sign-in it loads the economy config once and registers today's visit
 * (which continues the streak and awards stars, server-side). The visit runs
 * exactly once per user per session (a ref guards against React's double-mount)
 * — and is idempotent on the server anyway, so a repeat is a harmless no-op.
 * --------------------------------------------------------------------------
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../auth/AuthContext";
import {
  buyCharacter as buyCharacterApi,
  fetchProgressConfig,
  registerVisit,
} from "./progressService";

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const [config, setConfig] = useState(null);
  const [progress, setProgress] = useState(null);
  const [dailyAward, setDailyAward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Which uid we've already initialised, so a re-mount doesn't visit twice.
  const initedUid = useRef(null);

  useEffect(() => {
    if (!uid) {
      initedUid.current = null;
      setProgress(null);
      setDailyAward(null);
      return undefined;
    }
    if (initedUid.current === uid) return undefined;
    initedUid.current = uid;

    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const [loadedConfig, visit] = await Promise.all([
          fetchProgressConfig(),
          registerVisit(uid),
        ]);
        if (cancelled) return;
        setConfig(loadedConfig);
        setProgress(visit);
        // Celebrate only a fresh daily reward, not a same-day repeat visit.
        if (visit.isNewDay && visit.awardedStars > 0) {
          setDailyAward({
            streak: visit.streak,
            awardedStars: visit.awardedStars,
            giftedCharacters: visit.giftedCharacters,
          });
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const buyCharacter = useCallback(
    async (characterId) => {
      if (!uid) throw new Error("You must be signed in to buy a character.");
      const next = await buyCharacterApi(uid, characterId);
      setProgress((current) => ({ ...current, ...next }));
      return next;
    },
    [uid],
  );

  const dismissAward = useCallback(() => setDailyAward(null), []);

  // Free characters always count as owned, even for accounts created before the
  // free set changed — union them with whatever the player has bought or been gifted.
  const ownedCharacters = Array.from(
    new Set([...(config?.freeCharacters ?? []), ...(progress?.ownedCharacters ?? [])]),
  );

  const value = useMemo(
    () => ({
      streak: progress?.streak ?? 0,
      stars: progress?.stars ?? 0,
      ownedCharacters,
      ladder: config?.ladder ?? [],
      milestones: config?.milestones ?? {},
      prices: config?.prices ?? {},
      loading,
      error,
      dailyAward,
      dismissAward,
      buyCharacter,
      isOwned: (id) => ownedCharacters.includes(id),
      priceOf: (id) => config?.prices?.[id] ?? null,
    }),
    [progress, ownedCharacters, config, loading, error, dailyAward, dismissAward, buyCharacter],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used inside ProgressProvider.");
  }
  return context;
}
