import axios from "axios";
import { API_BASE_URL } from "./config";
import { Token } from "../lib/types";

//If there are bugs, you forgot the backend loser
export const postTokenizeText = async (prompt: string): Promise<Token[]> => {
  try {
    const response = await axios.post<Token[]>(
      `${API_BASE_URL}lm/tokenize_text_gpt`,
      {
        prompt,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error Tokenizing input Text:", error);
    throw error;
  }
};
