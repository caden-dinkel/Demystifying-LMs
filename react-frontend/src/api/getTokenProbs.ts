import axios from "axios";
import { TokenProb } from "../utilities/types";
import { API_BASE_URL } from "./config";

export const getTokenProbabilities = async (
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
