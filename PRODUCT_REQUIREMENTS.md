# Product Requirements Document: Node.js Plugin System

## 1. Product Overview
We are building a robust, TypeScript-native plugin system for Node.js applications. This system enables applications to extend their functionality dynamically by loading external pre-compiled code modules ("plugins"). The system aims to standardize how extensions are created, discovered, loaded, and managed.

**Core Value Proposition:**
- **Standardization:** Defines a strict contract (signature) for extensions.
- **Flexibility:** Supports dynamic loading and reloading of plugins without restarting the host application.
- **Developer Experience:** Provides tooling (builders, boilerplates) to streamline plugin development.
- **Compatibility:** Supports both ESM and CJS environments.

## 2. Architecture
The architecture consists of a host application (consumer) and a set of external plugins (producers).

### High-Level Flow:
1.  **Initialization:** Host app initializes the System with a configuration (Plugin Path, Signature Type).
2.  **Discovery:** The System scans the `Plugin Path` for valid plugin artifacts (Directories or Archives).
3.  **Manifest Parsing:** For each artifact, the System reads a `plugin.manifest` (or similar) to identify the entry point and metadata.
4.  **Loading:** The System imports the entry point.
5.  **Validation:** The loaded module is checked against the expected contract/signature.
6.  **Registry:** Valid plugins are stored in an internal registry.
7.  **Exposure:** The Host App queries the registry to list plugins or execute their exposed functions.
8.  **Lifecycle:** The System handles reloading (updating the registry) and potential error states.

### Plugin Structure (Conceptual):
A plugin is a distributable unit containing:
-   **Manifest:** JSON file defining identification and entry point.
-   **Code:** Compiled JavaScript (CJS/ESM).
-   **Assets:** (Optional) Static files required by the plugin.

## 3. Packages
The product will be organized as a monorepo (or distinct packages) containing:

1.  **`@augment/core` (The Host System)**
    -   The main runtime library.
    -   Handles discovery, loading, validation, and lifecycle management.
    -   Exposes the `PluginHost` class.

2.  **`@augment/builder` (The CLI/Builder)**
    -   CLI tool or library helpers.
    -   Compiles TypeScript plugin code into the standardized distribution format.
    -   Validates manifests during build time.

3.  **`@augment/boilerplate`**
    -   A starter template repository or generator for creating a new plugin.

4.  **`@augment/example-plugin`**
    -   A reference implementation used for testing and documentation.

## 4. Artifacts
-   **Source Code:** TypeScript source for all packages.
-   **Documentation:**
    -   `README.md` for each package.
    -   Architecture diagrams (Mermaid).
    -   "How to write a plugin" guide.
-   **Tests:**
    -   Unit tests for logic (manifest parsing, etc.).
    -   Integration tests (loading a real plugin in a real process).
-   **Distributables:**
    -   NPM packages (tarballs).

## 5. Functional Requirements
### 5.1 Initialization
-   System must accept a generic Type `T` defining the plugin signature.
-   System must accept a filesystem path to watch/scan.

### 5.2 Discovery & Manifest
-   Support loading plugins from **Directories**.
-   Support loading plugins from **Archives** (e.g., .zip, .tar - *Format TBD*).
-   Manifest must define: `entryPoint`, `name`, `version`, `meta` (custom host-specific data).

### 5.3 Loading & Execution
-   Support importing both CJS (`require`) and ESM (`import`) modules.
-   Exposed plugin API must match the initialized signature `T`.

### 5.4 Lifecycle
-   **List**: Retrieve all loaded plugins with their manifest data.
-   **Execute**: Call the exposed function of a plugin.
-   **Reload**:
    -   Trigger re-scanning of the plugin directory.
    -   Update the registry.
    -   Handling concurrency: Optional blocking or event-based notification during reload.

## 6. Technical Strategy & Decisions

### 6.1 Distribution Format (Archives vs. Folders)
**Decision:** The system will support **both** Folders and **`.zip` Archives**.
-   **Development Mode:** Developers work with loose folders for easy debugging and modification.
-   **Production Mode:** Plugins are distributed as `.zip` archives.
-   **Discovery Logic:**
    1.  Scanner looks for Directories.
    2.  Scanner looks for `.zip` files.
    3.  If a `.zip` is found, it is extracted to a dedicated temporary cache directory (managed by the `PluginHost`).
    4.  The system loads the plugin from the extracted location.

### 6.2 Dependency Handling & Debugging
**Decision:** **Bundled Dependencies with Source Maps**.
-   Plugins **must** bundle their dependencies (excluding shared host packages) into a single artifact to avoid `node_modules` conflicts.
-   The `@augment/builder` will use a bundler (e.g., `esbuild`) to produce a single `.js` output.
-   **Debugging:** The builder **must** generate source maps (`.js.map`) by default. This ensures that stack traces trace back to the original TypeScript source code, making the bundling process transparent during troubleshooting.

### 6.3 Sandboxing & Isolation
**Decision:** **Same-Process Execution (Shared Context)**.
-   **Reasoning:** Worker threads introduce significant overhead (serialization limitations and complexity).
-   **Implication:** Plugins are considered **Trusted**. A crash in a plugin crashes the host.

