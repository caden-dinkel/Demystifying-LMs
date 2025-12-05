# LM as Planner - Smart Home Simulation Design

## Overview

This feature demonstrates language models' ability to act as planners by controlling a smart home environment. The LM receives tool definitions and must decide which tools to call and with what parameters to satisfy user commands.

## Architecture

### Frontend Components

```
src/components/home_simulation/
├── smartHome.tsx           - Main container with floor plan
├── room.tsx                - Individual room rendering with temperature display
├── person.tsx              - Person rendering with preferences
├── smartHomeController.tsx - NEW: LM planner interface
└── toolCallDisplay.tsx     - NEW: Shows tool calls being made
```

### Backend API

```
backend/src/api/
├── lm_apis.py             - Existing LM endpoints
└── planner_apis.py        - NEW: Tool-calling endpoints
```

## Data Models

### Extended Types

```typescript
// Frontend types
interface Room {
  bounds: { leftX: number; rightX: number; topY: number; bottomY: number };
  name: string;
  id: string;
  targetTemp: number;
  currentTemp: number;
  lightOn: boolean; // NEW
  hvacMode: "heat" | "cool" | "off"; // NEW
}

interface Person {
  location: string; // room ID
  name: string;
  preferredTemp: number;
  x: number; // NEW: position within room
  y: number; // NEW: position within room
  comfortable: boolean; // NEW: is current temp acceptable?
}

interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
  enum?: string[]; // For constrained values
}

interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
  timestamp: number;
}

interface PlannerState {
  rooms: Room[];
  people: Person[];
  toolCalls: ToolCall[];
  status: "idle" | "thinking" | "executing" | "complete";
  llmResponse?: string;
}
```

### Backend Models

```python
class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: dict  # JSON Schema format

class ToolCall(BaseModel):
    tool_name: str
    arguments: dict

class PlannerInput(BaseModel):
    prompt: str
    model_name: str
    tools: list[ToolDefinition]
    current_state: dict  # Current home state

class PlannerOutput(BaseModel):
    reasoning: str  # LM's thought process
    tool_calls: list[ToolCall]
    complete: bool
```

## Tool Definitions

### 1. set_room_temperature

```json
{
  "name": "set_room_temperature",
  "description": "Set the target temperature for a specific room",
  "parameters": {
    "type": "object",
    "properties": {
      "room_name": {
        "type": "string",
        "description": "Name of the room (e.g., 'living_room', 'bedroom')",
        "enum": ["living_room", "bedroom", "kitchen", "bathroom"]
      },
      "temperature": {
        "type": "number",
        "description": "Target temperature in Fahrenheit (60-80)"
      }
    },
    "required": ["room_name", "temperature"]
  }
}
```

### 2. set_room_light

```json
{
  "name": "set_room_light",
  "description": "Turn lights on or off in a specific room",
  "parameters": {
    "type": "object",
    "properties": {
      "room_name": {
        "type": "string",
        "enum": ["living_room", "bedroom", "kitchen", "bathroom"]
      },
      "state": {
        "type": "boolean",
        "description": "true for on, false for off"
      }
    },
    "required": ["room_name", "state"]
  }
}
```

### 3. get_person_location

```json
{
  "name": "get_person_location",
  "description": "Get the current room location of a person",
  "parameters": {
    "type": "object",
    "properties": {
      "person_name": {
        "type": "string",
        "description": "Name of the person"
      }
    },
    "required": ["person_name"]
  }
}
```

### 4. get_room_status

```json
{
  "name": "get_room_status",
  "description": "Get current temperature and light status of a room",
  "parameters": {
    "type": "object",
    "properties": {
      "room_name": {
        "type": "string",
        "enum": ["living_room", "bedroom", "kitchen", "bathroom"]
      }
    },
    "required": ["room_name"]
  }
}
```

## Example Scenarios

### Scenario 1: "Freeze Alice"

```
User: "Freeze Alice"

LM Process:
1. get_person_location("Alice") → "bedroom"
2. set_room_temperature("bedroom", 60)

Result: Bedroom temperature drops to 60°F
```

### Scenario 2: "Prepare the living room for a party"

```
User: "Prepare the living room for a party"

LM Process:
1. set_room_light("living_room", true)
2. set_room_temperature("living_room", 72)  # Comfortable for crowd

Result: Living room lights on, temperature at 72°F
```

### Scenario 3: "Make everyone comfortable"

```
User: "Make everyone comfortable"

LM Process:
1. get_person_location("Alice") → "bedroom"
2. get_person_location("Bob") → "living_room"
3. set_room_temperature("bedroom", 70)  # Alice prefers 70
4. set_room_temperature("living_room", 68)  # Bob prefers 68

Result: Each room adjusted to occupant's preference
```

## Implementation Plan

### Phase 1: Backend Tool Calling Infrastructure

1. **Create `planner_apis.py`**

   - `/planner/execute` endpoint
   - Accepts: user command, current state, tool definitions
   - Uses Llama 3.2 with tool-calling prompt template
   - Returns: reasoning + list of tool calls

2. **Tool Calling Prompt Template**

   ```python
   SYSTEM_PROMPT = """You are a smart home assistant. You have access to tools to control the home.

   Available tools:
   {tools_json}

   Current state:
   {state_json}

   To use a tool, respond with JSON:
   {
     "reasoning": "your thought process",
     "tool_calls": [
       {"tool_name": "tool_name", "arguments": {...}}
     ]
   }
   """
   ```

