import axios from "axios";
import { API_BASE_URL } from "./config";
import {
  IterativeGenerationResponse,
  LMRequestConfig,
} from "../utilities/types";

export const postIterativeGeneration = async (
  prompt: string,
  modelName: string,
  config?: Partial<LMRequestConfig>
): Promise<IterativeGenerationResponse> => {
  try {
    const requestBody = {
      prompt,
      model_name: modelName,
      search_strategy: config?.search_strategy,
      temperature: config?.temperature ? config.temperature / 100 : undefined,
      max_tokens: config?.max_tokens,
    };

    const response = await axios.post<IterativeGenerationResponse>(
      `${API_BASE_URL}lm/iterative_generation`,
      requestBody
    );
    return response.data;
  } catch (error) {
    console.error("Error in iterative generation:", error);
    throw error;
  }
};
