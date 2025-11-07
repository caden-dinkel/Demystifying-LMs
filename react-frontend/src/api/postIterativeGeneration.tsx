import axios from "axios";
import { API_BASE_URL } from "./config";
import { IterativeGenerationResponse } from "../utilities/types";

export const postIterativeGeneration = async (
  prompt: string,
  modelName: string
): Promise<IterativeGenerationResponse> => {
  try {
    const response = await axios.post<IterativeGenerationResponse>(
      `${API_BASE_URL}lm/iterative_generation`,
      { prompt, model_name: modelName }
    );
    return response.data;
  } catch (error) {
    console.error("Error in iterative generation:", error);
    throw error;
  }
};

