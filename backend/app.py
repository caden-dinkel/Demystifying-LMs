#from flask import Flask
#from flask_cors import CORS
#from api.generate_text import generate_text_bp
#from api.generate_token_prob import generate_token_prob_bp
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import lm_apis

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lm_apis.router)






'''
# Initialize the Flask application
app = Flask(__name__)
CORS(app)

# Register the Blueprint. This adds all routes from generator_bp to the app.
app.register_blueprint(generate_text_bp)
app.register_blueprint(generate_token_prob_bp)

# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
'''