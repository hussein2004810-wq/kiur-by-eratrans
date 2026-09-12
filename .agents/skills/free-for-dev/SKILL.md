---
name: free-for-dev
description: Search, browse, and recommend free services, free-tier cloud hosting, databases, APIs, authentication, storage, AI models, monitoring, and developer tools from the free-for-dev database (1,300+ free developer tools). Use whenever the user asks for free tiers, free hosting, free databases, alternative tools, cost optimization, or zero-cost infrastructure for their project.
---

# Free for Dev (Developer Free Tiers & Services)

A comprehensive curated directory of 1,300+ SaaS, PaaS, IaaS, APIs, databases, hosting, and developer tools offering permanent free tiers for developers.

## When to Use This Skill
- Finding free database hosting (PostgreSQL, MySQL, Redis, Vector DBs, MongoDB, SQLite).
- Finding free web, serverless, and container hosting (Vercel, Render, Fly.io, Cloudflare, GitHub Pages).
- Selecting free authentication and user management (Supabase, Firebase, Clerk, Auth0, Kinde).
- Finding free transactional email, SMS, push notifications, or webhooks.
- Finding free storage, CDN, media processing, or S3-compatible buckets.
- Finding free monitoring, error tracking, APM, or logging (Sentry, PostHog, Grafana Cloud).
- Designing zero-cost architectures for MVPs, prototypes, startups, or personal projects.

## How to Query & Search

### Option 1: Search CLI (Node.js)
```bash
node .agents/skills/free-for-dev/scripts/search.mjs "<query>" [--category "<name>"] [--max <N>]
```

Examples:
- Search databases: `node .agents/skills/free-for-dev/scripts/search.mjs "postgres"`
- Search auth: `node .agents/skills/free-for-dev/scripts/search.mjs "authentication"`
- Search hosting: `node .agents/skills/free-for-dev/scripts/search.mjs "hosting" --max 15`
- List all categories: `node .agents/skills/free-for-dev/scripts/search.mjs --list-categories`

### Option 2: Inspect Directly
- Structured JSON: `.agents/skills/free-for-dev/data/free-for-dev.json`
- Full Markdown: `.agents/skills/free-for-dev/references/free-for-dev.md`
