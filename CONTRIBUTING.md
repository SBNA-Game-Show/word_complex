# Contributing to Word Complex

This is the entry point for all contributors and AI agents. Read this before touching any code.

---

## Rules

- Never commit directly to `main` or `development`.
- Always branch off `development` for new work.
- All changes go through a PR from your child branch → `development` → `main`.
- Do not add AI agent files (`CLAUDE.md`, `AGENTS.md`, etc.) to the repo.
- Do not add AI co-author attribution to commits.

---

## Documentation Update Rule

**Whenever you change something in the codebase, you must update the relevant section in `README.md` or `server/README.md` before committing.**

This applies to:

| Type of Change | What to Update |
|---------------|----------------|
| New API route added or removed | `server/README.md` → API Routes table |
| New game module added | `README.md` → Games section, `server/README.md` → Structure + API Routes |
| Port or URL changed | `README.md` → Getting Started, `server/README.md` → Running Locally |
| New npm package added | `README.md` → Tech Stack (if significant) |
| New test file added | `server/README.md` → Testing section |
| MongoDB collection or field changed | `README.md` → MongoDB section, `server/README.md` → Data Flow |
| New middleware added or wired up | `server/README.md` → Structure + relevant route in API Routes table |
| Environment variable added | `server/README.md` → Notes section |
| Any file moved or renamed | Update the path references in whichever README mentions it |

**AI agents working on this project must follow this rule too** — every code change must be accompanied by the corresponding README update in the same session.

Full git workflow and commands: [`docs/Git-Repo-Rules-and-Commands.md`](docs/Git-Repo-Rules-and-Commands.md)

---

## Architecture

- Simple overview: [`docs/simple-game-architecture.svg`](docs/simple-game-architecture.svg)
- Full architecture: [`docs/complex-game-architecture.svg`](docs/complex-game-architecture.svg)
- Standardization rules: [`docs/V2-Zatam standardization rules.docx`](docs/V2-Zatam%20standardization%20rules.docx)

---

## Feature Reference

| Area | File |
|---|---|
| Client-side features | [`documentation/client_side_features.json`](documentation/client_side_features.json) |
| Backend features | [`documentation/backend_features.json`](documentation/backend_features.json) |
| Common commands | [`documentation/commands_used.json`](documentation/commands_used.json) |
| Running locally with Docker | [`documentation/steps_to_run_project_using_docker.json`](documentation/steps_to_run_project_using_docker.json) |
| Viewing DB inside Docker | [`documentation/viewing_db_inside_docker.json`](documentation/viewing_db_inside_docker.json) |
