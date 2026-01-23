# Implementation Plan: Augment Plugin System

This document outlines the granular step-by-step plan to implement the `@augment` monorepo. Each step is focused on a specific component, testable in isolation, and safe for iterative AI development.

## Phase 1: Foundation & Setup

### Step 1: Monorepo Root Setup
**Description:** Initialize the directory structure, configure NPM workspaces, set up the root `package.json`, and create the base `tsconfig.json`.
**Validation:**
- `npm install` runs successfully.
- `packages/` folder exists.
**AI Prompt:**
> Task: Initialize the `@augment` monorepo structure.
> 1. Create root `package.json` with workspaces `packages/*`.
> 2. Create `tsconfig.base.json` with `strict: true` and `declaration: true`.
> 3. Configure `eslint` and `prettier` (create config files).
> 4. Create empty `packages/core` and `packages/builder` folders.

### Step 2: Core Package Skeleton
**Description:** Initialize `@augment/core` with its own `package.json` and test setup.
**Validation:**
- `packages/core/package.json` has `main` pointing to `dist/index.js`.
- `npm test` in `packages/core` runs a sample passing test.
**AI Prompt:**
> Task: Initialize `@augment/core`.
> 1. Create `packages/core/package.json` (name: `@augment/core`).
> 2. Create `packages/core/tsconfig.json` extending base.
> 3. Install `jest` (and `@types/jest`, `ts-jest`) as devDependencies in the workspace.
> 4. Create a dummy test `src/index.test.ts` to verify test runner configuration.

### Step 3: Builder Package Skeleton
**Description:** Initialize `@augment/builder` with its own `package.json`.
**Validation:**
- `packages/builder/package.json` exists.
- `packages/builder/bin/augment-builder` exists and is executable.
**AI Prompt:**
> Task: Initialize `@augment/builder`.
> 1. Create `packages/builder/package.json`.
> 2. Create `packages/builder/tsconfig.json` extending base.
> 3. Create `bin/augment-builder.ts` with a simple `console.log("Builder CLI")`.

---

## Phase 2: Core Logic (`@augment/core`)

### Step 4: Shared Types & Interfaces
**Description:** Define the `PluginManifest`, `PluginHostOptions` and `Plugin` interfaces.
**Validation:**
- `packages/core/src/types.ts` exports `PluginManifest` and `PluginHostOptions`.
**AI Prompt:**
> Context: `PRODUCT_REQUIREMENTS.md` (Section 7).
> Task: Define Core types in `@augment/core`.
> 1. Create `src/types.ts`.
> 2. Export `PluginManifest` (name, version, entryPoint, meta).
> 3. Export `PluginHostOptions` (folder, validator).

### Step 5: Directory Scanner
**Description:** Implement logic to find plugin **folders** in a given path.
**Validation:**
- Unit test mocks filesystem, ensures folders with `plugin.manifest.json` are returned, others ignored.
**AI Prompt:**
> Context: `PRODUCT_REQUIREMENTS.md` (Section 6.1).
> Task: Implement `PluginScanner` (Directory support ONLY) in `@augment/core`.
> 1. Create `src/scanner.ts`.
> 2. Implement `scanDirectories(rootPath: string): Promise<string[]>`.
> 3. It should check for existence of `plugin.manifest.json`.
> 4. Write `test/scanner.test.ts` mocking `fs/promises`.
 
### Step 6: Manifest Parser (JSON)
**Description:** Implement reading and validating the JSON file.
**Validation:**
- Unit test passes valid JSON.
- Unit test fails for missing `entryPoint` or `name`.
**AI Prompt:**
> Context: `PRODUCT_REQUIREMENTS.md` (Section 5.2).
> Task: Implement `ManifestParser` in `@augment/core`.
> 1. Create `src/manifest.ts`.
> 2. Function `readManifest(path: string): Promise<PluginManifest>`.
> 3. Validate required fields (`name`, `version`, `entryPoint`).
> 4. Throw custom errors for invalid schema.
> 5. Add unit tests.

