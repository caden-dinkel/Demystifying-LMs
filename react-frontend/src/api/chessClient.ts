import axios from "axios";
import { API_BASE_URL } from "./config";

export interface ChessMoveResponse {
  move: string;
}

export interface PossibleMovesResponse {
  possible_moves: string[];
}

export interface ApplyMoveResponse {
  new_fen: string;
  success: boolean;
  error?: string;
}

/**
 * Gets all possible legal moves for the given board position in FEN notation
 * @param fen - Current board position in FEN notation
 * @returns Array of legal moves in UCI format (e.g., ["e2e4", "d2d4"])
 */

/**
 * Requests the LM to make a move for the given board position
 * @param fen - Current board position in FEN notation
 * @param modelName - Name of the LM model to use
 * @returns The LM's chosen move in UCI format (e.g., "e2e4")
 */
export const getLMMove = async (
  fen: string,
  modelName: string
): Promise<string> => {
  try {
    const response = await axios.post<ChessMoveResponse>(
      `${API_BASE_URL}chess/make_move`,
      {
        fen,
        model_name: modelName,
      }
    );
    return response.data.move;
  } catch (error) {
    console.error("Error getting LM move:", error);
    throw error;
  }
};
