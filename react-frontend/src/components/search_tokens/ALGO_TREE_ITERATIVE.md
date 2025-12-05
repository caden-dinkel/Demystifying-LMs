# Algorithm Search Tree - Iterative Generation Mode

## Overview

The `algoSearchTree.tsx` component has been reworked to use the `postIterativeGeneration` API endpoint, which generates a full sequence of tokens in a single backend call and returns the top 10 tokens and probabilities at each step.

## How It Works

### Backend API (`/lm/iterative_generation`)

The backend generates up to 20 tokens in one call using the model's `generate()` method with these parameters:

- `max_new_tokens=20` - Generates up to 20 tokens
- `output_scores=True` - Returns logits for each step
- `return_dict_in_generate=True` - Returns structured output
- `do_sample=False` - Greedy decoding (always picks highest probability)

For each generation step, the backend:

1. Computes probabilities from logits
2. Extracts top 10 tokens and their probabilities
3. Records which token was actually chosen (highest probability)
4. Returns all steps in one response

### Response Structure

```typescript
interface IterativeGenerationResponse {
  generated_text: string; // The full generated text
  steps: StepData[]; // Array of generation steps
}

interface StepData {
  step: number; // Step number (1-indexed)
  top_k_tokens: string[]; // Top 10 token strings
  top_k_probs: number[]; // Corresponding probabilities
  chosen_token: string; // The token that was selected
}
```

### Frontend Behavior

1. **Initialization**: Component initializes with just the prompt (no initial token fetch)

2. **User Triggers Generation**: User clicks "Start Generation" button

3. **Single API Call**: Frontend calls `postIterativeGeneration(prompt, model)` once

4. **Playback Mode**: Component enters "playback" mode, processing one step at a time:

   - Adds top 10 tokens as children to current node
   - Finds the `chosen_token` among the children
   - Selects and moves to that token
   - Waits 500ms for visualization
   - Continues to next step

5. **Step Display**: Shows progress "Step X / Y" as it plays through

6. **Manual Navigation**: User can click on prompt tokens to go back, which stops playback

## Key Differences from Previous Implementation

| Aspect                 | Old (Multiple API Calls)    | New (Single Iterative Call)        |
| ---------------------- | --------------------------- | ---------------------------------- |
| **API Calls**          | One per token selected      | One call for entire sequence       |
| **Generation Control** | Frontend picks highest prob | Backend controls via greedy decode |
| **Token Selection**    | Frontend logic selects next | Backend has already chosen         |
| **Speed**              | Dependent on API latency    | Instant data, animated display     |
| **Network Overhead**   | High (N calls for N tokens) | Low (1 call for N tokens)          |
| **Consistency**        | May vary per call           | Guaranteed consistent path         |

## Advantages

1. **Performance**: Single API call eliminates network overhead
2. **Consistency**: Backend generates complete sequence atomically
3. **Analysis**: Can capture exact path model would take with given settings
4. **Efficiency**: Backend can optimize generation (e.g., batching, KV cache)
5. **Flexibility**: LM settings (temperature, top_k, etc.) applied uniformly

## Usage

```tsx
import { AlgoSearchTree } from "@/components/search_tokens/algoSearchTree";

<AlgoSearchTree initialPrompt="Hello world" />;
```

The component will:

1. Display the initial prompt
2. Show a "Start Generation" button
3. When clicked, fetch 20 tokens with top-10 alternatives at each step
4. Animate through the generation step-by-step (500ms between steps)
5. Allow navigation back through the prompt tokens

## LM Settings Integration

The LM settings (temperature, top_k, top_p, etc.) will be applied when the backend is updated to accept them via `LMRequestConfig`. Currently, the backend uses:

- `do_sample=False` (greedy decoding)
- `max_new_tokens=20` (fixed sequence length)

Future enhancement:

```typescript
const response = await postIterativeGeneration(currentPrompt, selectedLM, {
  temperature: 0.7,
  max_tokens: 20,
  top_k: 50,
});
```

## Technical Details

### State Management

- `stepsData`: Stores all steps from API response
- `currentStepIndex`: Tracks which step is currently being displayed
- `isPlaying`: Boolean flag for playback state

### Animation Loop

Uses `useEffect` with `setTimeout` to create controlled playback:

```typescript
useEffect(() => {
  if (!isPlaying || currentStepIndex >= stepsData.length) return;

  const timer = setTimeout(() => {
    // Process current step
    // Increment index
  }, 500);

  return () => clearTimeout(timer);
}, [isPlaying, currentStepIndex, stepsData, ...]);
```

### Token Matching

The component matches `chosen_token` from the backend to the newly added children:

```typescript
const chosenTokenId = currentNode.childrenNodeIds.find((id) => {
  const node = getNodeById(id);
  return node?.token === step.chosen_token;
});
```

This ensures the exact token the model chose is highlighted and selected.

## Future Enhancements

1. **Playback Controls**:

   - Pause/Resume button
   - Speed control (faster/slower animation)
   - Step forward/backward buttons

2. **Configuration**:

   - Adjust `max_new_tokens` via props or settings
   - Enable/disable `do_sample` for probabilistic sampling
   - Configure `top_k` display (currently shows 10)

3. **Visualization**:

   - Highlight probability distribution changes
   - Show entropy or perplexity at each step
   - Color-code tokens by probability

4. **Export**:
   - Download the generation path as JSON
   - Export visualization as image/video
   - Save for later comparison
