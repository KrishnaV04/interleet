# Contributing to Interleet

Thanks for helping visualize LeetCode solutions! This guide covers how to add new problem descriptions, create or update visualizations, and wire everything together.

## Project Structure

```
src/
  assets/problems/
    problem_1/
      problem.md          # Problem description (markdown)
      addtwonumber1.jpg    # Images referenced by the markdown (if any)
    problem_2/
      problem.md
      ...
  problems/
    registry.ts            # Master list of all problems
    TwoSumVisualization.tsx # Visualization components
    ...
  components/
    VisualizationLayout.tsx # Shared layout wrapper for all visualizations
  pages/
    ProblemPage.tsx         # Renders description + visualization side-by-side
    HomePage.tsx            # Problem list with search/filter
```

## Getting Started

1. **Fork & clone** the repo
2. Run `npm install`
3. Run `npm run dev` to start the dev server

---

## Adding a Problem Description

If a problem is already in the registry but is missing a `problem.md`, you can add one:

1. Create the folder if it doesn't exist:
   ```
   src/assets/problems/problem_{id}/
   ```

2. Write `problem.md` following this format:
   ```markdown
   # {id}. {title}

   {Description text. Use `backticks` for code, **bold** for emphasis.}

   ---

   ### Example 1

   **Input:** `nums = [2,7,11,15], target = 9`
   **Output:** `[0,1]`
   **Explanation:** Because nums[0] + nums[1] == 9, we return [0, 1].

   ### Example 2

   **Input:** `nums = [3,2,4], target = 6`
   **Output:** `[1,2]`

   ---

   ### Constraints

   - `2 <= nums.length <= 10^4`
   - `-10^9 <= nums[i] <= 10^9`

   **Follow-up:** Can you come up with an algorithm that is less than O(n^2) time?
   ```

3. **Images:** If the problem has diagrams, download them into the same folder and reference them with relative paths:
   ```markdown
   ![linked list diagram](./addtwonumber1.jpg)
   ```
   Images are automatically resolved by Vite — no additional config needed.

4. **Register the problem** if it's not already in `src/problems/registry.ts`:
   ```ts
   { id: 51, title: "N-Queens", difficulty: "Hard", hasVisualization: false },
   ```

---

## Creating a Visualization

Every visualization follows the same pattern. Here's a step-by-step walkthrough:

### 1. Create the component file

```
src/problems/{ProblemName}Visualization.tsx
```

Use PascalCase matching the problem title (e.g., `TwoSumVisualization.tsx`, `ValidParenthesesVisualization.tsx`).

### 2. Follow the standard structure

All visualizations use `VisualizationLayout` and share a common pattern:

```tsx
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

// 1. Define a StepState interface for your algorithm's state at each step
interface StepState {
  // ... fields specific to your algorithm
  message: string;  // Log message for this step (required)
}

// 2. Shared input styles (copy these as-is)
const INPUT_STYLE: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #303030",
  color: "#e2e8f0",
  borderRadius: 6,
  padding: "4px 8px",
  fontFamily: "monospace",
  fontSize: 13,
  outline: "none",
  width: 200,
};
const LABEL_STYLE: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: 1,
  marginRight: 8,
};
const ERROR_STYLE: React.CSSProperties = {
  color: "#ef4444",
  fontSize: 11,
  marginTop: 4,
};

// 3. Step generation function — pre-computes ALL algorithm steps
function generateSteps(/* your inputs */): StepState[] {
  const steps: StepState[] = [];
  // Walk through the algorithm, pushing a step for each meaningful state change.
  // Each step MUST include a descriptive `message` string for the log panel.
  return steps;
}

// 4. The component
export default function YourProblemVisualization() {
  // ── Input state ──
  const [inputValue, setInputValue] = useState("default value");
  const [inputError, setInputError] = useState<string | null>(null);

  // ── Playback state ──
  const [stepIndex, setStepIndex] = useState(-1);  // -1 = not started
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // ── Pre-compute steps ──
  const steps = useMemo(() => generateSteps(/* parsed inputs */), [/* deps */]);

  // ── Playback controls ──
  const play = useCallback(async () => {
    stopRef.current = false;
    setIsRunning(true);
    const start = stepIndex < 0 ? 0 : stepIndex + 1;
    for (let i = start; i < steps.length; i++) {
      if (stopRef.current) break;
      await new Promise((r) => setTimeout(r, 800 / speedRef.current));
      if (stopRef.current) break;
      setStepIndex(i);
    }
    setIsRunning(false);
  }, [stepIndex, steps.length]);

  const stop = useCallback(() => {
    stopRef.current = true;
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stopRef.current = true;
    setIsRunning(false);
    setStepIndex(-1);
  }, []);

  const isDone = stepIndex >= 0 && stepIndex === steps.length - 1;
  const logEntries = steps.slice(0, stepIndex + 1).map((s) => s.message);

  // ── Render ──
  return (
    <VisualizationLayout
      inputPanel={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Your input fields with validation */}
          {inputError && <div style={ERROR_STYLE}>{inputError}</div>}
        </div>
      }
      onPlay={play}
      onStop={stop}
      onReset={reset}
      isPlaying={isRunning}
      isDone={isDone}
      speed={speed}
      onSpeedChange={setSpeed}
      logEntries={logEntries}
    >
      {/* Your visualization JSX here */}
    </VisualizationLayout>
  );
}
```

