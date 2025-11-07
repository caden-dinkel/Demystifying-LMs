from transformers import GPT2Tokenizer, GPT2LMHeadModel, pipeline, AutoTokenizer, AutoModelForCausalLM
import torch

# Define the models you want to support
SUPPORTED_MODELS = {
    "gpt2": {
        "tokenizer": AutoTokenizer.from_pretrained('gpt2'),
        "model": GPT2LMHeadModel.from_pretrained('gpt2'),
        "pipeline": pipeline('text-generation', model='gpt2', device=0 if torch.cuda.is_available() else -1) # Use GPU if available
    },
    "distilgpt2": {
        "tokenizer": AutoTokenizer.from_pretrained('distilgpt2'),
        "model": AutoModelForCausalLM.from_pretrained('distilgpt2'),
        "pipeline": pipeline('text-generation', model='distilgpt2', device=0 if torch.cuda.is_available() else -1)
    },
    "llama3.2_instruct": {
        "tokenizer": AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-1B-Instruct"),
        "model": AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-1B-Instruct"),
        "pipeline": pipeline("text-generation", model="meta-llama/Llama-3.2-1B-Instruct")
    },
    # ... add more models here
}