### Step 7: ZIP Archive Support via Extraction
**Description:** Enhance Scanner to find `.zip` files and extract them to a temp folder.
**Validation:**
- Unit tests using a real mock `.zip` file verify it extracts to a tmp dir and returns that path.
**AI Prompt:**
> Context: `PRODUCT_REQUIREMENTS.md` (Section 6.1).
> Task: Add ZIP support to `@augment/core`.
> 1. Install `adm-zip` (promisify it if needed) or `yauzl`.
> 2. Update `PluginScanner` to also look for `.zip` files.
> 3. Implement extraction logic: unzip to `os.tmpdir() + /augment-cache`.
> 4. Ensure `scan()` returns these temp paths transparently.

### Step 8: PluginHost Registry Logic
**Description:** The state management of the Host (Registry, `getAll`, `find`). No loading yet.
**Validation:**
- Can instantiate `PluginHost`.
- `reload()` scans and populates registry (mocked paths).
**AI Prompt:**
> Context: `PRODUCT_REQUIREMENTS.md` (Section 7.2).
> Task: Implement `PluginHost` state logic.
> 1. Create `src/host.ts`.
> 2. Constructor accepts `options`.
> 3. `reload()` calls Scanner, then Parser for each path.
> 4. Store valid results in `private plugins: Map<string, PluginWrapper>`.
> 5. Implement `getAll()` and `find()`.

### Step 9: Dynamic Import & Cache Busting
**Description:** Implement the ESM `import()` logic to actually load the code.
**Validation:**
- Unit tests verify scanner/parser integration and error handling.
- Full integration tests will be added in Step 9.5 with proper fixtures.
**AI Prompt:**
> Context: `PRODUCT_REQUIREMENTS.md` (Section 6.4).
> Task: Implement Loading in `PluginHost`.
> 1. In `reload()`, after parsing manifest, call `import()`.
> 2. Use `pathToFileURL()` to convert paths to file:// URLs.
> 3. Append `?t={timestamp}` via URL searchParams for cache busting.
> 4. Handle import errors (log & skip).
> 5. If `options.validator` is present, validate the loaded module.

### Step 9.5: Test Plugin Fixtures
**Description:** Create real, pre-built test plugins in multiple formats (ESM, CJS, dual) to enable proper integration testing.
**Validation:**
- `packages/core/test-fixtures/` exists with 4 plugin types.
- Each fixture has compiled output and valid manifest.
- New integration tests load real plugins and verify behavior.
**AI Prompt:**
> Task: Create test plugin fixtures for integration testing.
> 1. Create `packages/core/test-fixtures/` directory structure:
>    - `plugin-esm/` - Pure ESM plugin with package.json ("type": "module")
>    - `plugin-cjs/` - Pure CJS plugin with package.json ("type": "commonjs")
>    - `plugin-dual/` - Dual-format with both ESM and CJS outputs
>    - `plugin-invalid/` - Invalid manifest for error testing
> 2. Each fixture should have:
>    - `package.json` with appropriate module type
>    - `plugin.manifest.json` with name, version, entryPoint
>    - Pre-built `dist/` folder with compiled JS
>    - Simple plugin code (e.g., `{ name: 'test', execute: () => 'result' }`)
> 3. Create `src/host.integration.test.ts` using these fixtures:
>    - Test loading ESM plugins
>    - Test loading CJS plugins (if supported)
>    - Test hot-reload with cache busting
>    - Test validator rejection
>    - Test invalid manifest handling
> 4. Add npm script to build fixtures if needed.

### Step 9.6: Dual-Format Build Support
**Description:** Configure `@augment/core` to build both ESM and CJS outputs for maximum compatibility.
**Validation:**
- `packages/core/dist/` contains both `index.js` (ESM) and `index.cjs` (CJS).
- `package.json` exports field provides conditional exports.
- Tests pass with both formats.
**AI Prompt:**
> Task: Add dual-format build to `@augment/core`.
> 1. Update `packages/core/package.json`:
>    - Keep `"type": "module"`
>    - Add `"main": "./dist/index.cjs"`
>    - Add `"module": "./dist/index.js"`
>    - Update `exports` field:
>      ```json
>      "exports": {
>        ".": {
>          "require": "./dist/index.cjs",
>          "import": "./dist/index.js",
>          "types": "./dist/index.d.ts"
>        }
>      }
>      ```
> 2. Add `tsconfig.cjs.json` extending base with `"module": "CommonJS"`.
> 3. Update build script to compile twice:
>    - `tsc --project tsconfig.build.json` (ESM)
>    - `tsc --project tsconfig.cjs.json --outDir dist-cjs` (CJS)
>    - Rename CJS outputs to `.cjs` extension
> 4. Test that both formats can be imported.

