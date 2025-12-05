import asyncio
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from typing import Literal, Optional, List, Dict, Any
from .lm_apis import LMInput, LMOutput, LMProbSpread, Token, StepData, IterativeGenerationResponse, SearchStrategy
from .openrouter_client import get_openrouter_client, OpenRouterClient

router = APIRouter(
    prefix="/lm/openrouter",
    tags=["OpenRouter LM APIs"]
)

@router.post("/generate_text")
async def generate_text(data: LMInput) -> LMOutput:
    """Generate text using OpenRouter API."""
    client = get_openrouter_client()
    openrouter_model = client.get_openrouter_model(data.model_name)
    
    print(f"📝 OpenRouter text generation requested using model: {openrouter_model}")
    
    try:
        messages = [{"role": "user", "content": data.prompt}]
        
        completion = client.chat_completion(
            model=openrouter_model,
            messages=messages,
            max_tokens=data.max_tokens if data.max_tokens else 100,
            temperature=data.temperature if data.temperature else 0.7
        )
        
        generated_text = completion.choices[0].message.content
        return LMOutput(token=generated_text)
    except Exception as e:
        print(f"Error in OpenRouter generate_text: {e}")
        raise HTTPException(status_code=500, detail=f"Issue with OpenRouter API: {e}")

@router.post("/token_probs")
async def token_probs(data: LMInput) -> LMProbSpread:
    """Get token probabilities using OpenRouter API."""
    client = get_openrouter_client()
    openrouter_model = client.get_openrouter_model(data.model_name)
    
    print(f"🔍 OpenRouter token probabilities requested using model: {openrouter_model}")
    
    try:
        messages = [{"role": "user", "content": data.prompt}]
        
        completion = client.chat_completion(
            model=openrouter_model,
            messages=messages,
            max_tokens=1,
            logprobs=True,
            top_logprobs=10
        )
        
        token_info = client.extract_token_info(completion)
        
        if not token_info:
            raise HTTPException(status_code=500, detail="No token information in response")
        
        # Get top 10 tokens (excluding the chosen token if it's already in the list)
        tokens = token_info["tokens"][:10]
        probabilities = token_info["probabilities"][:10]
        token_ids = token_info["token_ids"][:10]
        
        # Normalize probabilities
        total_prob = sum(probabilities)
        if total_prob > 0:
            probabilities = [p / total_prob for p in probabilities]
        
        # Round probabilities
        probabilities = [round(p, 3) for p in probabilities]
        
        return LMProbSpread(
            tokens=tokens,
            probabilities=probabilities,
            token_ids=token_ids
        )
    except Exception as e:
        print(f"Error in OpenRouter token_probs: {e}")
        raise HTTPException(status_code=500, detail=f"Issue with OpenRouter API: {e}")

@router.post("/tokenize_text")
async def tokenize_text(data: LMInput):
    """Tokenization is not supported via OpenRouter API."""
    raise HTTPException(
        status_code=501,
        detail="Tokenization is not supported via OpenRouter API. Please use the transformers backend (/lm/tokenize_text) for this functionality."
    )

@router.post("/iterative_generation")
async def iterative_generation(data: LMInput) -> IterativeGenerationResponse:
    """Generate text iteratively with step-by-step token probabilities."""
    client = get_openrouter_client()
    openrouter_model = client.get_openrouter_model(data.model_name)
    
    print(f"🔄 OpenRouter iterative generation requested using model: {openrouter_model}")
    print(f"📝 Prompt: '{data.prompt}'")
    print(f"🎯 Search strategy: {data.search_strategy}")
    
    if not data.prompt or data.prompt.strip() == "":
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    max_tokens = data.max_tokens if data.max_tokens else 20
    temperature = data.temperature if data.temperature else 0.7
    
    try:
        if data.search_strategy == "Beam":
            return await _iterative_generation_beam(
                client, openrouter_model, data.prompt, max_tokens, num_beams=5
            )
        elif data.search_strategy == "Sampling":
            return await _iterative_generation_sampling(
                client, openrouter_model, data.prompt, max_tokens, temperature
            )
        else:  # Greedy
            return await _iterative_generation_greedy(
                client, openrouter_model, data.prompt, max_tokens
            )
    except Exception as e:
        print(f"Error in OpenRouter iterative_generation: {e}")
        raise HTTPException(status_code=500, detail=f"Issue with OpenRouter API: {e}")

async def _iterative_generation_greedy(
    client: OpenRouterClient,
    model: str,
    prompt: str,
    max_tokens: int
) -> IterativeGenerationResponse:
    """Greedy search: always pick highest probability token."""
    generated_tokens = []
    steps_data = []
    current_context = prompt
    
    for step in range(max_tokens):
        messages = [{"role": "system", "content": "You are a helpful assistant. Complete the text."}, {"role": "user", "content": current_context}]
        
        completion = client.chat_completion(
            model=model,
            messages=messages,
            max_tokens=16,
            logprobs=True,
            top_logprobs=10,
            temperature=0  # Deterministic
        )
        print("messages: ", messages)
        print(f"Iterative generation completion: {completion}")
        
        token_info = client.extract_token_info(completion)
        
        if not token_info or not token_info.get("tokens"):
            break
        
        # Get chosen token (first in list, highest probability)
        chosen_token = token_info["tokens"][0]
        chosen_logprob = token_info["logprobs"][0]
        chosen_token_id = token_info["token_ids"][0]
        
        # Get top k tokens and probabilities
        top_k_tokens = token_info["tokens"][:10]
        top_k_probs = token_info["probabilities"][:10]
        top_k_token_ids = token_info["token_ids"][:10]
        
        # Normalize probabilities
        total_prob = sum(top_k_probs)
        if total_prob > 0:
            top_k_probs = [p / total_prob for p in top_k_probs]
        
        # Round probabilities
        top_k_probs = [round(p, 3) for p in top_k_probs]
        
        generated_tokens.append(chosen_token)
        # # Add a space to the chosen token
        # chosen_token = " " + chosen_token
        current_context += chosen_token

        
        steps_data.append(StepData(
            step=step + 1,
            top_k_tokens=top_k_tokens,
            top_k_probs=top_k_probs,
            top_k_token_ids=top_k_token_ids,
            chosen_token=chosen_token,
            chosen_token_id=chosen_token_id
        ))
    
    generated_text = "".join(generated_tokens)
    return IterativeGenerationResponse(
        generated_text=generated_text,
        steps=steps_data
    )

