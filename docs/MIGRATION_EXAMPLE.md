"""
BACKEND MIGRATION EXAMPLE
Shows how to extend your backend to support new config fields

This is a reference - don't implement until ready!
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException

# ============================================
# STEP 1: Extend Your Pydantic Models
# ============================================

class LMInputExtended(BaseModel):
    """Extended input model with new configuration options"""
    prompt: str
    model_name: str
    
    # New optional fields (backend ignores if not provided)
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=100, ge=1, le=2048)
    search_strategy: Optional[Literal["Greedy", "Beam", "Sampling", "Assisted", "User"]] = "Greedy"
    
    class Config:
        # Allows frontend to send extra fields that backend doesn't know about yet
        extra = "ignore"


# ============================================
# STEP 2: Update Your Endpoint (Minimal Change)
# ============================================

# BEFORE:
# @router.post("/token_probs")
# async def token_probs(data: LMInput):
#     tokenizer, model, _ = get_lm_components(data.model_name)
#     ...

# AFTER (Backward compatible!):
@router.post("/token_probs")
async def token_probs(data: LMInputExtended):  # <-- Just change the type
    tokenizer, model, _ = get_lm_components(data.model_name)
    
    print(f"🔍 Token probs with temperature={data.temperature}, max_tokens={data.max_tokens}")
    
    # Use the config in your model call:
    output = model(
        input_ids, 
        max_new_tokens=data.max_tokens,
        temperature=data.temperature,
        do_sample=(data.search_strategy != "greedy"),
        top_k=data.top_k if data.search_strategy == "top_k" else None,
        top_p=data.top_p if data.search_strategy == "top_p" else None,
        output_scores=True
    )
    # ... rest of your logic


# ============================================
# STEP 3: For Nomad/vLLM Migration
# ============================================

# Create a client that routes to different services:

class NomadModelRouter:
    """Routes requests to different vLLM servers via Nomad"""
    
    MODEL_ENDPOINTS = {
        "gpt2": "http://nomad-service.consul:8001/v1/completions",
        "llama": "http://nomad-service.consul:8002/v1/completions",
    }
    
    async def route_request(self, data: LMInputExtended):
        endpoint = self.MODEL_ENDPOINTS.get(data.model_name)
        if not endpoint:
            raise HTTPException(404, f"Model {data.model_name} not found")
        
        # Convert to OpenAI-compatible format
        openai_request = {
            "model": data.model_name,
            "prompt": data.prompt,
            "temperature": data.temperature,
            "max_tokens": data.max_tokens,
            "top_k": data.top_k,
            "top_p": data.top_p,
        }
        
        # Forward to vLLM server
        response = await http_client.post(endpoint, json=openai_request)
        return response.json()


# ============================================
# BENEFITS OF THIS APPROACH
# ============================================

"""
1. BACKWARD COMPATIBLE
   - Old frontend code (without new fields) continues to work
   - New fields are optional with sensible defaults

2. FORWARD COMPATIBLE  
   - Frontend can send new fields before backend uses them
   - Backend ignores unknown fields (extra="ignore")

3. EASY MIGRATION TO NOMAD
   - Replace model loading with HTTP calls to vLLM
   - Keep the same API interface
   - Just change the implementation inside endpoints

4. MINIMAL CHANGES NEEDED
   - Frontend: Just add optional config parameter
   - Backend: Change LMInput -> LMInputExtended
   - No breaking changes to existing code

5. GRADUAL ROLLOUT
   - Add fields one at a time as needed
   - Test each addition independently
   - Team member can migrate to Nomad without touching API layer
"""
