import axios from "axios";

const API_BASE = "/api";

/* ---------- response types ---------- */

export interface StartGameResponse {
  game_id: string;
  total_words: number;
  target_category: string;
}

export interface GuessResponse {
  word: string;
  input_word: string;
  similarity: number;
  percentile: number;
  hot_cold: string;
  is_correct: boolean;
  word_category: string;
  category_match: boolean;
}

export interface HintResponse {
  hint_word: string;
  hint_similarity: number;
}

export interface GiveUpResponse {
  target_word: string;
}

/* ---------- enriched client-side entry ---------- */

export interface GuessEntry extends GuessResponse {
  guess_number: number;
}

/* ---------- API calls ---------- */

export async function startGame(): Promise<StartGameResponse> {
  const res = await axios.post<StartGameResponse>(`${API_BASE}/game/start`);
  return res.data;
}

export async function submitGuess(
  gameId: string,
  word: string
): Promise<GuessResponse> {
  const res = await axios.post<GuessResponse>(`${API_BASE}/game/guess`, {
    game_id: gameId,
    word,
  });
  return res.data;
}

export async function getHint(
  gameId: string,
  lastGuess: string,
  previousGuesses: string[]
): Promise<HintResponse> {
  const res = await axios.post<HintResponse>(`${API_BASE}/game/hint`, {
    game_id: gameId,
    last_guess: lastGuess,
    previous_guesses: previousGuesses,
  });
  return res.data;
}

export async function giveUp(gameId: string): Promise<GiveUpResponse> {
  const res = await axios.post<GiveUpResponse>(`${API_BASE}/game/give_up`, {
    game_id: gameId,
  });
  return res.data;
}
