# Automated code quality

Darukae uses **local git hooks** and **GitHub Actions** so formatting and lint errors are caught before merge.

## Tools

| Tool               | Scope                      | Purpose                                  |
| ------------------ | -------------------------- | ---------------------------------------- |
| **Husky**          | Git hooks                  | Runs checks on every commit              |
| **lint-staged**    | Staged files only          | Fast pre-commit feedback                 |
| **Prettier**       | JS/JSX/CSS/JSON/Markdown   | Consistent formatting                    |
| **ESLint**         | `frontend/src`             | React/JS lint rules (`--max-warnings=0`) |
| **Ruff**           | `backend/**/*.py`          | Python lint + format                     |
| **pytest**         | `backend/tests`            | API/integration tests (PostGIS in CI)    |
| **GitHub Actions** | `.github/workflows/ci.yml` | Same checks on push/PR                   |

## Pre-commit (required for development)

From the repository root:

```bash
git init          # once
npm install       # installs Husky via "prepare"
npm install --prefix frontend
```

Hook file: `.husky/pre-commit` → `npx lint-staged`

### What lint-staged runs

| Staged paths                         | Commands                          |
| ------------------------------------ | --------------------------------- |
| `frontend/**/*.{js,jsx,css,json,md}` | Prettier write                    |
| `docs/**/*.md`, `README.md`          | Prettier write                    |
| `frontend/**/*.{js,jsx}`             | ESLint                            |
| `backend/**/*.py`                    | `ruff check --fix`, `ruff format` |

If any step fails, the commit is blocked until fixes are applied.

## Manual commands (match CI)

```bash
npm run quality      # Prettier check + ESLint + Ruff check + Ruff format check
npm run test:backend # pytest (uses SQLite locally; CI uses PostGIS service)
npm run quality:ci   # quality + pytest
```

Individual scripts:

```bash
npm run format       # auto-fix Prettier
npm run format:check
npm run lint
npm run ruff
npm run ruff:format
```

## Continuous integration

Workflow: **`.github/workflows/ci.yml`**

1. **code-quality** — Prettier, ESLint, Ruff (same as local `npm run quality`)
2. **backend** — `pytest` with PostGIS service container
3. **frontend** — production Vite build

Runs on every **push** and **pull request** to `main` / `master`.

## Configuration files

| File                        | Role                                        |
| --------------------------- | ------------------------------------------- |
| `lint-staged.config.mjs`    | Pre-commit staged-file rules                |
| `package.json`              | npm scripts, Husky `prepare` hook           |
| `.prettierrc.json`          | Prettier options                            |
| `frontend/eslint.config.js` | ESLint flat config                          |
| `backend/pyproject.toml`    | Ruff rules (incl. FastAPI-friendly ignores) |

## Why this supports platform stability

- **Formatting** avoids noisy diffs and review fatigue.
- **Lint** catches common bugs (hooks, unused code, import issues).
- **Tests** guard auth, projects, GeoJSON, and analytics APIs.
- **CI** enforces the same bar for all contributors without relying on local hook installs alone.
