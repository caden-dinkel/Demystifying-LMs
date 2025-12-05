import axios from "axios";
import { API_BASE_URL } from "./config";
import { Token } from "../utilities/types";

export const postTokenizeText = async (prompt: string, modelName: string): Promise<Token[]> => {
  try {
    const response = await axios.post<Token[]>(
      `${API_BASE_URL}lm/tokenize_text`,
      {
        prompt,
        model_name: modelName,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error Tokenizing input Text:", error);
    throw error;
  }
};