### 6.4 ESM Hot Reloading
**Decision:** **Cache Busting Strategy**.
-   Since plugins run in the main process, we cannot simply "unload" an ESM module from memory (Node.js limitation).
-   **Mechanism:** When a reload is triggered:
    1.  The system invalidates its internal registry.
    2.  The system re-imports the plugin entry point using a query parameter (e.g., `import('./plugin.js?update=123')`).
    3.  This forces Node.js to load the file as a new module instance.
-   **WARNING:** Repeated reloading over long periods **will increase memory usage** (potential memory leak) as old modules persist in V8's module cache. This feature should be used for development (Hot Module Replacement) or infrequent configuration updates, not as a high-frequency polling mechanism.

### 6.5 Error Handling Strategy
-   **System Responsibility:** The `PluginHost` will wrap **Loading** and **Discovery** operations in `try/catch` blocks. A malformed or crashing plugin during initialization **must not** crash the host application; it should be logged and skipped.
-   **Host Responsibility:** Once a plugin is successfully loaded and returned to the host, the `PluginHost` gets out of the way. If the host calls `plugin.doSomething()` and it throws, it is up to the host application to handle that error. We will not impose a proxy wrap on execution to preserve performance.

## 7. Technical Specifications (Draft)

### 7.1 Manifest Schema (`plugin.manifest.json`)
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "entryPoint": "./dist/index.js",
  "meta": {
    // Arbitrary data defined by the Host's needs
    "type": "payment-provider",
    "priority": 10
  }
}
```

### 7.2 Core API Signature
```typescript
interface PluginHostOptions<T> {
  folder: string;
  // Optional validator function to runtime-check the plugin shape
  validator?: (plugin: any) => plugin is T;
}

class PluginHost<T> {
  constructor(options: PluginHostOptions<T>);
  
  // Scans, loads, and registers plugins
  reload(): Promise<void>; 
  
  // Returns all successfully loaded plugins w/ manifest
  getAll(): Array<{ manifest: Manifest, plugin: T }>;
  
  // Helper to find specific plugins
  find(predicate: (m: Manifest) => boolean): T | undefined;
}

### 7.3 Builder CLI (`@augment/builder`)
The builder abstracts the complexity of `esbuild` and manifest validation.

**Commands:**
- `build`:
    - Bundles `src/index.ts` to `dist/index.js`.
    - **MUST** generate source maps (`.js.map`).
    - Validates `plugin.manifest.json` schema.
    - Copies manifest to `dist/`.
    - (Optionally) Zips content of `dist/` into `release.zip` for production distribution.
- `watch`:
    - Watches `src/**/*` and re-runs build steps incrementally.

### 7.4 Standard Plugin Structure
Boilerplates and the Builder will assume this convention to minimize configuration:
```text
my-plugin/
├── package.json          # Dependencies (bundled) & Peer Dependencies
├── plugin.manifest.json  # Metadata
├── tsconfig.json         # Compiler Options
└── src/
    └── index.ts          # Entry point exporting the Signature T
```

### 7.5 Dependencies & Type Sharing
To ensure the Host and Plugin agree on the Signature `T`:
1.  **Shared Types Package:** The Host App publishes a lightweight package (e.g., `my-app-types`) containing the signature interface.
2.  **Plugin Dependencies:**
    -   `devDependencies`: `@augment/builder`, `typescript`.
    -   `peerDependencies`: `my-app-types` (ensures type compatibility without bundling).
    -   `dependencies`: Any internal logic libraries (lodash, axios, etc.) -> **These are BUNDLED**.

## 8. Non-Functional Requirements

### 8.1 Documentation
-   **Package READMEs:** Every package in the monorepo must have a README explaining its purpose, installation, and public API.
-   **JSDoc:** All exported classes, methods, and interfaces in `@augment/core` must have JSDoc comments to provide IntelliSense support for consumers.
-   **Guides:** A dedicated "Plugin Authoring Guide" must be created, walking through the process from `npm init` to `npm publish`.

### 8.2 Code Quality & Standards
-   **Strict TypeScript:** `strict: true` must be enabled in `tsconfig.json`. No usage of `any` unless absolutely necessary (prefer `unknown`).
-   **Linting & Formatting:** The project will use ESLint and Prettier. CI must fail if code is not linted/formatted.
-   **Conventional Commits:** Commit messages should follow the Conventional Commits specification to allow for automated versioning and changelog generation.

### 8.3 Testing
-   **Unit Tests:** High coverage (>80%) required for `@augment/core` logic (especially discovery and validation).
-   **Integration Tests:** End-to-end tests that spin up a real `PluginHost`, build a real plugin using `@augment/builder`, load it, and execute it.
-   **OS Compatibility:** Tests must pass on both Windows and Linux/macOS (handling path separators `\` vs `/` correctly is critical for file scanning).

### 8.4 Performance
-   **Startup Overhead:** The plugin discovery phase must be efficient. It should not block the Host App startup significantly (use async I/O).
-   **Runtime Overhead:** Calling a plugin function should add negligible overhead (no proxy wrappers in the hot path).


```
