import axios, { AxiosInstance } from "axios";
import { API_BASE_URL } from "./config";
import { LMRequestConfig, DEFAULT_LM_CONFIG } from "@/utilities/types";

/**
 * LM Client - Centralized API client for all LM requests
 * This provides a unified interface that will make the Nomad/vLLM migration easier
 */
class LMClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Build request body with defaults
   * Merges provided config with defaults, making future additions easier
   */
  private buildRequestBody(config: Partial<LMRequestConfig>): LMRequestConfig {
    return {
      ...DEFAULT_LM_CONFIG,
      ...config,
    } as LMRequestConfig;
  }

  /**
   * Generic request method
   * When migrating to Nomad, you'll only need to update this method
   */
  async request<T>(
    endpoint: string,
    config: Partial<LMRequestConfig>
  ): Promise<T> {
    try {
      const requestBody = this.buildRequestBody(config);
      const response = await this.client.post<T>(endpoint, requestBody);
      return response.data;
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw error;
    }
  }

  // Convenience methods for existing endpoints
  // These maintain backward compatibility with your current code

  async getTokenProbabilities(
    prompt: string,
    modelName: string,
    config?: Partial<LMRequestConfig>
  ) {
    return this.request("lm/token_probs", {
      prompt,
      model_name: modelName,
      ...config,
    });
  }

  async generateText(
    prompt: string,
    modelName: string,
    config?: Partial<LMRequestConfig>
  ) {
    return this.request("lm/generate_text", {
      prompt,
      model_name: modelName,
      ...config,
    });
  }

  async tokenizeText(prompt: string, modelName: string) {
    return this.request("lm/tokenize_text", {
      prompt,
      model_name: modelName,
    });
  }

  async iterativeGeneration(
    prompt: string,
    modelName: string,
    config?: Partial<LMRequestConfig>
  ) {
    return this.request("lm/iterative_generation", {
      prompt,
      model_name: modelName,
      ...config,
    });
  }

  /**
   * Future: When migrating to Nomad/vLLM
   * You can add model routing logic here:
   *
   * private getModelEndpoint(modelName: string): string {
   *   const modelRoutes = {
   *     "gpt2": "http://nomad-service/gpt2",
   *     "llama": "http://nomad-service/llama"
   *   };
   *   return modelRoutes[modelName] || API_BASE_URL;
   * }
   */
}

// Export singleton instance
export const lmClient = new LMClient();

// Export type for consumers
export type { LMRequestConfig };
