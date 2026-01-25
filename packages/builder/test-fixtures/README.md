# Test Fixtures

This directory contains test plugins used for validating the builder functionality.

## Structure

- `simple-plugin/` - Basic TypeScript plugin with default export
- `with-dependencies/` - Plugin with npm dependencies (to be added)

These fixtures are used in builder tests to ensure:
- TypeScript compilation works
- Bundling produces valid output
- Minification works correctly
- Sourcemaps are generated
- Dependencies are handled properly
