# Contributing to Eira

First off, thanks for taking the time to contribute! Eira is built to help people, and we appreciate any help in making it better.

## Our Philosophy: Test-First
We follow a strict Test-Driven Development (TDD) workflow. It might feel a bit slower at first, but it ensures that every feature is reliable and every bug is squashed for good.

### The TDD Cycle
1. **RED**: Start by writing a failing test for the feature or bug you're working on.
2. **GREEN**: Write the minimal amount of code needed to make that test pass.
3. **REFACTOR**: Clean up your code while making sure the tests stay green.

## Getting Started
1. Fork the repo and create your branch from `main`.
2. Follow the setup instructions in the [README](README.md).
3. Make sure all existing tests pass:
   ```bash
   cd backend && npm test
   ```

## Pull Request Guidelines
- **Focus**: Keep your PRs small and focused on one thing.
- **Tests**: Every new feature or fix must have corresponding tests.
- **Docs**: If you change how something works, update the documentation.
- **Style**: We use TypeScript for the frontend to keep things predictable. Please stick to the existing patterns.

## Questions?
If you're unsure about anything, just open an issue or reach out. We're happy to help you get started!
