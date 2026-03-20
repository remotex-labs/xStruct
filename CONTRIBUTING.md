# Contributing to @remotex-labs/xstruct

Thank you for your interest in contributing! Every bug report, documentation fix, and feature addition makes xStruct better for everyone.

## Table of contents

- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Branching](#branching)
- [Commit convention](#commit-convention)
- [Opening a pull request](#opening-a-pull-request)
- [Tree-shaking rules](#tree-shaking-rules)

---

## Ways to contribute

- 🐛 **Bug reports** — open an issue using the Bug Report template
- 💡 **Feature requests** — open an issue using the Feature Request template
- 📝 **Documentation** — typos, unclear examples, missing API docs
- 🔧 **Code** — bug fixes and features. Open an issue first so we can agree on the approach before you write code

---

## Development setup

**Prerequisites**: Node.js ≥ 20, pnpm ≥ 9

### 1. Fork the repository

Click the **Fork** button at the top right of the [xStruct repository](https://github.com/remotex-labs/xStruct) on GitHub. This creates a copy of the repo under your own account.

### 2. Clone your fork

```bash
git clone https://github.com/<your-username>/xStruct.git
cd xStruct
```

### 3. Add the upstream remote

This lets you pull in future changes from the original repo:

```bash
git remote add upstream https://github.com/remotex-labs/xStruct.git
```

Verify you have both remotes:

```bash
git remote -v
# origin    https://github.com/<your-username>/xStruct.git (fetch)
# origin    https://github.com/<your-username>/xStruct.git (push)
# upstream  https://github.com/remotex-labs/xStruct.git (fetch)
# upstream  https://github.com/remotex-labs/xStruct.git (push)
```

### 4. Install dependencies and verify

```bash
pnpm install
pnpm run ci
```

### 5. Keep your fork up to date

Before starting any new work, sync your fork with upstream:

```bash
git checkout master
git fetch upstream
git merge upstream/master
git push origin master
```

---

## Branching

Always create a new branch from an up-to-date `master`.
Never commit directly to `master`.

| Prefix      | Use for                               |
|-------------|---------------------------------------|
| `docs/`     | Documentation only                    |
| `test/`     | Test-only changes                     |
| `chore/`    | Build, CI, tooling                    |
| `bugfix/`   | Bug fixes                             |
| `feature/`  | New features                          |
| `refactor/` | Code changes with no behaviour change |

```bash
git checkout master
git fetch upstream
git merge upstream/master

git checkout -b bugfix/parser-null-sources
```

---

## Commit convention

Commits follow a `<scope>: <description>` format where scope is the affected file or area:

| Scope      | When to use              |
|------------|--------------------------|
| `docs`     | Documentation only       |
| `test`     | Adding or updating tests |
| `chore`    | Build, CI, dependencies  |
| `bugfix`   | Bug fix                  |
| `feature`  | New feature              |
| `refactor` | No behaviour change      |

**Examples:**

```text
parser.component: handle empty sources array without throwing
highlighter.component: add JSX/TSX language support
source.service: fix off-by-one in line position mapping
docs: update SourceService examples in README
chore: upgrade esbuild to 0.21
test: add coverage for empty sourcemap edge case
```

**Rules:**

- Scope is the filename without extension, or a general area (`docs`, `chore`, `test`, `ci`)
- Description is lowercase, no period at the end
- Keep it short — 72 characters max
- Use the body for context if the reason is not obvious:

```text
parser.component: handle empty sources array without throwing

Previously threw when the sourcemap had no sources field.
Now returns null position instead.
```

---

## Opening a pull request

1. Push your branch to your fork:

```bash
git push origin fix/parser-null-sources
```

1. Go to your fork on GitHub and click **Compare & pull request**
2. Make sure the base is set to `remotex-labs/xStruct` → `master`
3. Fill in the PR template
4. Make sure `pnpm run ci` passes locally before requesting review
5. Keep PRs small and focused — one fix or feature per PR

---

## Tree-shaking rules

xStruct ships a tree-shakeable ESM build.
Please keep it that way:

✅ **Do** — named exports only:

```typescript
export { parseStackTrace } from './components/parser.component';
export type { ParsedFrame } from './models/frame.model';
```

❌ **Do not** — default exports or top-level side effects:

```typescript
export default { parseStackTrace, highlightCode };
console.log('parser loaded');
```
