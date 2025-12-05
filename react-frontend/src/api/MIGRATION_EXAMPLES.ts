/**
 * EXAMPLE: How to use the new LMClient with additional config
 *
 * This file shows patterns for using the new configuration system
 * You don't need to implement these immediately - they're here as reference
 */

import { lmClient } from "./lmClient";
import { getTokenProbabilities } from "./getTokenProbs";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";

// ============================================
// PATTERN 1: Backward Compatible (Current Code)
// ============================================
// All your existing code continues to work unchanged:

async function example_BackwardCompatible() {
  const result = await getTokenProbabilities("Hello world", "gpt2");
  return result;
}

// ============================================
// PATTERN 2: Add New Config (Gradual Migration)
// ============================================
// When you need temperature/max_tokens, just add them:

async function example_WithTemperature() {
  const { temperature, maxTokens } = useLMSettings();

  const result = await getTokenProbabilities("Hello world", "gpt2", {
    temperature: temperature[0] / 100, // Convert from slider value
    max_tokens: maxTokens,
  });
  return result;
}

// ============================================
// PATTERN 3: With Search Strategy
// ============================================
// When you add search algorithms:

async function example_WithSearchStrategy() {
  const result = await getTokenProbabilities("Hello world", "gpt2", {
    search_strategy: "beam",
    temperature: 0.8,
  });
  return result;
}

// ============================================
// PATTERN 4: Direct Client Usage (Most Flexible)
// ============================================
// For new features or custom endpoints:

async function example_DirectClientUsage() {
  const result = await lmClient.request("lm/token_probs", {
    prompt: "Hello world",
    model_name: "gpt2",
    temperature: 0.7,
    max_tokens: 100,
    search_strategy: "greedy",
  });
  return result;
}

// ============================================
// FUTURE: When Migrating to Nomad/vLLM
// ============================================
// You'll only need to update lmClient.ts:
//
// class LMClient {
//   private getEndpoint(modelName: string): string {
//     // Route to different Nomad services based on model
//     const routes = {
//       "gpt2": "http://nomad-gpu-1:8000",
//       "llama": "http://nomad-gpu-2:8000",
//     };
//     return routes[modelName] || API_BASE_URL;
//   }
//
//   async request<T>(endpoint: string, config: Partial<LMRequestConfig>): Promise<T> {
//     const baseURL = this.getEndpoint(config.model_name || "");
//     // ... rest stays the same
//   }
// }

export {};
