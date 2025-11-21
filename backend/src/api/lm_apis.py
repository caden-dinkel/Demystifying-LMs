from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from transformers import pipeline, GPT2Tokenizer, GPT2LMHeadModel, AutoTokenizer 
import torch
from fastapi import HTTPException
from typing import Literal, Optional
from ..models import SUPPORTED_MODELS # Assuming models are in models.py

# Define search strategies
SearchStrategy = Literal["Greedy", "Beam", "Sampling", "Assisted"]

class LMInput(BaseModel):
    prompt: str
    model_name: str
    search_strategy: Optional[SearchStrategy] = "Greedy"  # Default to Greedy
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 100

class LMOutput(BaseModel):
    token: str

class LMProbSpread(BaseModel):
    tokens: list[str]
    probabilities: list[float]
    token_ids: list[int]

class Token(BaseModel):
    value: str
    id: int

router = APIRouter(
    prefix="/lm",
    tags=["LM APIs"]
)


def get_lm_components(model_name: str):
    """Retrieves tokenizer, model, and pipeline for a given model_name."""
    if model_name not in SUPPORTED_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model: {model_name}. Supported models are: {list(SUPPORTED_MODELS.keys())}"
        )
    return (
        SUPPORTED_MODELS[model_name]["tokenizer"],
        SUPPORTED_MODELS[model_name]["model"],
        SUPPORTED_MODELS[model_name]["pipeline"]
    )

def prepare_prompt(prompt: str):
    # Wraps prompt in a message for llama queries
    return [{"role": "user", "content": prompt}]
    
    

@router.post("/token_probs")
async def token_probs(data: LMInput): # Use 'data' instead of 'prompt'
    # 1. Select LM components based on input
    tokenizer, model, _ = get_lm_components(data.model_name)
    print(f"🔍 Token probabilities requested using model: {model.__class__.__name__} ({data.model_name})")
    
    # For token prediction, use raw prompt without chat template
    # The chat template adds special tokens that interfere with token-by-token prediction
    if data.model_name == "Llama-3.2":
        encoded_prompt = tokenizer(data.prompt, return_tensors='pt')
    elif data.model_name == "GPT-2":
        encoded_prompt = tokenizer(data.prompt, return_tensors='pt')
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {data.model_name}. Supported models: GPT-2, Llama-3.2")
    
    input_ids = encoded_prompt['input_ids']
    
    # ... rest of the logic remains the same, using the retrieved tokenizer/model
    try:
        # Pass the retrieved 'model' to the call
        output = model(input_ids=input_ids, output_scores=True)
        logits = output.logits
        probabilities = torch.nn.functional.softmax(logits[:, -1, :], dim=-1)
        top_k_probs, top_k_indices = torch.topk(probabilities, 10)
        
        # Get token IDs as a list
        token_ids_list = top_k_indices.tolist()[0]
        
        # Decode each token individually to avoid special characters
        decoded_tokens = [tokenizer.decode([token_id], skip_special_tokens=False).replace('Ġ', ' ') for token_id in token_ids_list]
        probs_list = [round(prob, 3) for prob in top_k_probs.tolist()[0]]
        
        response_data = LMProbSpread(tokens=decoded_tokens, probabilities=probs_list, token_ids=token_ids_list)
        return response_data
    except Exception as e:
        # ... error handling
        raise HTTPException(status_code=500, detail=f"Issue with Calling LM: {e}")

@router.post("/generate_text")
async def generate_text(data: LMInput):
    # 1. Select LM components based on input
    tokenizer, _, generator = get_lm_components(data.model_name)
    print(f"📝 Text generation requested using model: {generator.model.__class__.__name__} ({data.model_name})")

    # Prepare prompt based on model
    if data.model_name == "Llama-3.2":
        message = prepare_prompt(data.prompt)
        prompt = tokenizer.apply_chat_template(
            message,
            add_generation_prompt=True,
            tokenize=False,
        )
    elif data.model_name == "GPT-2":
        prompt = data.prompt
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {data.model_name}. Supported models: GPT-2, Llama-3.2")

    try:
        # Use the retrieved 'generator' pipeline
        output = generator(prompt, max_length=50, num_return_sequences=1)
        generated_text = output[0]['generated_text']
        response_data = LMOutput(token=generated_text) # Include model_name in response
        return response_data
    except Exception as e:
        # ... error handling
        raise HTTPException(status_code=500, detail=f"Issue with Calling LM: {e}")
    
@router.post("/tokenize_text")
async def tokenize_text(data: LMInput):
    tokenizer, _, _ = get_lm_components(data.model_name)
    print(f"🔤 Tokenization requested using model: {tokenizer.__class__.__name__} ({data.model_name})")
    
    # For tokenization, use raw text to show actual tokens without chat formatting
    text_to_tokenize = data.prompt
    
    try:
        token_ids = tokenizer.encode(text_to_tokenize)
        tokens = tokenizer.convert_ids_to_tokens(token_ids)
        result = [Token(value=val, id=tid) for val, tid in zip(tokens, token_ids)]
        print(f"{result}")
        return result
    except Exception as e:
        print(f"An error occurred during tokenization: {e}")
        raise HTTPException(status_code=500, detail="Error Tokenizing input text.")
    
