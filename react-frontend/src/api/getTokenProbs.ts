import axios from "axios";
import { TokenProb } from "../utilities/types";
import { API_BASE_URL } from "./config";
import { lmClient, LMRequestConfig } from "./lmClient";

/**
 * Get token probabilities (Legacy interface)
 * Maintains backward compatibility while supporting new config options
 */
export const getTokenProbabilities = async (
  prompt: string,
  modelName: string,
  config?: Partial<LMRequestConfig>
): Promise<TokenProb> => {
  try {
    // Using new client - easy to migrate to Nomad later
    return (await lmClient.getTokenProbabilities(
      prompt,
      modelName,
      config
    )) as TokenProb;
  } catch (error) {
    console.error("Error fetching LM prediction:", error);
    throw error;
  }
};

/**
 * Legacy implementation (kept for reference/rollback)
 * Can be removed after migration is stable
 */
export const getTokenProbabilitiesLegacy = async (
  prompt: string,
  modelName: string
): Promise<TokenProb> => {
  try {
    const response = await axios.post<TokenProb>(
      `${API_BASE_URL}lm/token_probs`,
      { prompt, model_name: modelName }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching LM prediction:", error);
    throw error;
  }
};