3. **Response Parser**
   - Extract JSON from LM response
   - Validate tool calls against definitions
   - Handle errors gracefully

### Phase 2: Frontend Visualization

1. **Enhanced Room Component**

   ```tsx
   interface RoomState {
     temperature: number;
     targetTemp: number;
     lightOn: boolean;
     occupants: Person[];
   }

   // Visual indicators:
   // - Temperature color gradient (blue=cold, red=hot)
   // - Light indicator (yellow glow)
   // - Temperature number overlay
   ```

2. **Person Component**

   ```tsx
   interface PersonProps {
     person: Person;
     x: number;
     y: number;
     comfortable: boolean; // Green if comfortable, red if not
   }

   // Render as:
   // - Circle or avatar
   // - Name label
   // - Comfort indicator (color)
   // - Preferred temp tooltip
   ```

3. **Smart Home Controller**

   ```tsx
   interface ControllerProps {
     onCommand: (command: string) => Promise<void>;
   }

   // Features:
   // - Text input for commands
   // - "Execute" button
   // - Loading state during LM processing
   // - Tool call history display
   ```

4. **Tool Call Display**

   ```tsx
   interface ToolCallDisplayProps {
     toolCalls: ToolCall[];
     reasoning: string;
   }

   // Shows:
   // - LM's reasoning text
   // - List of tool calls with parameters
   // - Execution order and timing
   // - Success/failure indicators
   ```

### Phase 3: Animation & State Management

1. **State Updates**

   ```tsx
   const [homeState, setHomeState] = useState<HomeState>({
     rooms: initialRooms,
     people: initialPeople,
     history: [],
   });

   const executePlanner = async (command: string) => {
     // 1. Call backend with command + current state
     const response = await plannerAPI(command, homeState);

     // 2. Animate tool calls one by one
     for (const toolCall of response.tool_calls) {
       await animateToolCall(toolCall);
       await sleep(500); // Pause between calls
     }
   };
   ```

2. **Temperature Animation**

   - Gradual color transition as temp changes
   - Number count-up/down effect
   - HVAC indicator (heating/cooling arrows)

3. **Person Movement** (optional)
   - Random walk within room bounds
   - Comfort-seeking behavior (move toward preferred temp rooms)

### Phase 4: Advanced Features

1. **Multi-Step Planning**

   - Allow LM to execute tools, observe results, plan next steps
   - Iterative loop until goal achieved

2. **Failure Handling**

   - If person not found: LM should explain
   - If conflicting goals: LM should negotiate

3. **Context Awareness**

   - LM remembers previous commands
   - Can reference "the room Alice is in" from previous queries

4. **Prompt Examples UI**
   - Preset buttons for common commands
   - "Freeze {person}", "Party mode", "Energy saving", etc.

## Technical Considerations

### Llama 3.2 Tool Calling

Llama 3.2 supports tool calling through structured prompts. Format:

```
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful assistant with access to these tools:
[tool definitions]
<|eot_id|>

<|start_header_id|>user<|end_header_id|>
{user command}
<|eot_id|>

<|start_header_id|>assistant<|end_header_id|>
```

The model should respond with structured JSON or follow a specific format for tool calls.

### Alternative: Function Calling API

If direct tool calling is complex, use a simpler approach:

1. **Classification + Extraction**

   ```
   Prompt: "Given command: '{command}', extract:
   1. Action type: temperature_control, lighting, query
   2. Target: room or person name
   3. Parameters: temperature value, on/off, etc."
   ```

2. **Map to Tools**
   - Frontend logic maps extracted params to tool calls
   - More deterministic but less flexible

### Performance

- Cache LM model in backend (already done)
- Tool execution is instant (just state updates)
- Animation timing controls user experience

### Testing

```typescript
// Test cases
const testCommands = [
  "Set living room to 72 degrees",
  "Turn off all lights",
  "Make Bob comfortable",
  "Freeze Alice",
  "Prepare bedroom for sleep",
  "What temperature is the kitchen?",
];
```

## File Structure

### New Files to Create

```
backend/src/api/planner_apis.py
backend/src/models.py  # Add tool definitions

react-frontend/src/api/plannerClient.ts
react-frontend/src/components/home_simulation/smartHomeController.tsx
react-frontend/src/components/home_simulation/toolCallDisplay.tsx
react-frontend/src/app/lms_work/smart_home_planner/page.tsx

react-frontend/src/utilities/types.ts  # Extend existing types
```

### Modified Files

```
react-frontend/src/components/home_simulation/smartHome.tsx
react-frontend/src/components/home_simulation/room.tsx
react-frontend/src/components/home_simulation/person.tsx
```

## Next Steps

1. **Backend First**:

   - Implement `planner_apis.py` with basic tool calling
   - Test with curl/Postman to verify LM can generate tool calls

2. **Frontend Integration**:

   - Create API client for planner endpoint
   - Build UI for command input and state visualization

3. **Polish**:
   - Add animations and visual feedback
   - Create example command buttons
   - Add explainability (show LM reasoning)

Would you like me to start implementing any specific part of this design?
