# @moduul/builder

CLI tool for building plugins for the Moduul plugin system. Bundles TypeScript source code into optimized JavaScript with automatic manifest handling.

## Features

- 🎯 **Zero Config** - Works out of the box with sensible defaults
- 📦 **ESBuild Powered** - Fast bundling with automatic tree-shaking
- 🔍 **Manifest Validation** - Ensures `plugin.manifest.json` is valid
- 🗜️ **ZIP Support** - Optional compression for distribution
- 🗺️ **Source Maps** - Debug support with inline source maps
- 📝 **TypeScript First** - Full TypeScript support

## Installation

```bash
npm install -D @moduul/builder
```

## Quick Start

### Basic Build

```bash
# Build current directory (defaults: input=./src, output=./dist, format=esm)
moduul-builder build

# Specify input and output directories
moduul-builder build --input src --output dist

# Build as CommonJS
moduul-builder build --format cjs
```

### Build with ZIP

```bash
# Create a ZIP archive for distribution
moduul-builder build --zip
```

## CLI Commands

### `build`

Bundles a plugin into a distributable format.

```bash
moduul-builder build [options]
```

**Options:**

- `-i, --input <path>` - Input directory containing plugin source (default: `./src`)
- `-o, --output <path>` - Output directory for built plugin (default: `./dist`)
- `-f, --format <format>` - Output module format: `esm`, `cjs`, or `iife` (default: `esm`)
- `-m, --minify` - Minify the output (default: `false`)
- `--zip` - Create a ZIP archive of the built plugin
- `-h, --help` - Display help

**Examples:**

```bash
# Default build (ESM output)
moduul-builder build

# Build as CommonJS
moduul-builder build --format cjs

# Custom input/output directories
moduul-builder build --input src --output build

# Build and zip
moduul-builder build --zip

# Minified CJS build with ZIP
moduul-builder build --format cjs --minify --zip
```

## Project Structure

A typical plugin project structure:

```
my-plugin/
├── src/
│   └── index.ts          # Entry point
├── plugin.manifest.json  # Plugin manifest
├── package.json
├── tsconfig.json
└── dist/                 # Generated after build
    ├── index.js
    ├── index.js.map
    └── plugin.manifest.json
```

### Manifest File

The `plugin.manifest.json` is required and must contain:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "entryPoint": "./dist/index.js",
  "meta": {
    "description": "My awesome plugin",
    "author": "Your Name"
  }
}
```

**Required Fields:**
- `name` - Unique plugin identifier (kebab-case recommended)
- `version` - Semantic version (e.g., "1.0.0")
- `entryPoint` - Path to the bundled output relative to plugin root

**Optional Fields:**
- `meta.description` - Human-readable description
- `meta.author` - Author name
- `meta.*` - Any additional metadata

## Build Process

The builder performs these steps:

1. **Validate Manifest** - Reads and validates `plugin.manifest.json`
2. **Bundle Code** - Uses esbuild to bundle TypeScript/JavaScript
3. **Generate Source Maps** - Creates `.map` files for debugging
4. **Copy Manifest** - Copies manifest to output directory
5. **Create ZIP** (optional) - Compresses output into `plugin.zip`

### Build Configuration

The builder uses esbuild with these settings:

- **Format:** ESM by default; override with `--format cjs` or `--format iife`
- **Target:** Node 20
- **Bundle:** true (all dependencies bundled)
- **Minify:** false by default; enable with `--minify`
- **Source Maps:** true
- **Tree Shaking:** Automatic

## TypeScript Support

The builder automatically handles TypeScript:

**src/index.ts:**
```typescript
export default {
  name: 'my-plugin',
  version: '1.0.0',
  
  async execute(): Promise<string> {
    return 'Hello from TypeScript!';
  }
};
```

**Output (dist/index.js, ESM):**
```javascript
// Compiled and bundled ES module
export default {
  name: 'my-plugin',
  version: '1.0.0',
  
  async execute() {
    return 'Hello from TypeScript!';
  }
};
```

**Output (dist/index.js, CJS) — built with `--format cjs`:**
```javascript
// Compiled and bundled CommonJS module
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  
  async execute() {
    return 'Hello from TypeScript!';
  }
};
```

## Plugin Examples

### Basic Plugin

**src/index.ts:**
```typescript
export default {
  name: 'basic-plugin',
  
  execute() {
    console.log('Plugin executed!');
  }
};
```

### Async Plugin with Dependencies

**src/index.ts:**
```typescript
import fetch from 'node-fetch';

