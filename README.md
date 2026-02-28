# Moduul Plugin System

A robust, TypeScript-native plugin system for Node.js applications that enables dynamic loading and management of extensions at runtime.

## Features

- 🔌 **Dynamic Plugin Loading** - Load plugins from directories or ZIP archives at runtime
- 🔥 **Hot Reload** - Cache-busting support for plugin reloading during development
- 📦 **Multiple Formats** - Support for both ESM and CommonJS plugins
- ✅ **Type-Safe** - Full TypeScript support with generic type parameters
- 🎯 **Zero Config** - Works out of the box with sensible defaults
- 🛠️ **Build Tools** - CLI tool for bundling and packaging plugins
- 📝 **Well Documented** - Comprehensive documentation and examples

## Packages

This monorepo contains the following packages:

### [@moduul/core](packages/core)

Core plugin host system for loading and managing plugins.

```bash
npm install @moduul/core
```

**Key features:**
- Generic type support for type-safe plugins
- Directory and ZIP archive discovery
- Single-plugin mode — load one plugin directly by path
- Manifest validation
- Hot reload with cache busting
- Custom validators

### [@moduul/builder](packages/builder)

CLI tool for building and bundling plugins.

```bash
npm install -D @moduul/builder
```

**Key features:**
- TypeScript compilation
- ESBuild bundling
- Source map generation
- Manifest validation
- ZIP archive creation
- Watch mode

## Quick Start

### Creating a Plugin Host

```typescript
import { PluginHost } from '@moduul/core';

// Define your plugin interface
interface MyPlugin {
  execute(input: string): Promise<string>;
}

// Create a typed plugin host
const host = new PluginHost<MyPlugin>({
  folder: './plugins',
  validator: (plugin): plugin is MyPlugin => {
    return typeof plugin === 'object' 
      && plugin !== null 
      && typeof (plugin as any).execute === 'function';
  }
});

// Load all plugins
await host.reload();

// Get and execute plugins
const plugins = host.getAll();
for (const { manifest, plugin } of plugins) {
  console.log(`Executing ${manifest.name}...`);
  const result = await plugin.execute('test');
  console.log(result);
}
```

### Creating a Plugin

**1. Set up your project:**

```bash
mkdir my-plugin
cd my-plugin
npm init -y
npm install -D @moduul/builder typescript
```

**2. Create plugin files:**

**plugin.manifest.json:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "entryPoint": "./dist/index.js",
  "meta": {
    "description": "My awesome plugin"
  }
}
```

**src/index.ts:**
```typescript
export default {
  name: 'my-plugin',
  version: '1.0.0',
  
  async execute(input: string): Promise<string> {
    return `Processed: ${input}`;
  }
};
```

**3. Build your plugin:**

```bash
npx moduul build
```

**4. Load it with the host:**

```typescript
const host = new PluginHost({ folder: './my-plugin/dist' });
await host.reload();

const plugin = host.find('my-plugin');
if (plugin) {
  console.log(await plugin.plugin.execute('hello'));
}
```

## Examples

Check out the [examples](examples) directory for complete working examples:

- **[hello-world](examples/hello-world)** - Minimal working plugin demonstrating basic structure

## Documentation

- **[Architecture](ARCHITECTURE.md)** - System architecture and design decisions
- **[Plugin Authoring Guide](docs/authoring-guide.md)** - Complete guide to creating plugins
- **[Core Package README](packages/core/README.md)** - API documentation for @moduul/core
- **[Builder Package README](packages/builder/README.md)** - CLI documentation for @moduul/builder
- **[Testing Guide](packages/core/TESTING.md)** - Testing strategy and best practices

## Development

### Prerequisites

- Node.js 20 or higher
- npm 9 or higher

### Setup

```bash
# Clone the repository
git clone https://github.com/JulianCissen/moduul.git
cd moduul

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### Project Structure

```
moduul/
├── packages/
│   ├── core/          # @moduul/core - Plugin host system
│   ├── builder/       # @moduul/builder - Build CLI
│   └── boilerplate/   # Official plugin template
├── examples/
│   └── hello-world/   # Example plugins
├── docs/              # Documentation
└── tests/             # Integration tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific package
cd packages/core
npm test

# Run with coverage
npm run test:coverage
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

[MIT](LICENSE) © 2026 Julian Cissen

## Links

- [GitHub Repository](https://github.com/JulianCissen/moduul)
- [Issue Tracker](https://github.com/JulianCissen/moduul/issues)
- [NPM - @moduul/core](https://www.npmjs.com/package/@moduul/core)
- [NPM - @moduul/builder](https://www.npmjs.com/package/@moduul/builder)
