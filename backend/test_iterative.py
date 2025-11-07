import requests

# Test the iterative_generation endpoint
url = "http://localhost:8000/lm/iterative_generation"
data = {
    "prompt": "Hello, how are",
    "model_name": "gpt2_completion"
}

response = requests.post(url, json=data)
print("Status Code:", response.status_code)
print("Response:", response.json())