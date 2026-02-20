# Project Structure

This document explains the organization of the Moduul plugin system monorepo.

## Directory Layout

```
node-plugins/
├── packages/               # Published npm packages
│   ├── core/              # @moduul/core - Plugin host system
│   │   ├── src/           # Source code
│   │   ├── dist/          # Built output
│   │   └── test-fixtures/ # Pre-built plugins for testing the host
│   │       ├── plugin-esm/      (Step 9.5)
│   │       ├── plugin-cjs/      (Step 9.5)
│   │       └── plugin-dual/     (Step 9.5)
│   │
│   ├── builder/           # @moduul/builder - CLI build tool
│   │   ├── src/           # Source code
│   │   ├── bin/           # CLI entry point
│   │   ├── dist/          # Built output
│   │   └── test-fixtures/ # Source plugins for testing the builder
│   │       └── simple-plugin/   # Basic TypeScript plugin
│   │
│   └── boilerplate/       # @moduul/boilerplate - Official template (Step 13)
│       ├── src/
│       └── plugin.manifest.json
│
├── examples/              # User-facing demonstration plugins
│   ├── README.md
│   ├── hello-world/       # Minimal working plugin (Step 13)
│   └── advanced-plugin/   # Complex plugin example (future)
│
└── tests/                 # E2E integration tests (Step 14)
    └── e2e.test.ts
```

## Purpose of Each Directory

### `packages/core/test-fixtures/`
**Purpose:** Pre-built plugins in various formats for testing the PluginHost.
**Contents:** Compiled JavaScript plugins with manifests.
**Used by:** Core integration tests to verify plugin loading, hot-reloading, format support.

### `packages/builder/test-fixtures/`
**Purpose:** Source code plugins for testing the builder.
**Contents:** TypeScript source files that the builder compiles.
**Used by:** Builder tests to verify compilation, bundling, minification.

### `packages/boilerplate/`
**Purpose:** Official template package that users can install or copy.
**Contents:** Complete plugin project structure with TypeScript, manifest, build scripts.
**Used by:** New plugin projects, scaffolding commands (Step 17).

### `examples/`
**Purpose:** User-facing example plugins demonstrating features.
**Contents:** Complete, documented plugin projects.
**Used by:** Documentation, tutorials, reference implementations.

### `tests/`
**Purpose:** End-to-end integration tests.
**Contents:** Tests that build plugins and load them with the host.
**Used by:** CI/CD validation of the complete system.

## Why This Structure?

1. **Test fixtures live with their tests** - Builder fixtures test the builder, core fixtures test the core
2. **Clear separation** - Test code vs. user-facing examples
3. **Maintainable** - Easy to understand what each directory is for
4. **Scalable** - Room to add more examples, fixtures, packages
5. **Standard** - Follows monorepo best practices
