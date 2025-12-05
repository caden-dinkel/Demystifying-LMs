# Smart Home Planner - Testing & Usage Guide

## Quick Start

### 1. Start the Backend

```bash
cd backend
source venv/bin/activate  # or activate your virtual environment
uvicorn app:app --reload --port 8000
```

The backend should be running at `http://localhost:8000`

### 2. Start the Frontend

```bash
cd react-frontend
npm run dev
```

The frontend should be running at `http://localhost:3000`

### 3. Navigate to the Demo

Open your browser and go to:

```
http://localhost:3000/lms_work/smart_home_planner
```

## Features

### 🏠 Interactive Smart Home Visualization

- **4 Rooms**: Living room, Kitchen, Bedroom, Bathroom
- **2 People**: Alice (prefers 70°F) and Bob (prefers 68°F)
- **Real-time Updates**: Watch temperature changes animate smoothly
- **Visual Indicators**:
  - Temperature: Blue (cold) → White (neutral) → Red (hot)
  - People: Green (comfortable) / Red (uncomfortable)
  - Lights: Yellow glow when on
  - HVAC: Shows "HEATING" or "COOLING" when adjusting

### 🤖 LM-Powered Planning

The language model (Llama 3.2) analyzes your command and:

1. **Reasons** about what needs to be done
2. **Selects** appropriate tools to use
3. **Generates** a sequence of tool calls
4. **Executes** them step-by-step

### 🔧 Available Tools

1. **set_room_temperature** - Adjust room temperature (60-80°F)
2. **set_room_light** - Turn lights on/off
3. **get_person_location** - Find where someone is
4. **get_room_status** - Query room state

## Example Commands

### Basic Commands

```
"Set living room to 72 degrees"
```

- LM will set the living room temperature to 72°F
- Watch the temperature animate from current to target
- HVAC indicator shows "HEATING" or "COOLING"

```
"Turn off all lights"
```

- LM will call set_room_light for each room with state=false
- Yellow light indicators will disappear

### Person-Based Commands

```
"Freeze Alice"
```

- LM finds Alice's location (bedroom)
- Sets bedroom temperature to 60°F (freezing!)
- Alice's indicator turns red (uncomfortable)

```
"Make Bob comfortable"
```

- LM finds Bob's location
- Checks Bob's preferred temperature (68°F)
- Adjusts room to match preference
- Bob's indicator turns green

### Complex Scenarios

```
"Prepare the living room for a party"
```

- LM interprets "party" as needing lights on and comfortable temperature
- Turns on living room lights
- Sets temperature to 72°F (comfortable for groups)

```
"What temperature is the kitchen?"
```

- LM uses get_room_status tool
- Returns current temperature and other info
- Shows result in tool call display

### Multi-Step Commands

```
"Make everyone comfortable"
```

- LM gets location of Alice and Bob
- Checks each person's preferred temperature
- Adjusts both rooms accordingly

## Expected LM Behavior

### Example 1: "Freeze Alice"

**LM Reasoning:**

```
"To freeze Alice, I need to find her location and set
the temperature very low. First, I'll get her location,
then set that room to 60 degrees Fahrenheit."
```

**Tool Calls:**

```json
[
  {
    "tool_name": "get_person_location",
    "arguments": { "person_name": "Alice" }
  },
  {
    "tool_name": "set_room_temperature",
    "arguments": { "room_name": "bedroom", "temperature": 60 }
  }
]
```

### Example 2: "Prepare living room for party"

**LM Reasoning:**

```
"For a party, the living room should have lights on
and a comfortable temperature around 72 degrees."
```

**Tool Calls:**

