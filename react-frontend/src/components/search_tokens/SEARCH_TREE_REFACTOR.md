# Search Tree Refactoring

## Overview

The search tree components have been refactored to separate **shared state management logic** from **API call strategy**. This allows us to have different search implementations (user-driven manual selection vs. algorithm-driven auto-expansion) while sharing the same underlying tree data structure and operations.

## Architecture

### Core Components

1. **`useSearchTree.tsx`** - Context Provider

   - Manages all tree state (searchTree Map, searchPath, animationData)
   - Provides tree operations (addChildrenToNode, selectNode, navigateBack, etc.)
   - Provides derived state (lhsTokenData, rhsTokenData, currentPrompt)
   - Accepts `onInitialize` callback for injecting API call logic

2. **`userSearchTree.tsx`** - User-Driven Component

   - Uses SearchTreeProvider for state management
   - Implements **manual token selection**: User clicks on tokens to expand
   - API calls triggered by user actions (`handleNextToken`)

3. **`algoSearchTree.tsx`** - Algorithm-Driven Component
   - Uses SearchTreeProvider for state management
   - Implements **automatic token selection**: Always selects highest probability token (greedy)
   - API calls triggered by algorithm logic (`performAlgorithmicStep`)
   - LM settings (temperature, top_k, top_p, etc.) control the token probability distribution
   - Captures the path and probabilities at each step for analysis

## Key Differences Between User and Algorithm Modes

| Aspect                  | User Mode (`userSearchTree`)          | Algorithm Mode (`algoSearchTree`)           |
| ----------------------- | ------------------------------------- | ------------------------------------------- |
| **Token Selection**     | User clicks on token                  | Highest probability token (greedy)          |
| **LM Settings**         | Affect available token choices        | Control output distribution & probabilities |
| **API Trigger**         | `handleNextToken` on click            | `performAlgorithmicStep` recursive          |
| **Expansion Control**   | User decides when/where               | Continues until `maxDepth`                  |
| **Visualization Speed** | Instant on click                      | 500ms delay between steps                   |
| **Manual Override**     | N/A (already manual)                  | Can navigate back to stop algorithm         |
| **Use Case**            | Interactive exploration of token tree | Analyze path taken with specific LM configs |

## Usage Examples

### User-Driven Search

```tsx
import { TokenSearch } from "@/components/search_tokens/userSearchTree";

// In your page component:
<TokenSearch initialPrompt="Hello world" />;
```

### Algorithm-Driven Search

```tsx
import { AlgoSearchTree } from "@/components/search_tokens/algoSearchTree";

// Greedy search (always selects highest probability token)
// LM settings control the token distribution
<AlgoSearchTree initialPrompt="Hello world" maxDepth={5} />

// With deeper exploration
<AlgoSearchTree initialPrompt="Hello world" maxDepth={10} />
```

**Note**: The algorithm always selects the highest probability token. To change the behavior:

- Adjust **temperature** in LM settings to make distribution more/less uniform
- Adjust **top_k** or **top_p** to filter the available tokens
- The algorithm captures the path and probabilities at each step

## How the Context Pattern Works

### Initialization Flow

1. **Wrapper component** creates `SearchTreeProvider` with `onInitialize` callback
2. **Provider** calls `initializeTree()` when `initialPrompt` changes
3. **Provider** invokes `onInitialize(prompt, addChildren)` callback
4. **Wrapper** makes API call: `getTokenProbabilities(prompt, model)`
5. **Wrapper** calls `addChildren(tokens, probabilities)` with API response
6. **Provider** updates tree state with initial children
7. **Content component** reads derived state from context

### User Selection Flow (userSearchTree)

1. User clicks token in TokenMap
2. `handleNextToken(selectedId, coords)` called
3. Build prompt from current path + selected token
4. Make API call: `getTokenProbabilities(newPrompt, model)`
5. Update tree: `deselectNode`, `selectNode`, `addChildrenToNode`, `moveToNode`
6. Context updates derived state automatically
7. UI re-renders with new tokens

### Algorithm Selection Flow (algoSearchTree)

1. Initial children loaded, `performAlgorithmicStep("initial")` called
2. Algorithm selects highest probability token (greedy selection)
3. Build prompt from current path + selected token
4. Make API call: `getTokenProbabilities(newPrompt, model)` (LM settings applied)
5. Update tree: `deselectNode`, `selectNode`, `addChildrenToNode`, `moveToNode`
6. Wait 500ms for visualization
7. Recursively call `performAlgorithmicStep(newSelectedId)` until maxDepth
8. Path and probabilities captured for analysis

## Shared State Management

All tree operations are centralized in the context:

```tsx
const {
  // State
  searchTree, // Map<string, TreeNode>
  searchPath, // string[] - IDs of selected path
  animationData, // { startCoords, endId } | null

  // Actions
  addChildrenToNode, // Add API results to node
  selectNode, // Mark node as selected
  deselectNode, // Unmark node
  moveToNode, // Add to search path
  navigateBack, // Truncate path (undo)

  // Utilities
  getNodeById, // Get TreeNode by ID
  buildPromptFromPath, // Reconstruct prompt string

  // Derived State
  lhsTokenData, // Tokens for prompt display
  rhsTokenData, // Tokens for token map
  currentPrompt, // Current prompt string
} = useSearchTree();
```

## Benefits of This Architecture

1. **DRY Principle**: Tree logic written once, used by both modes
2. **Single Source of Truth**: All state in context, no prop drilling
3. **Easy to Add New Modes**: Create new component using same provider
4. **Testable**: State management logic separated from UI and API
5. **Flexible API Integration**: `onInitialize` callback allows different API strategies

## Future Extensions

### Adding New Search Algorithms

1. Create new component similar to `algoSearchTree.tsx`
2. Use `SearchTreeProvider` wrapper
3. Implement different selection logic in `performAlgorithmicStep`
4. Example: Top-k sampling, nucleus sampling, etc.

### Adding Settings Toggle

```tsx
const SearchTreeContainer = ({ initialPrompt }: Props) => {
  const [mode, setMode] = useState<"user" | "algo">("user");

  return (
    <>
      <ModeSelector mode={mode} onChange={setMode} />

      {mode === "user" ? (
        <TokenSearch initialPrompt={initialPrompt} />
      ) : (
        <AlgoSearchTree initialPrompt={initialPrompt} maxDepth={10} />
      )}
    </>
  );
};
```

### Integration with LMRequestConfig

The algorithm uses LM settings to control token selection behavior:

```tsx
// LM settings from context automatically applied
const { selectedLM, temperature, top_k, top_p } = useLMSettings();

// API call uses these settings
const data = await getTokenProbabilities(promptForApi, selectedLM, {
  temperature, // Controls randomness (0 = deterministic, 1+ = more random)
  top_k, // Limits to top K tokens
  top_p, // Nucleus sampling threshold
});

// Algorithm then selects highest probability from returned tokens
```

## Migration Notes

- Old `userSearchTree.tsx` had inline state management (useState, useRef)
- All state logic moved to `useSearchTree` context
- API call logic remains in component via `onInitialize` callback
- No breaking changes to external API (still exports `TokenSearch`)
