#This file should be depreciated

# api/generate_text.py
from flask import Blueprint, request, jsonify
from transformers import pipeline

# Create a Blueprint for our API. The first argument is the Blueprint's name.
generate_text_bp = Blueprint('generate_text', __name__)

# Load the model inside the Blueprint module
print("Loading GPT-2 model...")
generator = pipeline('text-generation', model='gpt2')
print("Model loaded successfully!")

@generate_text_bp.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    prompt_text = data.get('prompt', '')

    if not prompt_text:
        return jsonify({'error': 'Prompt is required'}), 400

    print(f"Received prompt: {prompt_text}")

    try:
        output = generator(prompt_text, max_length=50, num_return_sequences=1)
        generated_text = output[0]['generated_text']
        print(f"Generated text: {generated_text}")
        return jsonify({'generated_text': generated_text})
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to generate text'}), 500