class StepData(BaseModel):
    step: int
    top_k_tokens: list[str]
    top_k_probs: list[float]
    top_k_token_ids: list[int]
    chosen_token: str
    chosen_token_id: int

class IterativeGenerationResponse(BaseModel):
    generated_text: str
    steps: list[StepData]

@router.post("/iterative_generation")
async def iterative_generation(data: LMInput) -> IterativeGenerationResponse:
    tokenizer, model, _ = get_lm_components(data.model_name)
    print(f"🔄 Iterative generation requested using model: {model.__class__.__name__} ({data.model_name})")
    
    # Validate that prompt is not empty
    if not data.prompt or data.prompt.strip() == "":
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    print(f"📝 Prompt: '{data.prompt}'")
    
    # For token-by-token generation, use raw prompt without chat template
    # The chat template is designed for full conversations, not token prediction
    if data.model_name == "Llama-3.2":
        inputs = tokenizer(
            data.prompt,
            return_tensors="pt",
        ).to(model.device)
    elif data.model_name == "GPT-2":
        inputs = tokenizer(
            data.prompt,
            return_tensors="pt",
        ).to(model.device)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {data.model_name}. Supported models: GPT-2, Llama-3.2")

    # Configure generation based on search strategy
    gen_kwargs = {
        "max_new_tokens": data.max_tokens if data.max_tokens else 20,
        "output_scores": True,
        "return_dict_in_generate": True,
    }
    
    if data.search_strategy == "Greedy":
        gen_kwargs["do_sample"] = False
    elif data.search_strategy == "Beam":
        gen_kwargs["num_beams"] = 5
        gen_kwargs["do_sample"] = False
    elif data.search_strategy == "Sampling":
        gen_kwargs["do_sample"] = True
        gen_kwargs["temperature"] = data.temperature if data.temperature else 0.7
        gen_kwargs["top_p"] = 0.9
    elif data.search_strategy == "Assisted":
        # Assisted decoding - use DistilGPT2 as the assistant model for speculative decoding
        # This allows the smaller model to propose tokens that the larger model verifies
        assistant_model = SUPPORTED_MODELS["DistilGPT2"]["model"]
        gen_kwargs["assistant_model"] = assistant_model
        gen_kwargs["tokenizer"] = tokenizer
        gen_kwargs["assistant_tokenizer"] = SUPPORTED_MODELS["DistilGPT2"]["tokenizer"]
        gen_kwargs["do_sample"] = False
    
    print(f"🎯 Using {data.search_strategy} search with params: {gen_kwargs}")
    
    outputs = model.generate(**inputs, **gen_kwargs)
    # outputs.scores is list of logits for each generated step, shape (batch, vocab) per step
    generated_tokens = outputs.sequences[0][inputs['input_ids'].shape[1]:]  # get only new tokens
    generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
    
    # Collect top k for each generated step
    steps_data = []
    for i, step_logits in enumerate(outputs.scores):
        # Handle beam search: take the first beam's logits
        # step_logits shape is (num_beams, vocab_size) for beam search
        if step_logits.dim() > 1:
            step_logits = step_logits[0]  # Take first beam
        
        probabilities = torch.softmax(step_logits, dim=-1)
        
        # Get chosen token info first
        chosen_token_id = generated_tokens[i].item()
        chosen_token_prob = probabilities[chosen_token_id].item()
        chosen_token = tokenizer.decode(chosen_token_id, skip_special_tokens=False).replace('Ġ', ' ')
        
        # Get top k probabilities
        top_k_probs, top_k_indices = torch.topk(probabilities, k=10)
        
        # Convert to Python lists (not nested tensors)
        top_k_token_ids = top_k_indices.cpu().tolist()
        top_k_probs_list = top_k_probs.cpu().tolist()
        
        # Ensure they are simple lists of 10 elements
        if isinstance(top_k_token_ids[0], list):
            top_k_token_ids = top_k_token_ids[0]
        if isinstance(top_k_probs_list[0], list):
            top_k_probs_list = top_k_probs_list[0]
        
        # Check if chosen token is in top k
        if chosen_token_id not in top_k_token_ids:
            # Add chosen token to the list, remove the lowest probability token
            top_k_token_ids[-1] = chosen_token_id
            top_k_probs_list[-1] = chosen_token_prob
            
            # Re-sort by probability descending
            sorted_pairs = sorted(zip(top_k_probs_list, top_k_token_ids), reverse=True)
            top_k_probs_list, top_k_token_ids = zip(*sorted_pairs)
            top_k_probs_list = list(top_k_probs_list)
            top_k_token_ids = list(top_k_token_ids)
        
        # Decode tokens cleanly without special characters
        top_k_tokens = [tokenizer.decode(token_id, skip_special_tokens=False).replace('Ġ', ' ') for token_id in top_k_token_ids]
        
        steps_data.append({
            "step": i + 1,
            "top_k_tokens": top_k_tokens,
            "top_k_probs": top_k_probs_list,
            "top_k_token_ids": top_k_token_ids,
            "chosen_token": chosen_token,
            "chosen_token_id": chosen_token_id
        })
    
    return IterativeGenerationResponse(
        generated_text=generated_text,
        steps=steps_data
    )
