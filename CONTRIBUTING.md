# Contributing to Interleet

Thanks for helping visualize Leetcode solutions! Here's how to add one.

## Steps

1. **Fork & clone** the repo, then `npm install`.

2. **Add the problem description** as a markdown file at:
   ```
   src/assets/problems/problem_XX.md
   ```
   where `XX` is the Leetcode problem number (e.g. `problem_1.md`).

3. **Create a visualization component** at:
   ```
   src/problems/YourProblemVisualization.tsx
   ```
   This is a regular React component — use whatever approach you like to animate or illustrate the algorithm.

4. **Register the problem** in `src/problems/registry.ts`:
   - Make sure the problem entry exists in the `problems` array with `hasVisualization: true`.

5. **Wire up lazy loading** in `src/pages/ProblemPage.tsx`:
   ```ts
   const visualizations: Record<number, ReturnType<typeof lazy>> = {
     1: lazy(() => import("../problems/TwoSumVisualization")),
     // Add yours here:
     XX: lazy(() => import("../problems/YourProblemVisualization")),
   };
   ```

6. **Test locally** with `npm run dev`, then open a pull request.

That's it!
