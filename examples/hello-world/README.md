# Hello World Plugin

A minimal example plugin demonstrating the Augment plugin system.

## What This Example Demonstrates

- Basic plugin structure with TypeScript
- Simple plugin interface with methods
- Stateful plugin (tracks call count and uptime)
- How to build and test a plugin

## Quick Start

### 1. Install Dependencies

From the repository root:

```bash
npm install
```

### 2. Build the Plugin

```bash
cd examples/hello-world
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle the code with esbuild
- Generate sourcemaps
- Copy the plugin manifest

### 3. Test the Plugin

Create a test script or use Node.js directly:

```bash
node -e "import('./dist/index.js').then(m => { console.log(m.default.greet('Developer')); console.log(m.default.getInfo()); })"
```

Expected output:
```
[HelloWorld] Hello, Developer! Welcome to Augment plugins.
Hello, Developer! Welcome to Augment plugins.
{ uptime: 5, callCount: 1 }
```

## Plugin API

### `greet(name?: string): string`

Greets a user by name. If no name is provided, returns a generic greeting.

**Example:**
```typescript
plugin.greet('Alice'); // "Hello, Alice! Welcome to Augment plugins."
plugin.greet();        // "Hello, World! This is an Augment plugin."
```

### `getInfo(): { uptime: number; callCount: number }`

Returns plugin statistics.

**Example:**
```typescript
const info = plugin.getInfo();
console.log(`Plugin uptime: ${info.uptime}ms`);
console.log(`Called ${info.callCount} times`);
```

## Project Structure

```
hello-world/
├── src/
│   └── index.ts              # Plugin source code
├── dist/                     # Built output (generated)
│   ├── index.js
│   ├── index.js.map
│   └── plugin.manifest.json
├── plugin.manifest.json      # Plugin metadata
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

## Building with the Host

To load this plugin using `@augment/core`:

```typescript
import { PluginHost } from '@augment/core';

// Create a host pointing to the built plugin
const host = new PluginHost({
  folder: './examples/hello-world/dist'
});

// Load plugins
await host.reload();

// Find and use the plugin
const helloPlugin = host.find('hello-world');
if (helloPlugin) {
  console.log(helloPlugin.plugin.greet('World'));
  console.log(helloPlugin.plugin.getInfo());
}
```

## Advanced Usage

### Create a ZIP Distribution

```bash
npm run build:zip
```

This creates a `hello-world-1.0.0.zip` file containing the built plugin, ready for distribution.

### Watch Mode for Development

```bash
npm run dev
```

The plugin will automatically rebuild when source files change.

## Next Steps

- Check out [advanced-plugin](../advanced-plugin/) for more complex examples
- Read the [Plugin Authoring Guide](../../docs/authoring-guide.md)
- See the [boilerplate template](../../packages/boilerplate/) to create your own plugin

## License

MIT
