from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from transformers import pipeline, GPT2Tokenizer, GPT2LMHeadModel, AutoTokenizer 
import torch
from fastapi import HTTPException
from ..models import SUPPORTED_MODELS # Assuming models are in models.py

class LMInput(BaseModel):
    prompt: str
    model_name: str

class LMOutput(BaseModel):
    token: str

class LMProbSpread(BaseModel):
    tokens: list[str]
    probabilities: list[float]

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
    return [{"role": "question answerer", "content": prompt}]
    
    

@router.post("/token_probs")
async def token_probs(data: LMInput): # Use 'data' instead of 'prompt'
    # 1. Select LM components based on input
    tokenizer, model, _ = get_lm_components(data.model_name)
    
    encoded_prompt = tokenizer(data.prompt, return_tensors='pt')
    input_ids = encoded_prompt['input_ids']
    
    # ... rest of the logic remains the same, using the retrieved tokenizer/model
    try:
        # Pass the retrieved 'model' to the call
        output = model(input_ids, max_new_tokens=1, output_scores=True)
        logits = output.logits
        probabilities = torch.nn.functional.softmax(logits[:, -1, :], dim=-1)
        top_k_probs, top_k_indices = torch.topk(probabilities, 10)
        
        # Ensure you use the retrieved 'tokenizer'
        decoded_tokens = [tokenizer.decode(index) for index in top_k_indices.tolist()[0]]
        probs_list = [round(prob, 3) for prob in top_k_probs.tolist()[0]]
        
        response_data = LMProbSpread(tokens=decoded_tokens, probabilities=probs_list)
        return response_data
    except Exception as e:
        # ... error handling
        raise HTTPException(status_code=500, detail=f"Issue with Calling LM: {e}")

@router.post("/generate_text")
async def generate_text(data: LMInput):
    # 1. Select LM components based on input
    _, _, generator = get_lm_components(data.model_name)

    try:
        # Use the retrieved 'generator' pipeline
        output = generator(data.prompt, max_length=50, num_return_sequences=1)
        generated_text = output[0]['generated_text']
        response_data = LMOutput(token=generated_text) # Include model_name in response
        return response_data
    except Exception as e:
        # ... error handling
        raise HTTPException(status_code=500, detail=f"Issue with Calling LM: {e}")
    
@router.post("/tokenize_text")
async def tokenize_text(data: LMInput):
    tokenizer, _, _ = get_lm_components(data.model_name)
    try:
        token_ids = tokenizer.encode(data.prompt)
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
    chosen_token: str

class IterativeGenerationResponse(BaseModel):
    generated_text: str
    steps: list[StepData]

@router.post("/iterative_generation")
async def iterative_generation(data: LMInput) -> IterativeGenerationResponse:
    tokenizer, model, _ = get_lm_components(data.model_name)
    if data.model_name == "llama3_query":
        message = prepare_prompt(data.prompt)
        inputs = tokenizer.apply_chat_template(
            message,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        ).to(model.device)
    elif data.model_name == "gpt2_completion":
        inputs = tokenizer(
            data.prompt,
            return_tensors="pt",
        ).to(model.device)
    else:
        raise HTTPException(status_code=500, detail=f"Issue with LM/Functionality Combination")

    outputs = model.generate(**inputs, max_new_tokens=20, output_scores=True, return_dict_in_generate=True, do_sample=False)
    # outputs.scores is list of logits for each generated step, shape (batch, vocab) per step
    generated_tokens = outputs.sequences[0][inputs['input_ids'].shape[1]:]  # get only new tokens
    generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
    
    # Collect top k for each generated step
    steps_data = []
    for i, step_logits in enumerate(outputs.scores):
        probabilities = torch.softmax(step_logits.squeeze(0), dim=-1)
        top_k_probs, top_k_indices = torch.topk(probabilities, k=10)
        top_k_tokens = tokenizer.convert_ids_to_tokens(top_k_indices.tolist())
        chosen_token_id = generated_tokens[i].item()
        chosen_token = tokenizer.convert_ids_to_tokens(chosen_token_id)
        steps_data.append({
            "step": i + 1,
            "top_k_tokens": top_k_tokens,
            "top_k_probs": top_k_probs.tolist(),
            "chosen_token": chosen_token
        })
    
    return IterativeGenerationResponse(
        generated_text=generated_text,
        steps=[StepData(**step) for step in steps_data]
    )
