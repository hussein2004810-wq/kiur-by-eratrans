# Agent Autonomous Execution Guidelines

1. **Direct Execution**:
   - Always implement code changes, create files, and execute terminal commands immediately without waiting for confirmation or approval.
   - Bypass manual plan approvals and interactive confirmation dialogs whenever possible.

2. **Self-Correction & Verification**:
   - Autonomously run builds, tests, and syntax checks after making changes.
   - If an error occurs, diagnose and fix it immediately without stopping to ask.

3. **Goal-Oriented**:
   - Complete the entire requested feature or bug fix end-to-end before reporting back to the user.

4. **UI/UX & Design Intelligence**:
   - Utilize the `ui-ux-pro-max` skill (located in `.agents/skills/ui-ux-pro-max/` and globally in `~/.gemini/config/skills/`) whenever designing, building, improving, or reviewing UI/UX, layouts, color palettes, typography, accessibility, and frontend components.

5. **Security Testing & Penetration Audits (Strix)**:
   - Utilize Strix CLI (`strix`) and the installed security skills (`penetration-testing-with-strix`, `find-security-vulnerabilities-in-code`, `api-security-testing`, `web-app-penetration-testing`, `owasp-top-10-testing`, etc.) whenever testing, auditing, scanning for vulnerabilities, or reviewing code and API security.

6. **Free Developer Services & Infrastructure (free-for-dev)**:
   - Utilize the `free-for-dev` skill (located in `.agents/skills/free-for-dev/` and globally in `~/.gemini/config/skills/free-for-dev/`) and search script (`node .agents/skills/free-for-dev/scripts/search.mjs "<query>"`) whenever the user asks for free cloud services, databases, hosting, APIs, authentication, storage, or zero-cost architecture recommendations.

7. **Public APIs & Data Integrations (public-apis)**:
   - Utilize the `public-apis` skill (located in `.agents/skills/public-apis/` and globally in `~/.gemini/config/skills/public-apis/`) and search script (`node .agents/skills/public-apis/scripts/search.mjs "<query>"`) whenever the user asks for public APIs, external data sources, free APIs, mock APIs, weather/finance/crypto/maps data, or third-party integrations.

8. **Lucide Icons & Vector Assets (lucide-icons)**:
   - Utilize the `lucide-icons` skill (located in `.agents/skills/lucide-icons/` and globally in `~/.gemini/config/skills/lucide-icons/`) and search script (`node .agents/skills/lucide-icons/scripts/search.mjs "<query>" --react`) whenever selecting, searching, or importing icons in React (`lucide-react`), HTML, or raw vector SVG.

9. **Live Documentation & Library Context (Context7 / ctx7)**:
   - Utilize Context7 (`find-docs`, `context7-cli`, `context7-mcp`) and the CLI (`npx ctx7@latest library <name> "<query>"` / `npx ctx7@latest docs <id> "<query>"`) whenever fetching up-to-date documentation, API signatures, framework guides, or verifying library syntax.

10. **Book & Document Knowledge Extraction (book-to-skill)**:
    - When converting books, technical manuals, or documents (PDF, EPUB, DOCX, Markdown, HTML, RTF) into structured agent skills, frameworks, mental models, and actionable knowledge bases, utilize the `book-to-skill` skill (`.agents/skills/book-to-skill/`) and CLI (`book-to-skill <path-to-document>`).