```json
[
  {
    "tool_name": "set_room_light",
    "arguments": { "room_name": "living_room", "state": true }
  },
  {
    "tool_name": "set_room_temperature",
    "arguments": { "room_name": "living_room", "temperature": 72 }
  }
]
```

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError: No module named 'src'`

```bash
# Make sure you're in the backend directory
cd backend
# Check that src/api/planner_apis.py exists
```

**Problem**: Model not loading

```bash
# Check that Llama-3.2 is properly loaded in src/models.py
# Backend prints model loading messages on startup
```

**Problem**: CORS errors

```bash
# Ensure frontend is running on port 3000
# Check app.py has correct CORS origins
```

### Frontend Issues

**Problem**: Page not found

```bash
# Make sure you created the file at:
# react-frontend/src/app/lms_work/smart_home_planner/page.tsx
```

**Problem**: API calls failing

```bash
# Check that API_BASE_URL in config.ts is correct
# Default should be http://localhost:8000/
```

**Problem**: LM takes a long time

```
# This is normal! LM generation can take 10-30 seconds
# Watch the terminal for progress logs
```

### LM Response Issues

**Problem**: LM doesn't return valid JSON

- Backend has fallback JSON extraction from markdown
- Check backend logs for the raw LM response
- Adjust prompt temperature (currently 0.1 for deterministic)

**Problem**: LM suggests invalid room names

- Tool definitions include room name constraints
- LM should use exact names from current state
- Check that prompt includes current room list

**Problem**: Tool calls don't execute

- Check browser console for errors
- Verify tool_name matches exactly (case-sensitive)
- Check that arguments have required fields

## API Testing with curl

Test the backend directly:

```bash
# Test planner endpoint
curl -X POST http://localhost:8000/planner/execute \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Freeze Alice",
    "model_name": "Llama-3.2",
    "current_state": {
      "rooms": [
        {
          "id": "bedroom",
          "name": "bedroom",
          "currentTemp": 72,
          "targetTemp": 72,
          "lightOn": false,
          "hvacMode": "off"
        }
      ],
      "people": [
        {
          "name": "Alice",
          "location": "bedroom",
          "preferredTemp": 70
        }
      ],
      "history": []
    }
  }'

# Get available tools
curl http://localhost:8000/planner/tools
```

## Performance Notes

- **LM Generation**: 10-30 seconds (varies by command complexity)
- **Temperature Animation**: ~1 second per room adjustment
- **Tool Call Delay**: 500ms between each tool for visualization
- **Total Time**: Depends on number of tools called

## Customization Ideas

### Add More Rooms

Edit `INITIAL_ROOMS` in `page.tsx`:

```typescript
{
  id: "garage",
  name: "garage",
  bounds: { leftX: 800, topY: 50, rightX: 950, bottomY: 300 },
  currentTemp: 65,
  targetTemp: 65,
  lightOn: false,
  hvacMode: "off",
}
```

### Add More People

Edit `INITIAL_PEOPLE` in `page.tsx`:

```typescript
{
  name: "Charlie",
  location: "kitchen",
  preferredTemp: 74,
  x: 120,
  y: 100,
  comfortable: true,
}
```

### Add More Tools

Edit `TOOLS` array in `backend/src/api/planner_apis.py`:

```python
{
    "name": "set_thermostat_mode",
    "description": "Set thermostat to heat, cool, or auto mode",
    "parameters": {
        "type": "object",
        "properties": {
            "mode": {
                "type": "string",
                "enum": ["heat", "cool", "auto", "off"]
            }
        },
        "required": ["mode"]
    }
}
```

Then add handling in `executeToolCall` function in `page.tsx`.

## Demo Script

For presentations, try this sequence:

1. **Start Simple**: "Set bedroom to 65 degrees"

   - Shows basic tool calling
   - Visual temperature change

2. **Show Understanding**: "Freeze Alice"

   - LM must find Alice first
   - Shows multi-step reasoning

3. **Complex Scenario**: "Prepare living room for party"

   - LM interprets abstract concept
   - Multiple tools used

4. **Query**: "What temperature is the kitchen?"

   - Shows read operations
   - Result displayed in UI

5. **Challenge**: "Make everyone comfortable"
   - Tests LM's ability to iterate over people
   - Multiple rooms adjusted

## Next Steps

- Add more sophisticated commands ("Keep the house energy efficient")
- Implement scheduling ("Set bedroom to 65 at 10pm")
- Add more appliances (fans, blinds, music)
- Create conflict resolution (two people in same room with different preferences)
- Add conversation history (refer to previous commands)
