# Testing

## Why Dual Jest Configurations?

Jest has limited support for native ES modules. Since the plugin system uses dynamic imports to load ESM plugins at runtime, we need to test true ESM module loading. We achieve this using **Jest with two separate configurations**:

### Standard Jest (`npm run test:unit`)
- Config: `jest.config.js`
- Tests: `src/**/*.test.ts` (excluding `*.esm.test.ts`)
- Fast unit tests with mocking for core logic and validation

### Jest ESM Mode (`npm run test:esm`)  
- Config: `jest.config.esm.mjs`
- Tests: `src/**/*.esm.test.ts`
- Flag: `NODE_OPTIONS=--experimental-vm-modules`
- Tests native ESM plugin loading with actual `export default` syntax

The `--experimental-vm-modules` flag enables Jest to properly execute ES modules, allowing us to test ESM plugins with production-like behavior while keeping a consistent testing framework.

## Test Fixtures

Pre-built plugins in `test-fixtures/` simulate real-world plugin deployment:

- **plugin-esm/** - True ESM with `"type": "module"` and native `export default`
- **plugin-cjs/** - Pure CommonJS with `module.exports`
- **plugin-invalid/** - Invalid manifest for error handling tests

Fixtures are pre-built (not source) to test the actual loading mechanism without circular dependencies on `@augment/builder`.

## Running Tests

```bash
npm test              # Run all tests
npm run test:unit     # Standard Jest only
npm run test:esm      # ESM integration tests only
npm run test:watch    # Watch mode
```
