# Git Repo Rules and Commands

This document defines the branching workflow for this project. All contributors and AI agents must follow these rules.

---

## Branch Structure

- `main` — production-ready code only. Never commit directly to this branch.
- `development` — integration branch. All child branches are created from here and merged back here via PR.
- `my-child-branch` — feature/task branches. Always branch off `development`.

---

## Making a New Branch

Always branch off `development`, not `main`.

**Option 1:**
```bash
git checkout development
git checkout -b my-child-branch
git switch my-child-branch
```

**Option 2:**
```bash
git checkout development
git switch -c my-child-branch
```

---

## Syncing Your Child Branch with Remote Development

Before working, always pull the latest `development` into your branch to avoid conflicts.

```bash
git switch development
git pull
git switch my-child-branch
git merge development
```

---

## Pushing to a New Remote Child Branch (first push)

```bash
git add .
git commit -m "Add new feature"
git push -u origin my-child-branch
```

---

## Pushing to an Existing Child Branch

```bash
git add .
git commit -m "Add new feature"
git push
# or, if no tracking relationship is set:
git push origin my-child-branch
# To check tracking: git branch -vv
```

---

## Rules for AI Agents

- Never commit or push directly to `main` or `development`.
- Always branch from `development` for any new work.
- Pull from `development` before starting work to stay in sync.
- Do not force push (`--force`) to shared branches.
- Do not add `Co-Authored-By: Claude` or any AI agent attribution to commits.
- Do not create or commit `CLAUDE.md`, `AGENTS.md`, or any AI configuration files to the repo.
