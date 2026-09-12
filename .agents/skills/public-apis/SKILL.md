---
name: public-apis
description: Search, browse, and recommend free public APIs from the collective public-apis database (1,770+ APIs across 52 categories). Use whenever the user asks for public APIs, external data sources, free APIs, mock APIs, weather/finance/maps/auth/sports/entertainment APIs, or integrations for their web/mobile application.
---

# Public APIs Directory

A curated database of 1,770+ free public APIs for developers across 52 categories, including animals, anime, blockchain, finance, geocoding, machine learning, weather, and more.

## When to Use This Skill
- When looking for free APIs to integrate into an app (e.g. Weather, Geocoding, Currency, Crypto, News, Sports).
- When searching for "No Auth" APIs for quick prototyping, hackathons, or demos without needing an API key.
- When needing browser-friendly APIs that support CORS (`CORS: Yes`).
- When looking for data sources in specific domains (e.g., Health, Government, Books, Food & Drink, Dictionaries).

## How to Query & Search

### Option 1: Search CLI (Node.js)
```bash
node .agents/skills/public-apis/scripts/search.mjs "<query>" [options]
```

Options:
- `--category "<category>"` : Filter by category name (e.g. Finance, Weather, Geocoding)
- `--no-auth` : Only return APIs that require NO API key or OAuth (instant access)
- `--cors` : Only return APIs that support CORS (callable directly from frontend JavaScript)
- `--max <N>` : Number of results to display (default: 10)
- `--list-categories` : Display all 52 categories with count

Examples:
- Search weather APIs: `node .agents/skills/public-apis/scripts/search.mjs "weather"`
- Search free finance APIs with no auth: `node .agents/skills/public-apis/scripts/search.mjs "currency" --no-auth`
- Search frontend-ready geocoding APIs: `node .agents/skills/public-apis/scripts/search.mjs "location" --cors`
- List all categories: `node .agents/skills/public-apis/scripts/search.mjs --list-categories`

### Option 2: Direct Inspection
- Structured JSON: `.agents/skills/public-apis/data/public-apis.json`
- Full Markdown: `.agents/skills/public-apis/references/public-apis.md`
