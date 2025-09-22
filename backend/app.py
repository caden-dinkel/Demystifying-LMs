# app.py
from flask import Flask
from flask_cors import CORS
from api.generate_text import generate_text_bp
from api.generate_token_prob import generate_token_prob_bp

# Initialize the Flask application
app = Flask(__name__)
CORS(app)

# Register the Blueprint. This adds all routes from generator_bp to the app.
app.register_blueprint(generate_text_bp)
app.register_blueprint(generate_token_prob_bp)

# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)