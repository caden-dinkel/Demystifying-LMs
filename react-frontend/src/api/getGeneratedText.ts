import axios from "axios";
import { LMOutput } from "../utilities/types";
import { API_BASE_URL } from "./config";

export const getGeneratedText = async (prompt: string): Promise<LMOutput> => {
  try {
    const response = await axios.post<LMOutput>(
      `${API_BASE_URL}lm/generate_text`,
      {
        prompt,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching LM prediction:", error);
    throw error;
  }
};
