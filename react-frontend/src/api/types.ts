//This file defines types that are returned from API calls

export interface TokenProb {
  tokens: string[];
  probabilities: number[];
}

export interface LMOutput {
  prompt: string;
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
}

export interface Person {
  location: string;
  name: string;
  preferredTemp: number;
}

export interface TreeNode {
  id: string;
  token: string;
  prob: number;
  parentNodeId: string | null;
  childrenNodeIds: string[];
  isSelected: boolean;
}

export interface TokenData {
  id: string;
  token: string;
  prob: number;
}