async def _iterative_generation_sampling(
    client: OpenRouterClient,
    model: str,
    prompt: str,
    max_tokens: int,
    temperature: float
) -> IterativeGenerationResponse:
    """Sampling search: use temperature for randomness."""
    generated_tokens = []
    steps_data = []
    current_context = prompt
    
    for step in range(max_tokens):
        messages = [{"role": "system", "content": "You are a helpful assistant. Complete the text."}, {"role": "user", "content": beam_context}]
        
        completion = client.chat_completion(
            model=model,
            messages=messages,
            max_tokens=1,
            logprobs=True,
            top_logprobs=10,
            temperature=temperature
        )
        
        token_info = client.extract_token_info(completion)
        
        if not token_info or not token_info.get("tokens"):
            break
        
        # Get chosen token (first in list, may not be highest probability due to sampling)
        chosen_token = token_info["tokens"][0]
        chosen_logprob = token_info["logprobs"][0]
        chosen_token_id = token_info["token_ids"][0]
        
        # Get top k tokens and probabilities
        top_k_tokens = token_info["tokens"][:10]
        top_k_probs = token_info["probabilities"][:10]
        top_k_token_ids = token_info["token_ids"][:10]
        
        # Normalize probabilities
        total_prob = sum(top_k_probs)
        if total_prob > 0:
            top_k_probs = [p / total_prob for p in top_k_probs]
        
        # Round probabilities
        top_k_probs = [round(p, 3) for p in top_k_probs]
        
        generated_tokens.append(chosen_token)
        current_context += chosen_token
        
        steps_data.append(StepData(
            step=step + 1,
            top_k_tokens=top_k_tokens,
            top_k_probs=top_k_probs,
            top_k_token_ids=top_k_token_ids,
            chosen_token=chosen_token,
            chosen_token_id=chosen_token_id
        ))
    
    generated_text = "".join(generated_tokens)
    return IterativeGenerationResponse(
        generated_text=generated_text,
        steps=steps_data
    )

async def _iterative_generation_beam(
    client: OpenRouterClient,
    model: str,
    prompt: str,
    max_tokens: int,
    num_beams: int = 5
) -> IterativeGenerationResponse:
    """Beam search: maintain multiple candidate sequences with parallel async calls."""
    # Initialize beams: each beam is (context, cumulative_logprob, tokens)
    beams = [(prompt, 0.0, [])]
    
    all_steps_data = []
    
    for step in range(max_tokens):
        # Create async tasks for all active beams
        tasks = []
        for beam_context, _, _ in beams:
            messages = [{"role": "system", "content": "You are a helpful assistant. Complete the text."}, {"role": "user", "content": beam_context}]
            task = client.chat_completion_async(
                model=model,
                messages=messages,
                max_tokens=1,
                logprobs=True,
                top_logprobs=10,
                temperature=0  # Deterministic for beam search
            )
            tasks.append(task)
        
        # Execute all API calls in parallel
        completions = await asyncio.gather(*tasks)
        
        # Expand each beam with top candidates
        candidates = []
        
        for i, completion in enumerate(completions):
            beam_context, beam_logprob, beam_tokens = beams[i]
            token_info = client.extract_token_info(completion)
            
            if not token_info or not token_info.get("tokens"):
                continue
            
            # Get top k candidates from this beam
            top_k_tokens = token_info["tokens"][:10]
            top_k_logprobs = token_info["logprobs"][:10]
            top_k_probs = token_info["probabilities"][:10]
            top_k_token_ids = token_info["token_ids"][:10]
            
            # Normalize probabilities
            total_prob = sum(top_k_probs)
            if total_prob > 0:
                top_k_probs = [p / total_prob for p in top_k_probs]
            
            # Round probabilities
            top_k_probs = [round(p, 3) for p in top_k_probs]
            
            # Store step data for the first beam (for visualization)
            if i == 0:
                chosen_token = top_k_tokens[0]
                chosen_token_id = top_k_token_ids[0]
                all_steps_data.append(StepData(
                    step=step + 1,
                    top_k_tokens=top_k_tokens,
                    top_k_probs=top_k_probs,
                    top_k_token_ids=top_k_token_ids,
                    chosen_token=chosen_token,
                    chosen_token_id=chosen_token_id
                ))
            
            # Expand beam with top candidates
            for j, (token, logprob) in enumerate(zip(top_k_tokens, top_k_logprobs)):
                new_context = beam_context + token
                new_logprob = beam_logprob + logprob
                new_tokens = beam_tokens + [token]
                candidates.append((new_context, new_logprob, new_tokens))
        
        # Keep top num_beams candidates based on cumulative logprob
        candidates.sort(key=lambda x: x[1], reverse=True)
        beams = candidates[:num_beams]
        
        if not beams:
            break
    
    # Get the best beam
    if not beams:
        generated_text = ""
        steps_data = []
    else:
        best_beam = beams[0]
        generated_text = "".join(best_beam[2])
        steps_data = all_steps_data
    
    return IterativeGenerationResponse(
        generated_text=generated_text,
        steps=steps_data
    )

