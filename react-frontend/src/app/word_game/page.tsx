"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Navbar from "@/components/navigation/navBar";
import { Button } from "@/components/ui/button";
import {
  startGame,
  submitGuess,
  getHint,
  giveUp,
} from "@/api/gameClient";
import type { GuessResponse, HintResponse } from "@/api/gameClient";
import styles from "@/styles/main-layout.module.css";

/* ================================================================= */
/*  helpers                                                           */
/* ================================================================= */

type GameStatus = "idle" | "playing" | "won" | "gave_up";

function leftBorder(l: string) {
  if (l.includes("Exact")) return "border-l-green-500";
  if (l.includes("Burning")) return "border-l-red-500";
  if (l.includes("Hot")) return "border-l-orange-500";
  if (l.includes("Warm")) return "border-l-amber-500";
  if (l.includes("Lukewarm")) return "border-l-sky-400";
  if (l.includes("Cold")) return "border-l-blue-500";
  if (l.includes("Freezing")) return "border-l-indigo-500";
  return "border-l-border";
}

function cardBorder(l: string) {
  if (l.includes("Exact")) return "border-green-500/60";
  if (l.includes("Burning")) return "border-red-500/60";
  if (l.includes("Hot")) return "border-orange-500/60";
  if (l.includes("Warm")) return "border-amber-500/60";
  if (l.includes("Lukewarm")) return "border-sky-400/60";
  if (l.includes("Cold")) return "border-blue-500/60";
  if (l.includes("Freezing")) return "border-indigo-500/60";
  return "border-border";
}

function tempText(l: string) {
  if (l.includes("Exact")) return "text-green-600 dark:text-green-400";
  if (l.includes("Burning")) return "text-red-600 dark:text-red-400";
  if (l.includes("Hot")) return "text-orange-600 dark:text-orange-400";
  if (l.includes("Warm")) return "text-amber-600 dark:text-amber-400";
  if (l.includes("Lukewarm")) return "text-sky-600 dark:text-sky-400";
  if (l.includes("Cold")) return "text-blue-600 dark:text-blue-400";
  if (l.includes("Freezing")) return "text-indigo-600 dark:text-indigo-400";
  return "text-muted-foreground";
}

function eduNote(sim: number): string {
  if (sim >= 80)
    return "Nearly identical in embedding space — these words are used in very similar contexts.";
  if (sim >= 55)
    return "Strong relationship — their embedding vectors point in nearly the same direction.";
  if (sim >= 35)
    return "Clear connection — these words share meaningful context patterns in the training data.";
  if (sim >= 20)
    return "Some shared patterns — these words occasionally appear in similar contexts.";
  if (sim >= 10)
    return "Weak link — GPT-2 sees little overlap between these embeddings.";
  return "Very different embeddings — these words rarely share context in GPT-2's training data.";
}

function extractErr(err: unknown): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data
      ?.detail ?? "Something went wrong."
  );
}

/* ================================================================= */
/*  component                                                         */
/* ================================================================= */

