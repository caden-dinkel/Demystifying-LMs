from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
import json
from ..models import SUPPORTED_MODELS, extract_json_from_response

router = APIRouter(
    prefix="/planner",
    tags=["Planner APIs"]
)

# Tool Definitions
TOOLS = [
    {
        "name": "set_room_temperature",
        "description": "Set the target temperature for a specific room in the smart home",
        "parameters": {
            "type": "object",
            "properties": {
                "room_name": {
                    "type": "string",
                    "description": "Name of the room (e.g., 'living_room', 'bedroom', 'kitchen', 'bathroom')"
                },
                "temperature": {
                    "type": "number",
                    "description": "Target temperature in Fahrenheit (must be between 60 and 80)"
                }
            },
            "required": ["room_name", "temperature"]
        }
    }
]

class ToolCall(BaseModel):
    tool_name: str
    arguments: dict

class PlannerInput(BaseModel):
    prompt: str
    model_name: str
    current_state: dict  # { rooms: [...], people: [...] }

class PlannerOutput(BaseModel):
    reasoning: str
    tool_calls: list[ToolCall]
    complete: bool
    error: str | None = None


def build_planner_prompt(user_command: str, current_state: dict, tools: list[dict]) -> str:
    """Builds the prompt for the LM with tool definitions and current state."""
    
    # Format tools for the prompt
    tools_description = ""
    for tool in tools:
        tools_description += f"\n{tool['name']}: {tool['description']}\n"
        tools_description += f"  Parameters: {json.dumps(tool['parameters'], indent=2)}\n"
    
    # Format current state with all relevant information
    state_summary = f"Rooms (with current temperature and target):\n"
    for room in current_state.get("rooms", []):
        state_summary += f"  - {room['name']}: {room['currentTemp']}°F (target: {room['targetTemp']}°F)\n"
    
    state_summary += f"\nPeople (with location and temperature preferences):\n"
    for person in current_state.get("people", []):
        state_summary += f"  - {person['name']} in {person['location']}, prefers {person['preferredTemp']}°F\n"
    
    prompt = f"""You are a smart home assistant AI that controls temperature. You have complete information about the home state.

Available Tool:
{tools_description}

COMPLETE Current Home State (all information provided):
{state_summary}

You can see:
- Where each person is located
- Each person's preferred temperature
- Current temperature in each room
- Target temperature for each room

User Request: "{user_command}"

Think about what temperature adjustments would make people comfortable. Respond with ONLY valid JSON in this exact format:
{{
  "reasoning": "explain your thought process based on the state information provided above",
  "tool_calls": [
    {{"tool_name": "set_room_temperature", "arguments": {{"room_name": "room_name_here", "temperature": 70}}}}
  ],
  "complete": true
}}

Important:
- Use the exact room and person names from the current state
- Temperature must be between 60 and 80 degrees Fahrenheit
- For commands like "freeze [person]", set their current room to 60°F
- For comfortable settings, consider each person's preferred temperature
- Your response must be valid JSON only, nothing else

JSON Response:"""

    return prompt




@router.post("/execute")
async def execute_planner(data: PlannerInput) -> PlannerOutput:
    """
    Uses an LM to plan and generate tool calls for smart home control.
    
    The LM receives:
    1. Available tools and their parameters
    2. Current state of the home (rooms, people)
    3. User command
    
    Returns:
    - LM's reasoning
    - List of tool calls to execute
    - Whether the plan is complete
    """
    
    # Llama should be enforced by frontend
    try:
        # Get model components
        if data.model_name not in SUPPORTED_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported model: {data.model_name}"
            )
        
        tokenizer = SUPPORTED_MODELS[data.model_name]["tokenizer"]
        model = SUPPORTED_MODELS[data.model_name]["model"]
        
        print(f"🤖 Planner request for: '{data.prompt}' using {data.model_name}")
        
        # Build prompt with tools and state
        prompt = build_planner_prompt(data.prompt, data.current_state, TOOLS)
        
        # For Llama models, use chat template
        messages = [{"role": "user", "content": prompt}]
        inputs = tokenizer.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
        ).to(model.device)
        # No Need to handle other models for now
        # GPT-2 is only token prediction
        
        # Generate response
        outputs = model.generate(
            **inputs,
            max_new_tokens=500,
            temperature=0.1,  # Low temperature for more deterministic tool calling
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )
        
        # Decode response
        generated_tokens = outputs[0][inputs['input_ids'].shape[1]:]
        response_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
        
        print(f"📝 LM Response:\n{response_text}\n")
        
        # Extract JSON from response
        response_json = extract_json_from_response(response_text)
        
        if not response_json:
            return PlannerOutput(
                reasoning="Failed to parse LM response as JSON",
                tool_calls=[],
                complete=False,
                error=f"Could not extract valid JSON from response: {response_text[:200]}"
            )
        
        # Validate and structure the response
        reasoning = response_json.get("reasoning", "No reasoning provided")
        tool_calls_data = response_json.get("tool_calls", [])
        complete = response_json.get("complete", True)
        
        # Convert to ToolCall objects
        tool_calls = []
        for tc in tool_calls_data:
            if isinstance(tc, dict) and "tool_name" in tc and "arguments" in tc:
                tool_calls.append(ToolCall(
                    tool_name=tc["tool_name"],
                    arguments=tc["arguments"]
                ))
        
        print(f"✅ Parsed {len(tool_calls)} tool calls")
        for tc in tool_calls:
            print(f"   - {tc.tool_name}({tc.arguments})")
        
        return PlannerOutput(
            reasoning=reasoning,
            tool_calls=tool_calls,
            complete=complete,
            error=None
        )
        
    except Exception as e:
        print(f"❌ Error in planner: {str(e)}")
        return PlannerOutput(
            reasoning=f"Error: {str(e)}",
            tool_calls=[],
            complete=False,
            error=str(e)
        )


@router.get("/tools")
async def get_tools():
    """Returns the list of available tools for the smart home."""
    return {"tools": TOOLS}
