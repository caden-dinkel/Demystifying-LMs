# Import necessary libraries
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline

# Initialize the Flask application
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) to allow the frontend to access the server
CORS(app)

# Load the GPT-2 model for text generation using the Hugging Face pipeline.
# This makes using the model very straightforward.
print("Loading GPT-2 model...")
generator = pipeline('text-generation', model='gpt2')
print("Model loaded successfully!")

# Define an API endpoint for generating text
@app.route('/generate', methods=['POST'])
def generate():
    # Get the JSON data sent from the frontend
    data = request.get_json()
    prompt_text = data.get('prompt', '') # Safely get the prompt

    if not prompt_text:
        return jsonify({'error': 'Prompt is required'}), 400

    print(f"Received prompt: {prompt_text}")

    # Use the model to generate text based on the prompt
    # max_length defines the total length of the output (prompt + new text)
    # num_return_sequences is how many different completions to generate.
    try:
        output = generator(prompt_text, max_length=50, num_return_sequences=1)
        generated_text = output[0]['generated_text']
        print(f"Generated text: {generated_text}")
        return jsonify({'generated_text': generated_text})
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to generate text'}), 500

# Run the Flask app
if __name__ == '__main__':
    # Running on port 5000. debug=True allows for automatic reloading on code changes.
    app.run(host='0.0.0.0', port=5000, debug=True)