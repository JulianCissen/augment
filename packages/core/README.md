# @augment/core

Core plugin host system for dynamically loading and managing plugins at runtime.

## Features

- 🔌 **Dynamic Plugin Loading** - Load plugins from directories or ZIP archives at runtime
- 🔥 **Hot Reload** - Cache-busting support for plugin reloading during development
- 📦 **Multiple Formats** - Support for both ESM and CommonJS plugins
- ✅ **Validation** - Built-in manifest validation with optional custom validators
- 🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🚀 **Zero Config** - Works out of the box with sensible defaults

## Installation

```bash
npm install @augment/core
```

## Quick Start

```typescript
import { PluginHost } from '@augment/core';

// Define your plugin interface for type safety
interface MyPlugin {
  execute(): Promise<string>;
}

// Create a typed plugin host
const host = new PluginHost<MyPlugin>({
  folder: './plugins'
});

// Load all plugins
await host.reload();

// Get all loaded plugins (typed!)
const plugins = host.getAll();
console.log(`Loaded ${plugins.length} plugins`);

// Find a specific plugin
const plugin = host.find('my-plugin');
if (plugin) {
  // Full type safety and autocomplete
  const result = await plugin.plugin.execute();
  console.log(result);
}
```

## API Reference

### `PluginHost<T>`

The main class for managing plugins. Supports a generic type parameter `T` to define the expected plugin interface, enabling full type safety and IDE autocomplete.

#### Generic Type Parameter

The `PluginHost` class accepts a generic type parameter that defines the shape of your plugins:

```typescript
// Define your plugin interface
interface MyPlugin {
  name: string;
  version: string;
  execute(input: string): Promise<string>;
}

// Create a typed host
const host = new PluginHost<MyPlugin>({
  folder: './plugins'
});

// Type-safe access to plugins
await host.reload();
const plugin = host.find('my-plugin');
if (plugin) {
  // TypeScript knows plugin.plugin is MyPlugin
  const result = await plugin.plugin.execute('hello'); // ✓ Type-checked
  console.log(plugin.plugin.name); // ✓ Autocomplete works
}
```

**Benefits of using the generic type:**

- **Type Safety**: Catch errors at compile time instead of runtime
- **IDE Support**: Full autocomplete and IntelliSense for plugin methods
- **Documentation**: Self-documenting code with clear contracts
- **Refactoring**: Safe refactoring with TypeScript's rename/find references

**Without generic type (untyped):**

```typescript
const host = new PluginHost({ folder: './plugins' });
const plugin = host.find('my-plugin');
if (plugin) {
  // plugin.plugin is `unknown` - no type safety
  const result = await (plugin.plugin as any).execute('hello'); // No autocomplete
}
```

#### Constructor

```typescript
new PluginHost<T>(options: PluginHostOptions<T>)
```

**Options:**

- `folder` (string, required) - Path to the directory containing plugins
- `validator?` (function, optional) - Custom validation function that ensures plugins match type `T`

**Example with validator:**

```typescript
interface MyPlugin {
  execute(): string;
  version: string;
}

const host = new PluginHost<MyPlugin>({
  folder: './plugins',
  // Type guard that validates plugin structure
  validator: (plugin): plugin is MyPlugin => {
    return (
      typeof plugin === 'object' &&
      plugin !== null &&
      typeof (plugin as any).execute === 'function' &&
      typeof (plugin as any).version === 'string'
    );
  }
});
```

The validator acts as a TypeScript type guard, narrowing `unknown` to `T`.

#### Methods

##### `reload(): Promise<void>`

Scans the plugin folder and loads all valid plugins. Clears previously loaded plugins.

```typescript
await host.reload();
```

##### `getAll(): LoadedPlugin<T>[]`

Returns an array of all loaded plugins with full type information.

```typescript
interface MyPlugin {
  execute(): string;
}

const host = new PluginHost<MyPlugin>({ folder: './plugins' });
await host.reload();

const plugins = host.getAll();
plugins.forEach(({ manifest, plugin }) => {
  console.log(`${manifest.name} v${manifest.version}`);
  // plugin is typed as MyPlugin
  const result = plugin.execute(); // ✓ Type-safe
});
```

##### `find(name: string): LoadedPlugin<T> | undefined`

Finds a plugin by name with full type information.

```typescript
const plugin = host.find('my-plugin');
if (plugin) {
  // plugin is typed as LoadedPlugin<MyPlugin>
  console.log('Found:', plugin.manifest.name);
  const result = await plugin.plugin.execute(); // ✓ Autocomplete works
}
```

### Types

#### `PluginManifest`

The required structure for `plugin.manifest.json`:

```typescript
interface PluginManifest {
  name: string;           // Unique plugin identifier
  version: string;        // Semantic version
  entryPoint: string;     // Relative path to main file (e.g., "./dist/index.js")
  meta?: {                // Optional metadata
    description?: string;
    author?: string;
    [key: string]: unknown;
  };
}
```

#### `LoadedPlugin<T>`

The structure returned by `getAll()` and `find()`:

```typescript
interface LoadedPlugin<T> {
  manifest: PluginManifest;  // Parsed manifest
  plugin: T;                 // The loaded module (typed)
}
```

**Example usage:**

```typescript
interface MyPlugin {
  execute(): string;
}

const host = new PluginHost<MyPlugin>({ folder: './plugins' });
const plugin: LoadedPlugin<MyPlugin> | undefined = host.find('test');
```

