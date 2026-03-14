# 7yaTools Dashboard - AI Assistant Guidelines

## Project Overview
7yaTools is a **React + Vite multi-tool dashboard** serving specialized calculators and price trackers. The app is monetized through Google AdSense with a premium aesthetic ("glass panel" UI design).

**Stack**: React 18 + Vite 5 + Lucide React icons  
**Deployment**: Vercel (SPA routing configured in `vercel.json`)  
**Styling**: Plain CSS with CSS variables for a cohesive visual language

## Architecture Patterns

### Feature Module Structure
Each calculator/tool is a self-contained feature component:
- **Location**: `src/features/` (e.g., `BmiCalculator.jsx`, `InterestCalculator.jsx`)
- **Pattern**: Stateful functional component with `useState` for inputs and results
- **Styling**: All features import `Features.css` with a `feature-wrapper` class
- **Naming**: Each feature maps to a navigation ID in `Sidebar.jsx` (e.g., `'bmi'` → `BmiCalculator`)

### Router-less Navigation
- No React Router; instead uses **state-based feature switching** in `App.jsx`
- `currentFeature` state drives `renderFeature()` switch statement
- Each feature gets a `key={currentFeature}` on the container to trigger animations

### Three-Column Layout (App.jsx)
```
[Sidebar] [Main Feature Area] [Ads Sidebar]
```
- Left sidebar: navigation buttons using Lucide icons + label pairs
- Center: animated `.feature-container` with fade-in animation
- Right: reserved for Google AdSense (300x600 px placeholder)

## Adding New Features

1. **Create feature component**: `src/features/NewTool.jsx` with useState logic
2. **Add navigation**: Insert object in `Sidebar.jsx`'s `navItems` array with `id`, `label`, and `icon` from lucide-react
3. **Add route case**: Add `case 'new-id': return <NewTool />;` in `App.jsx`'s `renderFeature()` switch
4. **Style with Features.css**: Use `.feature-wrapper`, `.tool-header`, `.panel.glass-panel` classes

## CSS Design System

- **Color vars**: `--accent-warning`, `--accent-success`, `--accent-danger` (referenced in calculators)
- **Glass effect**: `.glass-panel` class for frosted-glass UI
- **Animations**: `.animate-fade-in` on feature containers
- **Responsive**: Slider inputs use `.premium-slider` class; labels use `.slider-header` with value display

## Development Workflow

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies (React, Vite, ESLint) |
| `npm run dev` | Start Vite dev server (localhost:5173 by default) |
| `npm run build` | Production build → `dist/` folder |
| `npm run lint` | ESLint validation (max-warnings: 0) |
| `npm run preview` | Preview built output locally |

**Quick start**: Run `run.ps1` on Windows or `npm install && npm run dev`

## Deployment Notes

- **Vercel config** (`vercel.json`): Routes all requests to `/index.html` (SPA mode)
- **Build output**: `dist/` directory
- **AdSense integration**: Right sidebar placeholder awaits `<ins>` tag insertion in `App.jsx`

## Code Conventions

- **File naming**: PascalCase for React components (`BmiCalculator.jsx`)
- **Import order**: React → lucide-react → relative CSS imports
- **State management**: Inline `useState` (no context/Redux); calculations often triggered by onChange or form submit
- **CSS scoping**: Feature components reuse generic classes from `Features.css`; specific styling in `App.css`

## Common Patterns in Features

- **Input sliders**: `<input type="range">` with live onChange triggers for instant recalc
- **Result display**: Conditional rendering based on calculated state (e.g., `{bmi && <ResultUI />}`)
- **Status indicators**: Use color vars and progress bars (seen in BMI calculator)
- **Form submissions**: preventDefault + parse inputs before calculation
