# Examples

This directory contains example plugins demonstrating various features and use cases of the Moduul plugin system.

## Structure

- `hello-world/` - Minimal working plugin (to be added in Step 13+)
- `advanced-plugin/` - Complex plugin with dependencies (to be added later)

Each example can be built using `@moduul/builder` and loaded using `@moduul/core`.

## Usage

```bash
cd hello-world
npm install
npm run build
```

Then load the built plugin using the core host.
