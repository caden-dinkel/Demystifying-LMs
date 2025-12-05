# Full Animation Components

This directory contains components for visualizing the complete language model generation process, from prompt input to token selection.

## Components

### `index.tsx` - FullGenerationProcess

The main orchestrator component that coordinates all the animation steps.

**Props:**

- `initialPrompt: string` - The text prompt to visualize
- `autoStart?: boolean` - Whether to automatically start the animation (default: false)

**Features:**

- Step-by-step visualization of the LM pipeline
- Play/Pause controls
- Reset functionality
- Automatic progression through steps
- Contextual descriptions for each step

### `prompt.tsx` - Prompt

Displays the user's input prompt.

**Props:**

- `text: string` - The prompt text
- `isVisible: boolean` - Controls visibility with animation

### `tokens_list.tsx` - TokensList

Shows the tokenized version of the prompt.

**Props:**

- `tokens: string[]` - Array of token strings
- `isVisible: boolean` - Controls visibility with staggered animations

### `model.tsx` - Model

Represents the language model processing stage.

**Props:**

- `isProcessing: boolean` - Shows processing state with pulse animation
- `isVisible: boolean` - Controls visibility
- `modelName?: string` - Name of the model (default: "Language Model")

### `logits_prob.tsx` - LogitsProb

Visualizes probability distribution of potential next tokens.

**Props:**

- `tokens: string[]` - Array of token strings
- `probabilities: number[]` - Corresponding probability values (0-1)
- `isVisible: boolean` - Controls visibility with animation

**Display:**

- Shows top 5 tokens with horizontal bar charts
- Animated bars filling based on probability
- Percentage labels

### `sampling.tsx` - Sampling

Shows the token sampling/selection strategy and result.

**Props:**

- `selectedToken: string | null` - The token chosen by the sampling strategy
- `isVisible: boolean` - Controls visibility
- `method?: "greedy" | "sampling" | "beam"` - Sampling method (default: "greedy")

### `arrows.tsx` - Arrows

Renders animated arrows connecting the components using D3.

**Props:**

- `step: number` - Current animation step (0-5)

**Connections:**

1. Prompt → Tokens
2. Tokens → Model
3. Model → Logits
4. Logits → Sampling

## Animation Flow

The animation progresses through 5 steps:

1. **Step 0:** Display the input prompt
2. **Step 1:** Tokenize the prompt
3. **Step 2:** Process through language model
4. **Step 3:** Display probability distribution
5. **Step 4:** Sample/select next token
6. **Step 5+:** Complete

Each step takes 2 seconds by default when auto-playing.

## Usage Example

```tsx
import { FullGenerationProcess } from "@/components/full_anim";

export default function Page() {
  return (
    <FullGenerationProcess initialPrompt="Hello, world!" autoStart={true} />
  );
}
```

## Styling

Components use Tailwind CSS classes for styling with:

- Color-coded sections (blue for prompt, purple for tokens, green for model, orange for logits, pink for sampling)
- Smooth transitions and animations
- Responsive grid layout
- SVG arrow overlays

## Dependencies

- React
- D3.js (for arrow rendering)
- Lucide React (for icons)
- Tailwind CSS
- API utilities: `postTokenizeText`, `getTokenProbabilities`
