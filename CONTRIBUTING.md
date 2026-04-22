# Contributing to xStruct

Thank you for your interest in contributing to this project!  
Your contributions — whether they are bug fixes, new features, documentation improvements,  
or optimizations — are highly valued. This guide will help you contribute effectively.

---

## Code of Conduct

By participating, you agree to abide by the
[Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).  
Be respectful, inclusive, and constructive in all discussions, pull requests, and code reviews.

---

## How to Contribute

### Reporting Issues

1. Check the [issues page](https://github.com/remotex-labs/xStruct/issues) for existing reports.
2. If it doesn’t exist, open a new issue with:
    - **Description:** What went wrong or needs improvement.
    - **Steps to Reproduce:** Minimal steps to reproduce the issue.
    - **Environment:** Node.js version, OS, project version.
    - **Expected vs. Actual Behavior**
    - **Screenshots / Logs:** Optional.

### Suggesting Features

1. Open a new issue labeled `enhancement`.
2. Describe the feature, the problem it solves, and provide examples if possible.
3. Optionally suggest implementation ideas.

### Commit Message Guidelines

- Use **present tense** ("add feature" not "added feature").
- Use **imperative mood** ("fix bug" not "fixes bug").
- Limit the first line to **72 characters or fewer**.
- Reference issues and pull requests after the first line when relevant.

### Submitting Pull Requests

1. Fork the repo and create a branch:

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. Make your changes.
3. Ensure your code passes linting and tests:

    ```bash
    npm run lint
    npm run test
    ```

4. Rebase or sync with the latest `main` branch:

    ```bash
    git fetch upstream
    git rebase upstream/main
    ```

5. Submit a PR describing:
    - What changes you made
    - Why you made them
    - Any potential impact on other modules

> **Tip:** Small, focused PRs are easier to review and merge.

---

## Coding Guidelines

- Use **TypeScript** with strong typing.
- Follow **TSDoc conventions** for interfaces, types, and functions.
- Keep functions **pure and testable** where possible.
- Prefer **immutable updates**.
- Use **clear and consistent naming**.

---

## Testing

- Use **xJet** for unit testing.
- Example:

    ```ts
    describe('getAllMarkdownFilesRelative', () => {
        const mockReaddirSync = xJet.mock(readdirSync);

        beforeEach(() => {
            mockReaddirSync.mockReset();
        });

        test('should return empty array when no markdown files exist', () => {
            mockReaddirSync.mockReturnValueOnce([{ name: 'file.txt', isFile: () => true, isDirectory: () => false }]);
            expect(getAllMarkdownFilesRelative('/root')).toEqual([]);
        });
    });
    ```

- Cover **edge cases** for versioning, navigation, and sidebar parsing.

---

## Documentation

- Add **TSDoc comments** for public APIs.
- Update `README.md` if needed.
- Update `docs`  if needed.
- Include usage examples.
- Update the **VitePress docs** for major features.  
  Documentation should follow [TSDoc standards](https://tsdoc.org/).

---

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: incompatible API changes
- **MINOR**: backwards-compatible features
- **PATCH**: backwards-compatible bug fixes

---

## Questions?

- Open an **issue** for general questions.
- Contact maintainers for sensitive matters.
- Join community discussions (links in README).

Thank you for contributing to **@remotex-labs/xStruct**! 🎉
