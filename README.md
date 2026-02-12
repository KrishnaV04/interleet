# Interleet

Interactive visualizations for LeetCode solutions.

Browse problems, read descriptions, and step through visual explanations of how each algorithm works. Built with React + TypeScript + Vite.

## How It Works

### Problem Descriptions

Each problem has a markdown file at `src/assets/problems/problem_{id}/problem.md`. These are loaded at runtime via Vite's `?raw` import and rendered with `react-markdown`. Images referenced in the markdown (e.g., linked list diagrams) live in the same folder and are resolved automatically through Vite's `import.meta.glob`.

### Visualizations

Visualizations are React components that follow a standardized structure:

1. **Pre-computed steps** — the algorithm runs upfront and produces an array of `StepState` objects, each capturing the full algorithm state and a descriptive log message
2. **Playback engine** — an async loop steps through the array with configurable delay, controlled by Play/Stop/Reset buttons
3. **VisualizationLayout** — a shared layout component that provides four sections:
   - **Input panel** (top) — user-configurable inputs with real-time validation
   - **Visualization area** (center) — the main animated display
   - **Controls** (middle) — Play, Stop, Reset buttons and speed slider
   - **Log panel** (bottom) — scrollable step-by-step log, expandable to fullscreen

### Routing & State

The app uses React Router with two routes:

- `/` — Home page with problem list, search, pagination, and viz-only filter
- `/problem/:id` — Split view with markdown description (left) and visualization (right)

Search filters (query, page, viz-only toggle) are persisted in URL search params, so they survive navigation to a problem page and back.

### Registry

All problems are defined in `src/problems/registry.ts` as a flat array with `id`, `title`, `difficulty`, and `hasVisualization` fields. Visualization components are lazy-loaded in `ProblemPage.tsx` to keep the initial bundle small.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for bundling and dev server
- **React Router** for client-side routing
- **react-markdown** for rendering problem descriptions
- **GitHub Pages** for deployment

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add problem descriptions, create visualizations, or improve existing ones.