#### `PluginHostOptions<T>`

Configuration options for `PluginHost`:

```typescript
interface PluginHostOptions<T> {
  folder: string;                            // Plugin directory path
  validator?: (plugin: unknown) => plugin is T;  // Type guard validator
}
```

## Plugin Structure

A valid plugin must have:

1. **plugin.manifest.json** - Manifest file at the root
2. **Entry point** - The JavaScript file specified in `entryPoint`

### Directory Plugin Example

```
my-plugin/
├── plugin.manifest.json
└── dist/
    └── index.js
```

**plugin.manifest.json:**
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

**dist/index.js:**
```javascript
export default {
  name: 'my-plugin',
  execute() {
    console.log('Hello from plugin!');
  }
};
```

### ZIP Archive Support

Plugins can be distributed as `.zip` files. The host automatically extracts them to a temporary directory before loading.

```
plugins/
├── my-plugin/           # Directory plugin
└── another-plugin.zip   # ZIP archive plugin
```

## Module Formats

### ESM Plugins (Recommended)

**package.json:**
```json
{
  "type": "module"
}
```

**index.js:**
```javascript
export default {
  execute() {
    return 'result';
  }
};
```

### CommonJS Plugins

**index.js:**
```javascript
module.exports = {
  execute() {
    return 'result';
  }
};
```

## Custom Validation

Add a validator to enforce plugin structure at runtime and enable type narrowing:

```typescript
interface MyPlugin {
  name: string;
  execute(): Promise<string>;
  version: string;
}

const host = new PluginHost<MyPlugin>({
  folder: './plugins',
  // Type guard validates and narrows type from unknown to MyPlugin
  validator: (plugin): plugin is MyPlugin => {
    return (
      typeof plugin === 'object' &&
      plugin !== null &&
      typeof (plugin as any).name === 'string' &&
      typeof (plugin as any).execute === 'function' &&
      typeof (plugin as any).version === 'string'
    );
  }
});

await host.reload();

// All plugins are guaranteed to match MyPlugin interface
const plugins = host.getAll();
plugins.forEach(({ plugin }) => {
  // TypeScript knows these properties exist
  console.log(`${plugin.name} v${plugin.version}`);
});
```

**Pro Tip:** Use a validation library like `zod` for more robust validation:

```typescript
import { z } from 'zod';

const PluginSchema = z.object({
  name: z.string(),
  version: z.string(),
  execute: z.function().returns(z.promise(z.string())),
});

type MyPlugin = z.infer<typeof PluginSchema>;

const host = new PluginHost<MyPlugin>({
  folder: './plugins',
  validator: (plugin): plugin is MyPlugin => {
    return PluginSchema.safeParse(plugin).success;
  }
});
```

## Error Handling

The plugin host gracefully handles errors:

- **Invalid manifests** - Logged and skipped
- **Missing entry points** - Logged and skipped
- **Import errors** - Logged and skipped
- **Validation failures** - Logged and skipped

Errors are logged to `console.warn` and don't crash the host.

## Hot Reload

Cache busting is automatic. Each `reload()` call uses a new timestamp:

```typescript
// Development workflow
while (developing) {
  // Make changes to plugin...
  
  await host.reload(); // Loads fresh version
  
  const plugin = host.find('my-plugin');
  await plugin.plugin.execute();
}
```

## Dual-Format Package

`@augment/core` is published in both ESM and CommonJS formats:

```javascript
// ESM
import { PluginHost } from '@augment/core';

// CommonJS
const { PluginHost } = require('@augment/core');
```

## TypeScript Support

Full type definitions included with generic type support:

```typescript
import { PluginHost, PluginManifest, LoadedPlugin } from '@augment/core';

// Define your plugin interface
interface MyPlugin {
  execute(input: string): Promise<string>;
  cleanup?(): Promise<void>;
}

// Create typed host
const host: PluginHost<MyPlugin> = new PluginHost<MyPlugin>({ 
  folder: './plugins' 
});

// Type-safe plugin access
const plugins: LoadedPlugin<MyPlugin>[] = host.getAll();

// Type guard validator
const validator = (plugin: unknown): plugin is MyPlugin => {
  return (
    typeof plugin === 'object' &&
    plugin !== null &&
    typeof (plugin as any).execute === 'function'
  );
};

// Manifest typing
const manifest: PluginManifest = {
  name: 'my-plugin',
  version: '1.0.0',
  entryPoint: './dist/index.js'
};
```

**Advanced: Multiple Plugin Types**

```typescript
// Define base interface
interface BasePlugin {
  name: string;
  version: string;
}

// Define specific plugin types
interface DataPlugin extends BasePlugin {
  processData(data: unknown): Promise<unknown>;
}

interface UIPlugin extends BasePlugin {
  render(): HTMLElement;
}

// Create separate hosts for different plugin types
const dataHost = new PluginHost<DataPlugin>({
  folder: './plugins/data',
  validator: (p): p is DataPlugin => 
    typeof (p as any)?.processData === 'function'
});

const uiHost = new PluginHost<UIPlugin>({
  folder: './plugins/ui',
  validator: (p): p is UIPlugin => 
    typeof (p as any)?.render === 'function'
});
```

## Requirements

- Node.js 18 or higher
- ESM support (built-in)

## Related Packages

- **[@augment/builder](../builder)** - CLI tool for building plugins
- **[@augment/boilerplate](../boilerplate)** - Official plugin template

## License

MIT
