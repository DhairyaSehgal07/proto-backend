# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.2](https://github.com/DhairyaSehgal07/ColdOp-backend/compare/v0.1.1...v0.1.2) (2025-11-06)

### ### Added

- add cold storage CRUD API with validation and error handling ([bf8e29a](https://github.com/DhairyaSehgal07/ColdOp-backend/commit/bf8e29a533026822ea668dc9973c7b6683a6b47e))

### 0.1.1 (2025-11-06)

### ### Changed

- Initialise project ([b4fb572](https://github.com/DhairyaSehgal07/ColdOp-backend/commit/b4fb572eeef7a76dc5c6dcd0e896c9f3c07da942))
- setup development tooling and configuration ([838c65e](https://github.com/DhairyaSehgal07/ColdOp-backend/commit/838c65ee59e2e07243e5e06a2ceb5d8d88bc1a6c))

### ### Fixed

- resolve ESLint errors and configure strict type checking rules ([c27449c](https://github.com/DhairyaSehgal07/ColdOp-backend/commit/c27449ce5d425c312858c3e45e6f7f22b710d1f9))

### ### Added

- **schema:** define Prisma schema with core data models ([e9382d2](https://github.com/DhairyaSehgal07/ColdOp-backend/commit/e9382d2a11546eea765790a731bbadc51c034b25))

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