export default {
  name: 'fetch-plugin',
  
  async execute(url: string) {
    const response = await fetch(url);
    return await response.json();
  }
};
```

### Plugin with Initialization

**src/index.ts:**
```typescript
let initialized = false;

export default {
  name: 'stateful-plugin',
  
  async init() {
    console.log('Initializing plugin...');
    initialized = true;
  },
  
  execute() {
    if (!initialized) {
      throw new Error('Plugin not initialized');
    }
    return 'Working!';
  }
};
```

## Development Workflow

### 1. Create Plugin Structure

```bash
mkdir my-plugin
cd my-plugin
npm init -y
```

### 2. Install Dependencies

```bash
npm install -D @moduul/builder typescript
```

### 3. Create Files

**package.json:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "moduul-builder build",
    "build:cjs": "moduul-builder build --format cjs"
  },
  "devDependencies": {
    "@moduul/builder": "*",
    "typescript": "^5.0.0"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

**plugin.manifest.json:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "entryPoint": "./dist/index.js",
  "meta": {
    "description": "My plugin"
  }
}
```

**src/index.ts:**
```typescript
export default {
  name: 'my-plugin',
  execute() {
    return 'Hello!';
  }
};
```

### 4. Build

```bash
npm run build
```

### 5. Test with PluginHost

```typescript
import { PluginHost } from '@moduul/core';

const host = new PluginHost({ folder: './my-plugin' });
await host.reload();

const plugin = host.find('my-plugin');
console.log(await plugin.plugin.execute());
```

## Distribution

### Local Testing

Copy the `dist/` folder or `plugin.zip` to your plugins directory:

```bash
cp -r dist/ /path/to/plugins/my-plugin/
# or
cp plugin.zip /path/to/plugins/
```

### NPM Publishing

You can publish plugins to npm:

```bash
npm publish dist/
```

Users can then install and use:

```bash
npm install your-plugin
```

## Advanced Usage

### Choosing a Module Format

```bash
# ESM output (default)
moduul-builder build --format esm

# CommonJS output (required by some host environments)
moduul-builder build --format cjs

# IIFE output (browser-compatible self-executing bundle)
moduul-builder build --format iife
```

### Custom Directories

```bash
# Custom input/output paths
moduul-builder build --input src --output build
```

### Multiple Outputs

Build multiple variants:

```bash
# Development ESM build
moduul-builder build --output dist-dev

# Production CJS build with zip
moduul-builder build --format cjs --output dist-prod --zip
```

### Integration with NPM Scripts

**package.json:**
```json
{
  "scripts": {
    "build": "moduul-builder build",
    "build:cjs": "moduul-builder build --format cjs",
    "build:prod": "moduul-builder build --minify --zip",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run build:prod"
  }
}
```

## Troubleshooting

### Build Fails with Module Error

Ensure your `package.json` has `"type": "module"`:

```json
{
  "type": "module"
}
```

### Manifest Validation Error

Check that your `plugin.manifest.json` has all required fields:
- `name` (string)
- `version` (string)
- `entryPoint` (string, relative path)

### Entry Point Not Found

Verify the path specified in `--entry` exists:

```bash
ls src/index.ts  # Should exist
```

## API Usage (Programmatic)

You can also use the builder programmatically:

```typescript
import { buildPlugin, watchPlugin } from '@moduul/builder';

// Build once
await buildPlugin({
  input: './src',
  output: './dist',
  format: 'cjs',   // 'esm' | 'cjs' | 'iife' — defaults to 'esm'
  minify: false,
  zip: false,
});

// Watch mode
await watchPlugin({
  input: './src',
  output: './dist',
  format: 'esm',
});
```

## Related Packages

- **[@moduul/core](../core)** - Plugin host system
- **[@moduul/boilerplate](../boilerplate)** - Official plugin template

## Requirements

- Node.js 20 or higher
- TypeScript 5.0+ (for TypeScript projects)

## License

MIT
