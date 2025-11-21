from transformers import GPT2LMHeadModel, pipeline, AutoTokenizer, AutoModelForCausalLM, GPT2Tokenizer, PreTrainedTokenizerFast
from tokenizers import Tokenizer
from tokenizers.models import WordLevel
import torch
import re
import json
import os

# Create a custom character-level tokenizer for ChessGPT
def create_chessgpt_tokenizer():
    vocab_path = "src/model/vocab.json"
    with open(vocab_path, 'r') as f:
        vocab = json.load(f)
    
    # Create a simple character-level tokenizer
    tokenizer_obj = Tokenizer(WordLevel(vocab=vocab, unk_token=" "))
    
    # Wrap in PreTrainedTokenizerFast
    tokenizer = PreTrainedTokenizerFast(
        tokenizer_object=tokenizer_obj,
        bos_token=";",
        eos_token="#",
        pad_token=" ",
        unk_token=" "
    )
    return tokenizer

SUPPORTED_MODELS = {
    "GPT-2": {
        "tokenizer": AutoTokenizer.from_pretrained('gpt2'),
        "model": GPT2LMHeadModel.from_pretrained('gpt2'),
        "pipeline": pipeline('text-generation', model='gpt2', device=0 if torch.cuda.is_available() else -1) # Use GPU if available
    },
    "DistilGPT2": {
        "tokenizer": AutoTokenizer.from_pretrained('distilgpt2'),
        "model": GPT2LMHeadModel.from_pretrained('distilgpt2'),
        "pipeline": pipeline('text-generation', model='distilgpt2', device=0 if torch.cuda.is_available() else -1)
    },
    "Llama-3.2": {
        "tokenizer": AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-1B-Instruct"),
        "model": AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-1B-Instruct"),
        "pipeline": pipeline("text-generation", model="meta-llama/Llama-3.2-1B-Instruct")
    },
    "Chess-Llama": {
        # Chess-Llama: Llama model fine-tuned on chess games
        # Load from local directory
        "tokenizer": AutoTokenizer.from_pretrained("src/model/chessLlama", trust_remote_code=True),
        "model": AutoModelForCausalLM.from_pretrained("src/model/chessLlama", trust_remote_code=True),
        "pipeline": None  # We'll use model directly for chess tasks
    }
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