### 3. Input handling guidelines

- **Inputs must be user-configurable** with text fields in the `inputPanel`.
- **Validate inputs** on every keystroke — show errors via `inputError` state. Constraints to check:
  - Correct data types (integers, strings, etc.)
  - Reasonable bounds (array length, value ranges)
  - Algorithm-specific validity (e.g., sorted arrays for binary search, valid bracket chars for parentheses problems)
- **Reset playback** when inputs change: set `stopRef.current = true`, `setIsRunning(false)`, `setStepIndex(-1)`.
- If input validation is impractical for a problem, hard-code a default input that exercises a variety of algorithm steps.

### 4. Color tokens

Use these consistently across all visualizations:

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0a0a0a` | Page background |
| Element bg | `#1e293b` | Card/box default background |
| Border | `#334155` | Default borders |
| Blue | `#3b82f6` | Active/current element, pointers |
| Green | `#22c55e` | Success, confirmed, matched |
| Red | `#ef4444` | Error, mismatch, failed |
| Yellow | `#f1fa8c` | Highlight, attention |
| Cyan | `#8be9fd` | Code, secondary highlight |
| Text primary | `#f8fafc` | Main text |
| Text secondary | `#94a3b8` | Labels, headers |
| Text muted | `#64748b` | Index numbers, hints |

### 5. Register and wire up

After creating your component, two more files need updates:

**`src/problems/registry.ts`** — set `hasVisualization: true`:
```ts
{ id: 42, title: "Trapping Rain Water", difficulty: "Hard", hasVisualization: true },
```

**`src/pages/ProblemPage.tsx`** — add a lazy import:
```ts
const visualizations: Record<number, ReturnType<typeof lazy>> = {
  // ... existing entries
  42: lazy(() => import("../problems/TrappingRainWaterVisualization")),
};
```

### 6. Test locally

```bash
npm run dev
```

Navigate to your problem page and verify:
- Inputs validate correctly and show errors for bad input
- Play/Stop/Reset all work
- Speed slider affects animation speed
- Log panel shows clear step-by-step messages
- The visualization renders correctly at each step

---

## Updating an Existing Visualization

If you're improving an existing visualization:

1. Read the current component in `src/problems/`
2. Follow the same patterns described above
3. Make sure existing functionality still works — don't break input validation or playback
4. Test with a variety of inputs, including edge cases

---

## Example Visualizations to Reference

These are good examples of the established patterns:

| Problem | File | Notes |
|---------|------|-------|
| Two Sum | `TwoSumVisualization.tsx` | Hash map visualization, configurable `nums`/`target` with feasibility check |
| Valid Parentheses | `ValidParenthesesVisualization.tsx` | Stack visualization, character status tracking |
| Merge Two Sorted Lists | `MergeTwoSortedListsVisualization.tsx` | Two-pointer merge, dual input fields, "just taken" detection |
| Remove Element | `RemoveElementVisualization.tsx` | In-place array mutation, skip/keep visual feedback |

---

## Submitting Your PR

1. Make sure `npx tsc --noEmit` passes with no errors
2. Test with `npm run dev`
3. Open a pull request with a brief description of what you added or changed
