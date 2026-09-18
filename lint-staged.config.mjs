/**
 * Pre-commit checks (via Husky). Staged files only — mirrors `npm run quality` scope.
 */
const eslintStaged = (files) => {
  const relative = files.map((file) => file.replace(/^frontend[/\\]/, ""));
  if (relative.length === 0) {
    return [];
  }
  const quoted = relative.map((path) => `"${path.replace(/"/g, '\\"')}"`).join(" ");
  return [`npm --prefix frontend exec eslint --fix --max-warnings=0 ${quoted}`];
};

export default {
  "frontend/**/*.{js,jsx,css,json,md}": "prettier --write",
  "docs/**/*.md": "prettier --write",
  "README.md": "prettier --write",
  "frontend/**/*.{js,jsx}": eslintStaged,
  "backend/**/*.py": ["ruff check --fix", "ruff format"],
};
