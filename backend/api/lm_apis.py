from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from transformers import pipeline, GPT2Tokenizer, GPT2LMHeadModel, AutoTokenizer 
import torch

class LMInOut(BaseModel):
    prompt: str


class LMProbSpread(BaseModel):
    tokens: list[str]
    probabilities: list[float]

class Token(BaseModel):
    value: str
    id: int

router = APIRouter(
    prefix="/lm",
    tags=["LM APIs"]
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
    input_ids = encoded_prompt['input_ids']
    print(f"{input_ids}")
    try: #Generate top 5 mostly likely next tokens and their probability

        #This outputs the final hidden state I believe
        output = model(input_ids, max_new_tokens=1, output_scores=True, temperature=0.5, repetition_penalty=1.2)
        logits = output.logits

        #Softmax on output logits produces the probability spread on entire vocab
        probabilities = torch.nn.functional.softmax(logits[:, -1, :], dim=-1)

        #Select top five probs
        top_k_probs, top_k_indices = torch.topk(probabilities, 10)
        decoded_tokens = [tokenizer.decode(index) for index in top_k_indices.tolist()[0]]
        probs_list = [round(prob, 3) for prob in top_k_probs.tolist()[0]]
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

@router.post("/tokenize_text_gpt")
async def tokenize_text(prompt: LMInOut):
    try:
        token_ids = tokenizer.encode(prompt.prompt)
        tokens = tokenizer.convert_ids_to_tokens(token_ids)
        result = [Token(value=val, id=tid) for val, tid in zip(tokens, token_ids)]
        print(f"{result}")
        return result
    except Exception as e:
        print(f"An error occurred during tokenization: {e}")
        raise HTTPException(status_code=500, detail="Error Tokenizing input text.")
    
