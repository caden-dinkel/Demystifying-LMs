import os
import numpy as np
from openai import OpenAI, AsyncOpenAI
from typing import Optional, Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

# Model mapping configuration
MODEL_MAPPING: Dict[str, str] = {
    "GPT-2": "openai/gpt-2",
    "Llama-3.2": "meta-llama/Llama-3.2-1B-Instruct",
}

class OpenRouterClient:
    """Client for interacting with OpenRouter API using OpenAI SDK."""
    
    def __init__(self):
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is not set")
        
        # Sync client for non-async endpoints
        self.sync_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
        
        # Async client for parallel beam search
        self.async_client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
    
    def get_openrouter_model(self, model_name: str) -> str:
        """Get OpenRouter model name from internal model name."""
        return MODEL_MAPPING.get(model_name, model_name)
    
    def chat_completion(
        self,
        model: str,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        logprobs: bool = False,
        top_logprobs: Optional[int] = None,
        top_p: Optional[float] = None
    ) -> Any:
        """Make a synchronous chat completion request."""
        params = {
            "model": model,
            "messages": messages,
        }
        
        if max_tokens is not None:
            params["max_tokens"] = max_tokens
        if temperature is not None:
            params["temperature"] = temperature
        if logprobs:
            params["logprobs"] = True
        if top_logprobs is not None:
            params["top_logprobs"] = top_logprobs
        if top_p is not None:
            params["top_p"] = top_p
        
        return self.sync_client.chat.completions.create(**params)
    
    async def chat_completion_async(
        self,
        model: str,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        logprobs: bool = False,
        top_logprobs: Optional[int] = None,
        top_p: Optional[float] = None
    ) -> Any:
        """Make an asynchronous chat completion request."""
        params = {
            "model": model,
            "messages": messages,
        }
        
        if max_tokens is not None:
            params["max_tokens"] = max_tokens
        if temperature is not None:
            params["temperature"] = temperature
        if logprobs:
            params["logprobs"] = True
        if top_logprobs is not None:
            params["top_logprobs"] = top_logprobs
        if top_p is not None:
            params["top_p"] = top_p
        
        return await self.async_client.chat.completions.create(**params)
    
    @staticmethod
    def logprob_to_probability(logprob: float) -> float:
        """Convert log probability to probability."""
        return float(np.exp(logprob))
    
    @staticmethod
    def extract_token_info(completion) -> Dict[str, Any]:
        """Extract token information from OpenRouter completion response."""
        if not completion.choices:
            return {}
        
        choice = completion.choices[0]
        if not choice.logprobs:
            return {}
        
        logprobs = choice.logprobs
        content_tokens = logprobs.content if hasattr(logprobs, 'content') and logprobs.content else []
        
        if not content_tokens:
            return {}
        
        # Get the first token (most recent)
        first_token = content_tokens[0]
        chosen_token = first_token.token
        chosen_logprob = first_token.logprob
        
        # Get top logprobs
        top_logprobs_list = first_token.top_logprobs if hasattr(first_token, 'top_logprobs') and first_token.top_logprobs else []
        
        # Start with chosen token
        tokens = [chosen_token]
        logprobs_list = [chosen_logprob]
        # Use hash of token string as synthetic ID
        token_ids = [hash(chosen_token) % (2**31)]  # Keep within int32 range
        
        # Add top logprobs
        for top_logprob in top_logprobs_list:
            tokens.append(top_logprob.token)
            logprobs_list.append(top_logprob.logprob)
            token_ids.append(hash(top_logprob.token) % (2**31))
        
        # Convert logprobs to probabilities
        probabilities = [OpenRouterClient.logprob_to_probability(lp) for lp in logprobs_list]
        
        return {
            "chosen_token": chosen_token,
            "chosen_logprob": chosen_logprob,
            "tokens": tokens,
            "logprobs": logprobs_list,
            "probabilities": probabilities,
            "token_ids": token_ids,
            "top_logprobs": top_logprobs_list
        }

# Global client instance
_client_instance: Optional[OpenRouterClient] = None

def get_openrouter_client() -> OpenRouterClient:
    """Get or create the global OpenRouter client instance."""
    global _client_instance
    if _client_instance is None:
        _client_instance = OpenRouterClient()
    return _client_instance

