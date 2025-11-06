# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-XX-XX

### Added

- Initial project setup with `package.json`
- Project configuration for Fastify + Prisma + TypeScript stack
- ES module support (`type: "module"`)
- Package manager configuration (pnpm@10.18.3)
- Project metadata and basic structure
- Production-level Husky setup for Git hooks
- Pre-commit hook with lint-staged for code quality checks
- Commit-msg hook with Commitlint for conventional commit messages
- Pre-push hook for running tests before pushing
- Commitlint configuration with conventional commit standards
- Lint-staged configuration for staged file checks
- `.gitignore` file with standard Node.js exclusions
- Prettier configuration with production-level settings
- `.prettierrc` and `.prettierignore` files
- VS Code settings for automatic format on save
- Prettier integration with lint-staged for pre-commit formatting
- Production-level ESLint configuration with TypeScript support
- ESLint flat config (`eslint.config.js`) using ESLint 9
- Integration with TypeScript ESLint parser and plugin
- ESLint-Prettier integration to avoid conflicts
- Comprehensive ESLint rules for code quality and best practices
- ESLint auto-fix on save in VS Code
- ESLint integration with lint-staged for pre-commit checks
- Production-level Jest configuration for testing
- Jest setup with TypeScript and ES module support
- TypeScript configuration (`tsconfig.json`) for type-aware linting
- Test scripts for development, watch mode, coverage, and CI
- Coverage thresholds set to 80% for branches, functions, lines, and statements
- Example test suite demonstrating Jest usage
- Jest integration with pre-push Git hook
- VS Code Jest settings for test runner integration

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

---

[0.1.0]: https://github.com/DhairyaSehgal07/cold-op-backend/releases/tag/v0.1.0
