# KIUR Ollama Team

This team produces planning and review advice only. Codex remains responsible for all file edits, security decisions, and verification.

Run from PowerShell:

```powershell
.\ollama-team\Invoke-OllamaTeam.ps1 -Task "Describe the requested change" -ContextFiles @("src/example.tsx")
```

Use `-LocalOnly` to avoid all cloud quota usage. The verified cloud agent runs sequentially and automatically falls back to `kiur-local:latest` when unavailable. Files that may contain credentials or database data are rejected. Never add a model to `allowed_models` until it has completed a free-plan smoke test without requesting payment or an upgrade.
