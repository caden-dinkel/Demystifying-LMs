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
