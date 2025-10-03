# backend/api/generate_token_prob.py

from flask import Blueprint, request, jsonify
from transformers import GPT2Tokenizer, GPT2LMHeadModel
import torch

generate_token_prob_bp = Blueprint('generate_token_prob', __name__)

# Load the pre-trained GPT-2 model and tokenizer upon application start.
print("Loading tokenizer...")
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
print("Tokenizer loaded.")

print("Loading model...")
model = GPT2LMHeadModel.from_pretrained('gpt2')
print("Model loaded.")

print("Loading GPT-2 model...")
generator = pipeline('text-generation', model='gpt2')
print("Model loaded successfully!")


@generate_token_prob_bp.route('/generate_prob', methods=['POST'])
def generate_prob():
    # Retrieve the JSON data from the POST request.
    data = request.get_json()
    # Extract the 'prompt' value from the JSON data.
    prompt_text = data.get('prompt', '')
    if not prompt_text:
        return jsonify({'error': 'Prompt is required'}), 400

    # Convert the input text into token IDs for the model.
    encoded_input = tokenizer(prompt_text, return_tensors='pt')
    input_ids = encoded_input['input_ids']

    try:
        # Call the model's generate method to produce the next token.
        outputs = model.generate(
            input_ids,
            # Limit the generation to a single new token.
            max_new_tokens=1,
            # Ensure the output is a dictionary for easier access to scores.
            return_dict_in_generate=True,
            # This is required to get the prediction scores for all possible tokens.
            output_scores=True,
            
            # --- Generation Parameters ---
            # Activates sampling to choose the next token from a probability distribution.
            do_sample=True,
            # Controls randomness. Lower values make the output more predictable.
            temperature=0.7,
            # Limits sampling to the 50 most likely next tokens.
            top_k=50,
            # Applies a penalty to tokens that have already been used, reducing repetition.
            repetition_penalty=1.2
        )

        # Extract the logits (raw prediction scores) for the generated token.
        logits = outputs.scores[0]
        
        # Apply the softmax function to convert logits into a probability distribution.
        probabilities = torch.nn.functional.softmax(logits, dim=-1)
        
        # Get the 5 tokens with the highest probability and their corresponding scores.
        top_5_probs, top_5_indices = torch.topk(probabilities, 5)

        # Decode the integer token indices back into readable text strings.
        decoded_tokens = [tokenizer.decode(index) for index in top_5_indices.flatten().tolist()]
        # Flatten the probability tensor into a simple list for JSON serialization.
        probs_list = top_5_probs.flatten().tolist()
        
        # Prepare the data structure for the JSON response.
        response_data = {
            'probabilities': probs_list,
            'tokens': decoded_tokens
        }
        
        # Return the final data as a JSON response.
        return jsonify(response_data)
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to generate text'}), 500