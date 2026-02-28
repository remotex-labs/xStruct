# Contributing to xStruct

Thank you for considering contributing to xStruct! This document outlines the process for contributing to
the project and provides guidelines to make the process smooth for everyone involved.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct.
Please be respectful, inclusive, and considerate when interacting with other contributors.

## Development Workflow

### Setting Up Your Environment

The project uses TypeScript and requires Node.js (20+). After installing dependencies, you can:

- Run tests: `npm test`
- Build the project: `npm run build -- -w`
- Run linting: `npm run lint`

### Making Changes

1. Make your changes in your feature branch
2. Add or update tests as necessary
3. Ensure all tests pass and lint checks succeed
4. Update documentation if relevant
5. Commit your changes with clear, descriptive commit messages

### Commit Message Guidelines

Follow these best practices for commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:

```text
string.matcher: Add `toMatchPattern()` matcher

This new matcher allows testing against regular expression patterns
with detailed error output. Supports both string and RegExp objects.

Fixes #123
```

## Pull Request Process

1. **Update your fork** with the latest changes from the main repository

```shell script
git remote add upstream https://github.com/remotex-labs/xStruct.git
git fetch upstream
git rebase upstream/main
```

1. **Push your changes** to your fork

```shell script
git push origin feature/your-feature-name
```

1. **Submit a pull request** to the main repository
    - Provide a clear title and description
    - Reference any related issues
    - Explain what your changes do and why they should be included

2. **Address review feedback**
    - Respond to comments and make requested changes
    - Push additional commits to your branch as needed
    - The maintainers may ask for changes before merging

## Testing

Every new feature or bug fix should include appropriate tests:

- Unit tests for new matchers or utilities
- Integration tests for complex functionality
- Edge case tests for potential issues

Run the test suite to ensure your changes don't break existing functionality:

```shell script
npm test
```

For thorough testing, you can also run:

```shell script
npm run test:coverage
```

## Documentation

When adding new features, please update the relevant documentation:

- Add TSDoc comments to all public APIs
- Update README.md if necessary
- Add examples showing how to use the new functionality
- Update the documentation site when adding major features

Documentation follows the TSDoc standard and is built using VitePress.

## Types and Type Safety

xStruct is built with TypeScript, and we place a high value on type safety:

- All public APIs should have explicit type annotations
- Generic types should be used where appropriate
- Type guards should be implemented when necessary
- Run `npm run typecheck` to verify type correctness

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality
- PATCH version for backwards-compatible bug fixes

## Release Process

Releases are managed by the core maintainers. The general process is:

1. Finalize and merge all changes for the release
2. Update version in package.json
3. Update CHANGELOG.md
4. Create a tagged release
5. Publish to npm

## Questions?

If you have questions about contributing, please:

- Open an issue for general questions
- Contact the maintainers for sensitive matters
- Join our community discussions (links in README)

Thank you for contributing to xStruct!
