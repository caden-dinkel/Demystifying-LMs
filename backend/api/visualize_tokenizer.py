from flask import Blueprint, request, jsonify
from transformers import AutoTokenizer

# Create a Blueprint for the tokenizer visualizer
visualize_tokenizer_bp = Blueprint('visualize_tokenizer', __name__)

# Load the tokenizer for GPT-2 to match the generation model
print("Loading GPT-2 tokenizer...")
tokenizer = AutoTokenizer.from_pretrained('gpt2')
print("Tokenizer loaded successfully!")

@visualize_tokenizer_bp.route('/api/tokenize', methods=['POST'])
def tokenize_text():
    """
    Takes a JSON object with a 'text' key and returns its tokens.
    """
    data = request.get_json()
    text_to_tokenize = data.get('text', '')

    if not text_to_tokenize:
        return jsonify({'error': 'Text input is required'}), 400

    try:
        # Get the integer IDs for each token
        token_ids = tokenizer.encode(text_to_tokenize)
        
        # Convert the integer IDs back to their string representation
        # (e.g., 25924 -> 'demystifying')
        tokens = tokenizer.convert_ids_to_tokens(token_ids)

        # Combine the IDs and their string forms for a rich frontend display
        token_data = [{"id": tid, "text": tok} for tid, tok in zip(token_ids, tokens)]

        return jsonify(token_data)
        
    except Exception as e:
        print(f"An error occurred during tokenization: {e}")
        return jsonify({'error': 'Failed to tokenize text'}), 500