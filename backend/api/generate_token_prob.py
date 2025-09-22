# Import necessary libraries
from flask import Blueprint, Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, GPT2Tokenizer, GPT2LMHeadModel
import torch
import torch.nn.functional as F

generate_token_prob_bp = Blueprint('generate_token_prob', __name__)


print(f"loading tokenizer...")
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
print(f"tokenizer loaded.")

print(f"loading model...")
model = GPT2LMHeadModel.from_pretrained('gpt2')
print(f"model loaded.")


@generate_token_prob_bp.route('/generate_prob', methods=['POST'])
def generate_prob():
    data = request.get_json()
    prompt_text = data.get('prompt', '') # Safely get the prompt
    encoded_input = tokenizer(prompt_text, return_tensors='pt')
    try: #Generate top 5 mostly likely next tokens and their probability
        output = model(**encoded_input)
        logits = output.logits
        probabilities = torch.nn.functional.softmax(logits[:, -1, :], dim=-1)
        top_5_probs, top_5_indices = torch.topk(probabilities, 5)
        decoded_tokens = [tokenizer.decode(index) for index in top_5_indices.tolist()]
        probs_list = top_5_probs.tolist()
        response_data = {
            'probabilities': probs_list,
            'tokens': decoded_tokens
        }
        return jsonify(response_data)
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to generate text'}), 500