---

## Phase 3: Builder Logic (`@augment/builder`)

### Step 10: CLI Implementation
**Description:** Set up `commander` and the `build` command structure.
**Validation:**
- `bin/augment-builder build --help` works.
**AI Prompt:**
> Task: Setup `commander` in `@augment/builder`.
> 1. Install `commander`.
> 2. Define `build` command with options (entry, out).
> 3. Setup basic action handler.

### Step 11: Esbuild Logic
**Description:** Integrate `esbuild` to bundle TS -> JS.
**Validation:**
- Running builder on a test TS file produces bundled JS + Map.
**AI Prompt:**
> Context: `PRODUCT_REQUIREMENTS.md` (Section 6.2).
> Task: Implement `Builder` class.
> 1. Install `esbuild`.
> 2. Run `esbuild.build()` with `bundle: true`, `format: 'esm'`, `sourcemap: true`.
> 3. Ensure dependencies are bundled (except peerDeps).

### Step 12: Artifact Generation
**Description:** Copy manifest, validate it, and optionally ZIP the output.
**Validation:**
- Output folder contains `index.js`, `index.js.map`, and `plugin.manifest.json`.
**AI Prompt:**
> Task: Finalize Build Artifacts.
> 1. Read `plugin.manifest.json` from source.
> 2. Validate it (reuse/copy types).
> 3. Write it to `dist/`.
> 4. Add `--zip` flag to compress `dist/` into `plugin.zip`.

---

## Phase 4: Integration

### Step 13: Boilerplate Package
**Description:** Create `@augment/boilerplate`.
**Validation:**
- `packages/boilerplate` exists and is installable.
**AI Prompt:**
> Task: Create `@augment/boilerplate`.
> 1. Scaffold standard structure (`src/index.ts`, `plugin.manifest.json`).
> 2. Configured to use `@augment/builder`.

### Step 14: End-to-End Test
**Description:** A script that uses the Builder to build the Boilerplate, then uses Core to load it.
**Validation:**
- `npm test:e2e` passes.
**AI Prompt:**
> Task: E2E Verification.
> 1. Create `tests/e2e.test.ts`.
> 2. Build the boilerplate programmatically.
> 3. Load it with `PluginHost`.
> 4. Execute a function from the plugin.

---

## Phase 5: Documentation & Artifacts

### Step 15: Architecture Diagrams (Mermaid)
**Description:** detailed Architecture diagrams using Mermaid.js syntax to visualize the system flow.
**Validation:**
- `ARCHITECTURE.md` exists and renders diagrams in VS Code.
**AI Prompt:**
> Context: `PRODUCT_REQUIREMENTS.md` (Section 2 & 3).
> Task: Create `ARCHITECTURE.md`.
> 1. Create a `graph TD` diagram showing the Class relationship: Host -> Scanner -> Parser -> Registry.
> 2. Create a `sequenceDiagram` showing the `reload()` flow: Discovery -> Manifest Parse -> Dynamic Import -> Cache.
> 3. Create a diagram showing the Package Dependency graph.

### Step 16: Documentation Suite
**Description:** Generate the mandatory READMEs and the Plugin Authoring Guide.
**Validation:**
- `packages/core/README.md` exists.
- `packages/builder/README.md` exists.
- `docs/authoring-guide.md` exists.
**AI Prompt:**
> Context: `PRODUCT_REQUIREMENTS.md` (Section 8.1).
> Task: Generate Project Documentation.
> 1. Write `packages/core/README.md` (Installation, API usage).
> 2. Write `packages/builder/README.md` (CLI usage).
> 3. Create `docs/authoring-guide.md` explaining how to create a plugin from scratch using the boilerplate.
