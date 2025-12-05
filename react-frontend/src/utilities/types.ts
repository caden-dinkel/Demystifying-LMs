//This file defines types that are returned from API calls
import {
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_SEARCH_STRATEGY,
} from "@/api/config";

export interface TokenProb {
  tokens: string[];
  probabilities: number[];
  token_ids: number[];
}

export interface LMOutput {
  token: string;
}

export interface Token {
  value: string;
  id: number;
}

export interface Room {
  bounds: { leftX: number; rightX: number; topY: number; bottomY: number };
  name: string;
  id: string;
  targetTemp: number;
  currentTemp: number;
  hvacMode: "heat" | "cool" | "off";
}

export interface Waypoint {
  roomId: string;
  x: number;
  y: number;
  arrivalTime: number; // timestamp when person should arrive
}

export interface Person {
  location: string;
  name: string;
  preferredTemp: number;
  x?: number;
  y?: number;
  comfortable: boolean;
  waypoints?: Waypoint[]; // Path for person to follow
  currentWaypointIndex?: number; // Which waypoint they're heading to
}

export interface TreeNode {
  id: string;
  parentNodeId: string | null;
  childrenNodeIds: string[];
  // Primary token
  token: string;
  prob: number;
  token_id?: number; // Optional token ID
  isSelected?: boolean;
}

export interface TokenData {
  id: string;
  token: string;
  prob: number;
  token_id?: number; // Optional token ID for hover display
}

// lib/types.ts (Animation Data)

export interface AnimationCoords {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface StepData {
  step: number;
  top_k_tokens: string[];
  top_k_probs: number[];
  top_k_token_ids: number[];
  chosen_token: string;
  chosen_token_id: number;
}

export interface IterativeGenerationResponse {
  generated_text: string;
  steps: StepData[];
}

// LM Request Configuration
// This will be the unified config for all LM API calls
export interface LMRequestConfig {
  prompt: string;
  model_name: string;
  temperature?: number;
  max_tokens?: number;
  search_strategy?: string;
  // Add more as needed - backend will ignore unknown fields
}

// Default values for LM requests

export const DEFAULT_LM_CONFIG: Partial<LMRequestConfig> = {
  temperature: DEFAULT_TEMPERATURE,
  max_tokens: DEFAULT_MAX_TOKENS,
  search_strategy: DEFAULT_SEARCH_STRATEGY,
};

// Smart Home Planner Types

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
  enum?: string[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, Omit<ToolParameter, "name" | "required">>;
    required: string[];
  };
}

export interface ToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  timestamp?: number;
  success?: boolean;
  result?: any;
}

export interface PlannerResponse {
  reasoning: string;
  tool_calls: ToolCall[];
  complete: boolean;
  error?: string;
}

export interface HomeState {
  rooms: Room[];
  people: Person[];
  history: ToolCall[];
}
