# Agent Safe & Rigorous Engineering Guidelines

1. **Security & Quality First**:
   - Adhere strictly to the Principle of Least Privilege and Deny-By-Default.
   - Never bypass security dialogs, approvals, confirmation prompts, or access controls.
   - Never hardcode secrets, passwords, or fallback credentials in source code.
   - Never push or deploy changes to production or merge into main without explicit owner approval.

2. **Rigorous Verification & Self-Correction**:
   - Run typecheck, builds, and automated unit/integration tests for every modification.
   - When errors or test failures occur, diagnose root causes and patch them properly without disabling or weakening tests.

3. **Production Data & Privacy Protection**:
   - Never modify or delete live production data or user records.
   - Maintain zero mock, SAMPLE, or synthetic data in production code paths.
   - Rely solely on verified, server-authoritative databases and APIs.

4. **Core Knowledge Base & Compounding Memory (llm-wiki - مهارة أساسية)**:
   - `llm-wiki` is a CORE and foundational skill for this agent.
   - Proactively consult, build, and maintain the project's compounding knowledge base following the 3-layer architecture (Raw Sources -> Wiki -> Schema, with Ingest, Query, and Lint operations).
   - Ground architectural designs, domain modeling, technical decisions, and multi-session memory using the local LLM Wiki MCP server (`llm-wiki`) and HTTP API (http://127.0.0.1:19828).
   - Treat project documentation, concepts, and entity links as a living wiki graph rather than disconnected text files.

5. **UI/UX & Design Intelligence**:
   - Utilize the `ui-ux-pro-max` skill (located in `.agents/skills/ui-ux-pro-max/` and globally in `~/.gemini/config/skills/`) whenever designing, building, improving, or reviewing UI/UX, layouts, color palettes, typography, accessibility, and frontend components.

6. **Security Testing & Penetration Audits (Strix)**:
   - Utilize Strix CLI (`strix`) and the installed security skills (`penetration-testing-with-strix`, `find-security-vulnerabilities-in-code`, `api-security-testing`, `web-app-penetration-testing`, `owasp-top-10-testing`, etc.) whenever testing, auditing, scanning for vulnerabilities, or reviewing code and API security.

7. **Free Developer Services & Infrastructure (free-for-dev)**:
   - Utilize the `free-for-dev` skill (located in `.agents/skills/free-for-dev/` and globally in `~/.gemini/config/skills/free-for-dev/`) and search script (`node .agents/skills/free-for-dev/scripts/search.mjs "<query>"`) whenever the user asks for free cloud services, databases, hosting, APIs, authentication, storage, or zero-cost architecture recommendations.

8. **Public APIs & Data Integrations (public-apis)**:
   - Utilize the `public-apis` skill (located in `.agents/skills/public-apis/` and globally in `~/.gemini/config/skills/public-apis/`) and search script (`node .agents/skills/public-apis/scripts/search.mjs "<query>"`) whenever the user asks for public APIs, external data sources, free APIs, mock APIs, weather/finance/crypto/maps data, or third-party integrations.

9. **Lucide Icons & Vector Assets (lucide-icons)**:
   - Utilize the `lucide-icons` skill (located in `.agents/skills/lucide-icons/` and globally in `~/.gemini/config/skills/lucide-icons/`) and search script (`node .agents/skills/lucide-icons/scripts/search.mjs "<query>" --react`) whenever selecting, searching, or importing icons in React (`lucide-react`), HTML, or raw vector SVG.

10. **Live Documentation & Library Context (Context7 / ctx7)**:
    - Utilize Context7 (`find-docs`, `context7-cli`, `context7-mcp`) and the CLI (`npx ctx7@latest library <name> "<query>"` / `npx ctx7@latest docs <id> "<query>"`) whenever fetching up-to-date documentation, API signatures, framework guides, or verifying library syntax.

11. **Book & Document Knowledge Extraction (book-to-skill)**:
    - When converting books, technical manuals, or documents (PDF, EPUB, DOCX, Markdown, HTML, RTF) into structured agent skills, frameworks, mental models, and actionable knowledge bases, utilize the `book-to-skill` skill (`.agents/skills/book-to-skill/`) and CLI (`book-to-skill <path-to-document>`).
