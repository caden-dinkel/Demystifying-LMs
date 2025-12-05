import axios from "axios";
import { API_BASE_URL } from "./config";
import { PlannerResponse, HomeState, Tool } from "@/utilities/types";

export interface PlannerRequest {
  prompt: string;
  model_name: string;
  current_state: HomeState;
}

/**
 * Executes a planner command using the LM to generate tool calls
 */
export const executePlanner = async (
  prompt: string,
  modelName: string,
  currentState: HomeState
): Promise<PlannerResponse> => {
  try {
    const response = await axios.post<PlannerResponse>(
      `${API_BASE_URL}planner/execute`,
      {
        prompt,
        model_name: modelName,
        current_state: {
          rooms: currentState.rooms,
          people: currentState.people,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error executing planner:", error);
    throw error;
  }
};

/**
 * Gets the list of available tools
 */
export const getAvailableTools = async (): Promise<Tool[]> => {
  try {
    const response = await axios.get<{ tools: Tool[] }>(
      `${API_BASE_URL}planner/tools`
    );
    return response.data.tools;
  } catch (error) {
    console.error("Error fetching tools:", error);
    throw error;
  }
};
