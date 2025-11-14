export const API_BASE_URL = "http://127.0.0.1:8000/";

export const LLAMA_LM = "Llama-3.2";

export const GPT_LM = "GPT-2";

export const CHESS_LLAMA_LM = "Chess-Llama";

export const AVAILABLE_LMS = [GPT_LM, LLAMA_LM, CHESS_LLAMA_LM];
export const DEFAULT_LM = GPT_LM;

export const GREEDY_SEARCH = "Greedy";
export const BEAM_SEARCH = "Beam";
export const SAMPLING_SEARCH = "Sampling";
export const ASSISTED_SEARCH = "Assisted";

export const SEARCH_STRATEGIES = [
  GREEDY_SEARCH,
  BEAM_SEARCH,
  SAMPLING_SEARCH,
  ASSISTED_SEARCH,
];
export const DEFAULT_SEARCH_STRATEGY = GREEDY_SEARCH;

export const DEFAULT_TEMPERATURE = 70; // Slider value from 0 to 100
export const DEFAULT_MAX_TOKENS = 50; // Lowered from 1000 to 50
