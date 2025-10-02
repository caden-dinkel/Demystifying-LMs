#Replacement API for generate_token_prob.py

from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from transformers import pipeline, GPT2Tokenizer, GPT2LMHeadModel
import torch

class LMInOut(BaseModel):
    prompt: str

    #selected_LM: str

class LMProbSpread(BaseModel):
    tokens: list[str]
    probabilities: list[float]

router = APIRouter(
    prefix="/lm",
    #tags=["LM APIs"]
)

#Would like to move this section at some point and include the selected LM in the request
print(f"loading tokenizer...")
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
print(f"tokenizer loaded.")

print(f"loading model...")
model = GPT2LMHeadModel.from_pretrained('gpt2')
print(f"model loaded.")

print("Loading GPT-2 model...")
generator = pipeline('text-generation', model='gpt2')
print("Model loaded successfully!")

@router.post("/token_probs")
async def token_probs(prompt: LMInOut):
    encoded_prompt = tokenizer(prompt.prompt, return_tensors='pt')
    try: #Generate top 5 mostly likely next tokens and their probability

        #This outputs the final hidden state I believe
        output = model(**encoded_prompt)
        logits = output.logits

        #Softmax on output logits produces the probability spread on entire vocab
        probabilities = torch.nn.functional.softmax(logits[:, -1, :], dim=-1)

        #Select top five probs
        top_5_probs, top_5_indices = torch.topk(probabilities, 5)
        decoded_tokens = [tokenizer.decode(index) for index in top_5_indices.tolist()[0]]
        probs_list = [round(prob, 3) for prob in top_5_probs.tolist()[0]]
        print(f"{decoded_tokens}")
        #Return from fastAPI as a Pydantic Model
        response_data = LMProbSpread(tokens=decoded_tokens, probabilities=probs_list)
        return (response_data)
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail="Issue with Calling LM")

@router.post("/generate_text")
async def generate_text(prompt: LMInOut):
    try:
        output = generator(prompt.prompt, max_length=50, num_return_sequences=1)
        generated_text = output[0]['generated_text']
        resonse_data = LMInOut(prompt=generated_text)
        return resonse_data
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail="Issue with Calling LM")
