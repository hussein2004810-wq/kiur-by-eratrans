---
name: lucide-icons
description: Search, browse, and retrieve official Lucide vector icons (1,800+ icons across 42 categories). Use whenever designing UI, adding icons, selecting the right icon for a feature, or finding Lucide React component imports and raw SVG markup.
---

# Lucide Icons (Official Icon Directory)

Lucide is a beautiful & consistent open-source vector icon family with over 1,800 icons, perfectly balanced for modern web and mobile applications (React, Vue, Svelte, Tailwind, and shadcn/ui).

## When to Use This Skill
- Choosing the right icon for any button, navigation bar, alert, dashboard metric, card, or action.
- Looking up exact component names and imports for `lucide-react` (e.g. `import { ArrowRight, Bell, Check } from 'lucide-react'`).
- Finding raw SVG strings to embed directly in HTML, JSX, canvas, or templates.
- Exploring icon alternatives and synonyms (e.g. searching for "edit", "trash", "settings", "user", "shopping", "heart").

## CLI Search Tool

Run the bundled search script:
```bash
node .agents/skills/lucide-icons/scripts/search.mjs "<query>" [options]
```

Options:
- `--category "<name>"` : Filter by category (e.g. arrows, communication, finance, navigation, weather)
- `--react` : Print `lucide-react` import snippet
- `--svg` : Print raw SVG markup
- `--max <N>` : Number of results to display (default: 8)
- `--list-categories` : List all 42 categories

Examples:
- Search icons: `node .agents/skills/lucide-icons/scripts/search.mjs "notification"`
- Get React snippet: `node .agents/skills/lucide-icons/scripts/search.mjs "dashboard" --react`
- Get SVG: `node .agents/skills/lucide-icons/scripts/search.mjs "check" --svg`
- Filter by category: `node .agents/skills/lucide-icons/scripts/search.mjs "arrow" --category "arrows"`

## In React / Vite Applications
In this repository, `lucide-react` is installed:
```tsx
import { Search, Bell, Settings, User } from 'lucide-react';

export function Header() {
  return (
    <div className="flex items-center gap-4">
      <Search className="w-5 h-5 text-gray-500" />
      <Bell className="w-5 h-5 text-gray-500 hover:text-gray-900 cursor-pointer" />
    </div>
  );
}
```
