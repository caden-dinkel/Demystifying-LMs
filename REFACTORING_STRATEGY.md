# LM API Refactoring Strategy

## Overview

This document outlines a **pragmatic, incremental refactoring approach** for adding temperature, max_tokens, search_strategy, and other configuration options to your LM APIs, while preparing for a future Nomad/vLLM migration.

## Why This Approach?

### ✅ Advantages

1. **Backward Compatible**: All existing code continues to work unchanged
2. **Forward Compatible**: Can add new fields anytime without breaking changes
3. **Migration-Ready**: When switching to Nomad/vLLM, only update one file (`lmClient.ts`)
4. **Minimal Risk**: No "big bang" refactor - incremental changes only
5. **Team-Friendly**: Team member can work on Nomad migration independently

### ❌ Avoided Pitfalls

- No premature optimization for unknown future requirements
- No large-scale breaking changes across the codebase
- No tight coupling to current FastAPI implementation

---

## Implementation Steps

### Phase 1: Add Types (✅ DONE - Safe to do now)

**Files Changed:**

- `src/utilities/types.ts` - Added `LMRequestConfig` and defaults
- `src/api/lmClient.ts` - Created centralized client
- `src/api/getTokenProbs.ts` - Example migration

**What this gives you:**

- Centralized configuration type
- Default values in one place
- Type safety for new fields

**Risk Level:** 🟢 Very Low - Just adds new code, doesn't change existing code

---

### Phase 2: Migrate API Calls (OPTIONAL - Do when needed)

**When to do this:** When you actually need to use temperature/max_tokens

**Pattern:**

```typescript
// Before (still works!)
await getTokenProbabilities("Hello", "gpt2");

// After (when you need config)
await getTokenProbabilities("Hello", "gpt2", {
  temperature: 0.8,
  max_tokens: 150,
});
```

**Risk Level:** 🟡 Low - Backward compatible, can migrate one endpoint at a time

---

### Phase 3: Update Backend (Do when frontend needs it)

**Files to Change:**

- `backend/src/api/lm_apis.py` - Update `LMInput` model

**Changes:**

```python
# Just add optional fields to LMInput
class LMInput(BaseModel):
    prompt: str
    model_name: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 100
    search_strategy: Optional[str] = "greedy"

    class Config:
        extra = "ignore"  # Ignore unknown fields
```

**Risk Level:** 🟡 Low - Optional fields with defaults, backward compatible

---

### Phase 4: Nomad/vLLM Migration (Future - Team Member)

**Files to Change:**

- `src/api/lmClient.ts` - Add routing logic

**What changes:**

```typescript
// In lmClient.ts
private getModelEndpoint(modelName: string): string {
  const routes = {
    "gpt2": "http://nomad-gpu-1:8000",
    "llama": "http://nomad-gpu-2:8000"
  };
  return routes[modelName] || API_BASE_URL;
}
```

**Frontend Code:** NO CHANGES NEEDED! ✨

**Risk Level:** 🟢 Low - Isolated to one file, frontend code unchanged

---

## Usage Examples

### Example 1: Using Temperature from Settings

```typescript
const { temperature, maxTokens, selectedLM } = useLMSettings();

const result = await getTokenProbabilities(prompt, selectedLM, {
  temperature: temperature[0] / 100,
  max_tokens: maxTokens,
});
```

### Example 2: With Search Strategy

```typescript
const result = await getTokenProbabilities(prompt, selectedLM, {
  search_strategy: "beam",
  top_k: 5,
  temperature: 0.8,
});
```

### Example 3: Direct Client (Most Flexible)

```typescript
import { lmClient } from "@/api/lmClient";

const result = await lmClient.request("lm/token_probs", {
  prompt: "Hello world",
  model_name: "gpt2",
  temperature: 0.7,
  max_tokens: 100,
  search_strategy: "greedy",
});
```

---

## Current Status

### ✅ Completed

- Created `LMRequestConfig` type
- Created `lmClient` with centralized request handling
- Updated `getTokenProbs` as example (backward compatible)
- Created migration examples and documentation

### 🔄 Ready to Do (When Needed)

- Update backend `LMInput` to accept new fields
- Add temperature/max_tokens to `useLMSettings` context
- Update other API calls using same pattern as `getTokenProbs`
- Add search strategy selector to UI

### 🔮 Future (Team Member)

- Migrate backend to Nomad/vLLM
- Update `lmClient.ts` routing logic
- NO frontend component changes needed

---

## Decision Matrix: When to Use Each Pattern

| Scenario                 | Pattern                 | Risk        | Effort  |
| ------------------------ | ----------------------- | ----------- | ------- |
| Need temp/max_tokens now | Migrate 1 API call      | 🟡 Low      | 5 min   |
| Need all features        | Migrate all API calls   | 🟡 Low      | 30 min  |
| Preparing for Nomad      | Just use lmClient types | 🟢 Very Low | 0 min   |
| Future: Nomad migration  | Update lmClient.ts only | 🟡 Low      | 1-2 hrs |

---

## Testing Strategy

### Before Rolling Out

1. ✅ Verify existing calls still work (no config passed)
2. ✅ Test with partial config (only temperature)
3. ✅ Test with full config (all fields)
4. ✅ Test backend ignores extra unknown fields

### After Nomad Migration

1. Same API interface - same tests should pass
2. Only need to test routing logic
3. Frontend unchanged - no frontend testing needed

---

## Recommendations

### ✅ Do Now

- Keep the types and lmClient code (already added)
- Document this approach for team member
- No other changes needed yet

### ⏳ Do When Needed

- Add temperature slider functionality
- Update backend when frontend needs it
- Migrate other API calls as you use new features

### 🚫 Don't Do Yet

- Don't migrate all API calls at once
- Don't modify backend until frontend needs it
- Don't optimize for unknown Nomad requirements

---

## Questions & Answers

**Q: Should I migrate all API calls now?**
A: No. Only migrate when you need the new features. Your existing code works fine.

**Q: Will this work with Nomad/vLLM?**
A: Yes! You'll only need to update `lmClient.ts` routing logic. Frontend code unchanged.

**Q: What if requirements change?**
A: Just add new optional fields to `LMRequestConfig`. Backward compatible.

**Q: Is this over-engineered?**
A: No. It's minimal - just a type definition and a client wrapper. You can still call APIs directly if needed.

**Q: Should backend be updated now?**
A: Only when frontend actually needs to send temperature/max_tokens. No rush.

---

## Files Reference

### Frontend

- ✅ `src/utilities/types.ts` - Type definitions
- ✅ `src/api/lmClient.ts` - Centralized client
- ✅ `src/api/getTokenProbs.ts` - Example migration
- 📖 `src/api/MIGRATION_EXAMPLES.ts` - Usage examples

### Backend

- 📖 `backend/MIGRATION_EXAMPLE.py` - Backend patterns
- ⏳ `backend/src/api/lm_apis.py` - Update when needed

---

## Summary

**Current State:** ✅ Ready for gradual migration
**Risk Level:** 🟢 Very Low
**Breaking Changes:** ❌ None
**When to Start:** When you need temperature/max_tokens
**Nomad Impact:** Minimal - one file change

You're set up for success! The infrastructure is in place, but you don't need to change anything until you're ready to use the new features. When your team member migrates to Nomad, they can do it without touching 95% of your code.
