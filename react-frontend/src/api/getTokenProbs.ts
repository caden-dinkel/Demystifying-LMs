import axios from "axios";
import { TokenProb } from "./types";
import { API_BASE_URL } from "./config";

export const getTokenProbabilities = async (
  prompt: string
): Promise<TokenProb> => {
  try {
    const response = await axios.post<TokenProb>(
      `${API_BASE_URL}lm/token_probs`,
      { prompt }
    );
    const returnTokenProbs: TokenProb = {
      tokens: response.data.tokens,
      probabilities: response.data.probabilities,
    };
    return response.data;
  } catch (error) {
    console.error("Error fetching LM prediction:", error);
    throw error;
  }
};