export default function WordGamePage() {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [totalWords, setTotalWords] = useState(0);
  const [targetCategory, setTargetCategory] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<GuessResponse[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<HintResponse | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [targetWord, setTargetWord] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const latest = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  const history = useMemo(
    () =>
      guesses
        .slice(0, -1)
        .sort((a, b) => b.similarity - a.similarity),
    [guesses]
  );

  const bestSim = useMemo(
    () => (guesses.length ? Math.max(...guesses.map((g) => g.similarity)) : 0),
    [guesses]
  );

  useEffect(() => {
    if (status === "playing") inputRef.current?.focus();
  }, [status, guesses]);

  /* ---- handlers ---- */

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await startGame();
      setGameId(r.game_id);
      setTotalWords(r.total_words);
      setTargetCategory(r.target_category);
      setGuesses([]);
      setHint(null);
      setHintsUsed(0);
      setTargetWord(null);
      setInput("");
      setStatus("playing");
    } catch (e) {
      setError(extractErr(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async () => {
    if (!gameId || !input.trim()) return;
    setLoading(true);
    setError(null);
    setHint(null);
    try {
      const r = await submitGuess(gameId, input.trim());
      setGuesses((p) => [...p, r]);
      setInput("");
      if (r.is_correct) {
        setTargetWord(r.word);
        setStatus("won");
      }
    } catch (e) {
      setError(extractErr(e));
    } finally {
      setLoading(false);
    }
  };

  const handleHint = async () => {
    if (!gameId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await getHint(gameId);
      setHint(r);
      setHintsUsed((n) => n + 1);
    } catch (e) {
      setError(extractErr(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGiveUp = async () => {
    if (!gameId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await giveUp(gameId);
      setTargetWord(r.target_word);
      setStatus("gave_up");
    } catch (e) {
      setError(extractErr(e));
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGuess();
    }
  };

  const ended = status === "won" || status === "gave_up";

  /* ---- render ---- */
  return (
    <div>
      <Navbar />
      <main className={styles.baseMain}>
        <div className="w-full max-w-xl mx-auto space-y-6">
          {/* ---------- header ---------- */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Word Association Game
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Guess the secret word — scored by cosine similarity between
              GPT-2 embedding vectors.
            </p>
          </div>

          {/* ---------- intro (idle) ---------- */}
          {status === "idle" && (
            <div className="text-center space-y-3 py-2">
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                A secret word is chosen at random. Type any word and GPT-2
                measures how closely related it is using{" "}
                <strong>cosine similarity</strong> between their embedding
                vectors — the same representations the model uses internally
                to understand language.
              </p>
              <p className="text-muted-foreground text-xs">
                Words that appear in similar contexts share similar
                embeddings. Can you reach 100%?
              </p>
            </div>
          )}

          {/* ---------- stats ---------- */}
          {status !== "idle" && (
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <span>
                Guesses:{" "}
                <strong className="text-foreground">{guesses.length}</strong>
              </span>
              <span>
                Hints:{" "}
                <strong className="text-foreground">{hintsUsed}</strong>
              </span>
              <span>
                Best:{" "}
                <strong className="text-foreground">{bestSim}%</strong>
              </span>
            </div>
          )}

          {/* ---------- target category clue ---------- */}
          {status === "playing" && targetCategory && (
            <div className="text-center py-2 px-4 rounded-md bg-muted/50 border border-border">
              <span className="text-sm text-muted-foreground">
                The secret word is a:{" "}
              </span>
              <span className="text-sm font-semibold">{targetCategory}</span>
            </div>
          )}

          {/* ---------- end banners ---------- */}
          {status === "won" && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                You got it! The word was “{targetWord}”
              </p>
              <p className="text-sm text-muted-foreground">
                Solved in {guesses.length} guess
                {guesses.length !== 1 && "es"} with {hintsUsed} hint
                {hintsUsed !== 1 && "s"}
              </p>
            </div>
          )}
          {status === "gave_up" && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
              <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                The word was “{targetWord}”
              </p>
              <p className="text-sm text-muted-foreground">
                {guesses.length} guess{guesses.length !== 1 && "es"} made
              </p>
            </div>
          )}

          {/* ---------- start / again ---------- */}
          {(status === "idle" || ended) && (
            <div className="text-center">
              <Button onClick={handleStart} disabled={loading} size="lg">
                {status === "idle" ? "Start Game" : "Play Again"}
              </Button>
            </div>
          )}

          {/* ---------- input + controls ---------- */}
          {status === "playing" && (
            <>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Type a word…"
                  disabled={loading}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2
                             text-sm shadow-sm placeholder:text-muted-foreground
                             focus-visible:outline-none focus-visible:ring-1
                             focus-visible:ring-ring disabled:opacity-50"
                />
                <Button
                  onClick={handleGuess}
                  disabled={loading || !input.trim()}
                >
                  Guess
                </Button>
              </div>

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHint}
                  disabled={loading || guesses.length === 0}
                >
                  💡 Hint
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGiveUp}
                  disabled={loading}
                >
                  🏳️ Give Up
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStart}
                  disabled={loading}
                >
                  🔄 New Game
                </Button>
              </div>
            </>
          )}

          {/* ---------- error ---------- */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ---------- hint ---------- */}
          {hint && status === "playing" && (
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-sm">
              <span className="font-medium">💡 Hint:</span> Try something
              like “<strong>{hint.hint_word}</strong>”
              <span className="text-muted-foreground">
                {" "}
                ({hint.hint_similarity}% similar)
              </span>
            </div>
          )}

          {/* ========================================================= */}
          {/*  LATEST GUESS CARD                                         */}
          {/* ========================================================= */}
          {latest && (
            <div
              className={`rounded-lg border-2 p-5 space-y-4 ${cardBorder(
                latest.hot_cold
              )}`}
            >
              {/* word row */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Guess #{latest.guess_number}
                  </p>
                  <p className="text-xl font-bold mt-0.5">
                    “{latest.word}”
                  </p>
                  {latest.input_word !== latest.word && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      “{latest.input_word}” → “
                      {latest.word}” (base form)
                    </p>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold whitespace-nowrap ${tempText(
                    latest.hot_cold
                  )}`}
                >
                  {latest.hot_cold}
                </span>
              </div>

              {/* big number */}
              <div className="text-center py-3">
                <p
                  className={`text-6xl font-extrabold tabular-nums leading-none ${tempText(
                    latest.hot_cold
                  )}`}
                >
                  {latest.similarity}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  cosine similarity
                </p>
              </div>

              {/* percentile */}
              <p className="text-center text-sm text-muted-foreground">
                Closer than{" "}
                <strong className="text-foreground">
                  {latest.percentile}%
                </strong>{" "}
                of the vocabulary
              </p>

              {/* category comparison */}
              <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                <span>
                  <span className="text-muted-foreground">Your word: </span>
                  <span className="font-medium">{latest.word_category}</span>
                </span>
                {latest.category_match ? (
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ✓ Same category
                  </span>
                ) : (
                  <span className="text-muted-foreground">✗ Different</span>
                )}
              </div>

              {/* educational note */}
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                💬 {eduNote(latest.similarity)}
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/*  HISTORY                                                    */}
          {/* ========================================================= */}
          {history.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Previous Guesses
              </h3>

              {history.map((g) => (
                <div
                  key={g.guess_number}
                  className={`flex items-center justify-between rounded-md border-l-4 border
                              py-2 px-3 ${leftBorder(g.hot_cold)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground tabular-nums w-5 text-right">
                      {g.guess_number}
                    </span>
                    <span className="font-medium text-sm">{g.word}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {g.word_category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm tabular-nums font-semibold ${tempText(
                        g.hot_cold
                      )}`}
                    >
                      {g.similarity}%
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {g.hot_cold}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}