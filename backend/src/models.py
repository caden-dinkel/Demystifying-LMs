from transformers import GPT2LMHeadModel, pipeline, AutoTokenizer, AutoModelForCausalLM
import torch
import re
import json

SUPPORTED_MODELS = {
    "GPT-2": {
        "tokenizer": AutoTokenizer.from_pretrained('gpt2'),
        "model": GPT2LMHeadModel.from_pretrained('gpt2'),
        "pipeline": pipeline('text-generation', model='gpt2', device=0 if torch.cuda.is_available() else -1) # Use GPU if available
    },
    #"Llama-3.2": {
    #    "tokenizer": AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-1B-Instruct"),
    #    "model": AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-1B-Instruct"),
    #    "pipeline": pipeline("text-generation", model="meta-llama/Llama-3.2-1B-Instruct")
    #}
}

def extract_json_from_response(text: str) -> dict | None:
    """Extracts JSON from LM response, handling markdown code blocks and extra text."""
    
    # Try to find JSON in code blocks first
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try to find raw JSON
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    
    # Try parsing the whole thing
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None

