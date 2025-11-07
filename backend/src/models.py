from transformers import GPT2LMHeadModel, pipeline, AutoTokenizer, AutoModelForCausalLM
import torch

SUPPORTED_MODELS = {
    "gpt2_completion": {
        "tokenizer": AutoTokenizer.from_pretrained('gpt2'),
        "model": GPT2LMHeadModel.from_pretrained('gpt2'),
        "pipeline": pipeline('text-generation', model='gpt2', device=0 if torch.cuda.is_available() else -1) # Use GPU if available
    },
    "llama3_query": {
        "tokenizer": AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-1B-Instruct"),
        "model": AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-1B-Instruct"),
        "pipeline": pipeline("text-generation", model="meta-llama/Llama-3.2-1B-Instruct")
    }
}