from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from transformers import pipeline, GPT2Tokenizer, GPT2LMHeadModel, AutoTokenizer
import torch
from fastapi import HTTPException
from typing import Literal, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import threading
from ..models import SUPPORTED_MODELS

# Thread pool for inference tasks
_executor = ThreadPoolExecutor(max_workers=4)

# Lock to prevent race conditions during PyTorch inference
_model_lock = threading.Lock()

# Timeout in seconds before returning a 503
INFERENCE_TIMEOUT = 20.0

# Helper to run blocking calls off the event loop with timeout
async def run_in_thread(fn, *args):
    loop = asyncio.get_event_loop()
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(_executor, fn, *args),
            timeout=INFERENCE_TIMEOUT
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=503,
            detail=f"Inference timeout after {INFERENCE_TIMEOUT}s, server is under load. Please try again."
        )

# Define search strategies
SearchStrategy = Literal["Greedy", "Beam", "Sampling", "Assisted"]

class LMInput(BaseModel):
    prompt: str
    model_name: str
    search_strategy: Optional[SearchStrategy] = "Greedy"
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
    return [{"role": "user", "content": prompt}]


# --- Synchronous inference functions ---

def _token_probs_sync(data: LMInput):
    tokenizer, model, _ = get_lm_components(data.model_name)
    print(f"Token probabilities requested using model: {model.__class__.__name__} ({data.model_name})")

    if data.model_name in ("GPT-2", "Llama-3.2"):
        encoded_prompt = tokenizer(data.prompt, return_tensors='pt')
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {data.model_name}. Supported models: GPT-2, Llama-3.2")

    input_ids = encoded_prompt['input_ids']

    with _model_lock:
        output = model(input_ids=input_ids, output_scores=True)

    logits = output.logits
    probabilities = torch.nn.functional.softmax(logits[:, -1, :], dim=-1)
    top_k_probs, top_k_indices = torch.topk(probabilities, 10)
    token_ids_list = top_k_indices.tolist()[0]
    decoded_tokens = [
        tokenizer.decode([tid], skip_special_tokens=False).replace('Ġ', ' ')
        for tid in token_ids_list
    ]
    probs_list = [round(p, 3) for p in top_k_probs.tolist()[0]]
    return LMProbSpread(
        tokens=decoded_tokens,
        probabilities=probs_list,
        token_ids=token_ids_list
    )


def _generate_text_sync(data: LMInput):
    tokenizer, _, generator = get_lm_components(data.model_name)
    print(f"Text generation requested using model: {generator.model.__class__.__name__} ({data.model_name})")

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

    with _model_lock:
        output = generator(prompt, max_length=50, num_return_sequences=1)

    generated_text = output[0]['generated_text']
    return LMOutput(token=generated_text)


def _tokenize_sync(data: LMInput):
    tokenizer, _, _ = get_lm_components(data.model_name)
    print(f"Tokenization requested using model: {tokenizer.__class__.__name__} ({data.model_name})")
    token_ids = tokenizer.encode(data.prompt)
    tokens = tokenizer.convert_ids_to_tokens(token_ids)
    result = [Token(value=val, id=tid) for val, tid in zip(tokens, token_ids)]
    print(f"{result}")
    return result


def _iterative_generation_sync(data: LMInput):
    tokenizer, model, _ = get_lm_components(data.model_name)
    print(f"Iterative generation requested using model: {model.__class__.__name__} ({data.model_name})")

    if not data.prompt or data.prompt.strip() == "":
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    print(f"Prompt: '{data.prompt}'")

    if data.model_name in ("GPT-2", "Llama-3.2"):
        inputs = tokenizer(
            data.prompt,
            return_tensors="pt",
        ).to(model.device)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {data.model_name}. Supported models: GPT-2, Llama-3.2")

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
        gen_kwargs["do_sample"] = False

    print(f"Using {data.search_strategy} search with params: {gen_kwargs}")

    with _model_lock:
        outputs = model.generate(**inputs, **gen_kwargs)

    generated_tokens = outputs.sequences[0][inputs['input_ids'].shape[1]:]
    generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)

    steps_data = []
    for i, step_logits in enumerate(outputs.scores):
        if step_logits.dim() > 1:
            step_logits = step_logits[0]

        probabilities = torch.softmax(step_logits, dim=-1)

        chosen_token_id = generated_tokens[i].item()
        chosen_token_prob = probabilities[chosen_token_id].item()
        chosen_token = tokenizer.decode(chosen_token_id, skip_special_tokens=False).replace('Ġ', ' ')

        top_k_probs, top_k_indices = torch.topk(probabilities, k=10)
        top_k_token_ids = top_k_indices.cpu().tolist()
        top_k_probs_list = top_k_probs.cpu().tolist()

        if isinstance(top_k_token_ids[0], list):
            top_k_token_ids = top_k_token_ids[0]
        if isinstance(top_k_probs_list[0], list):
            top_k_probs_list = top_k_probs_list[0]

        if chosen_token_id not in top_k_token_ids:
            top_k_token_ids[-1] = chosen_token_id
            top_k_probs_list[-1] = chosen_token_prob
            sorted_pairs = sorted(zip(top_k_probs_list, top_k_token_ids), reverse=True)
            top_k_probs_list, top_k_token_ids = zip(*sorted_pairs)
            top_k_probs_list = list(top_k_probs_list)
            top_k_token_ids = list(top_k_token_ids)

        top_k_tokens = [
            tokenizer.decode(tid, skip_special_tokens=False).replace('Ġ', ' ')
            for tid in top_k_token_ids
        ]

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


# --- Async route handlers ---

@router.post("/token_probs")
async def token_probs(data: LMInput):
    try:
        return await run_in_thread(_token_probs_sync, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Issue with Calling LM: {e}")


@router.post("/generate_text")
async def generate_text(data: LMInput):
    try:
        return await run_in_thread(_generate_text_sync, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Issue with Calling LM: {e}")


@router.post("/tokenize_text")
async def tokenize_text(data: LMInput):
    try:
        return await run_in_thread(_tokenize_sync, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error Tokenizing input text.")


@router.post("/iterative_generation")
async def iterative_generation(data: LMInput) -> IterativeGenerationResponse:
    try:
        return await run_in_thread(_iterative_generation_sync, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Issue with iterative generation: {e}")