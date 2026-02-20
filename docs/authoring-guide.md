# Plugin Authoring Guide

Complete guide to creating plugins for the Moduul plugin system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Setup](#project-setup)
3. [Writing Your Plugin](#writing-your-plugin)
4. [Building and Testing](#building-and-testing)
5. [Best Practices](#best-practices)
6. [Advanced Topics](#advanced-topics)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Basic TypeScript knowledge (optional but recommended)

### What is a Plugin?

A plugin is a self-contained module that can be dynamically loaded by the Moduul plugin system. Plugins extend the functionality of host applications without requiring code changes or recompilation.

**Key Characteristics:**
- **Self-contained** - All code bundled into a single file
- **Manifest-based** - Described by `plugin.manifest.json`
- **Dynamic** - Loaded at runtime via `import()`
- **Isolated** - Each plugin runs independently

## Project Setup

### Option 1: Using Boilerplate (Recommended)

The quickest way to start:

```bash
# Create from boilerplate
git clone https://github.com/your-org/plugin-boilerplate my-plugin
cd my-plugin
npm install
```

### Option 2: Manual Setup

Create a new plugin from scratch:

```bash
# Create project directory
mkdir my-plugin
cd my-plugin
npm init -y
```

#### Install Dependencies

```bash
npm install -D @moduul/builder typescript
```

#### Create Configuration Files

**package.json:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "moduul-builder build",
    "dev": "moduul-builder build --watch"
  },
  "devDependencies": {
    "@moduul/builder": "^0.0.0",
    "typescript": "^5.3.0"
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
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**plugin.manifest.json:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "entryPoint": "./dist/index.js",
  "meta": {
    "description": "My awesome plugin",
    "author": "Your Name",
    "license": "MIT"
  }
}
```

#### Create Source Structure

```bash
mkdir src
touch src/index.ts
```

Your project should now look like:

```
my-plugin/
├── src/
│   └── index.ts
├── package.json
├── tsconfig.json
└── plugin.manifest.json
```

## Writing Your Plugin

### Basic Plugin Structure

**src/index.ts:**
```typescript
export default {
  // Plugin metadata
  name: 'my-plugin',
  version: '1.0.0',
  
  // Main execution function
  execute() {
    return 'Hello from my plugin!';
  }
};
```

### Plugin Interface Pattern

Define a clear interface for your plugin:

```typescript
interface MyPlugin {
  name: string;
  version: string;
  init?(): Promise<void>;
  execute(...args: any[]): any;
  cleanup?(): Promise<void>;
}

const plugin: MyPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  
  async init() {
    console.log('Plugin initializing...');
  },
  
  execute(input: string) {
    return `Processed: ${input}`;
  },
  
  async cleanup() {
    console.log('Plugin cleaning up...');
  }
};

export default plugin;
```

### Stateful Plugins

Plugins can maintain internal state:

```typescript
class MyPlugin {
  private counter = 0;
  private config: Record<string, any> = {};
  
  constructor() {
    console.log('Plugin instance created');
  }
  
  async init(config: Record<string, any>) {
    this.config = config;
    console.log('Plugin initialized with config');
  }
  
  execute() {
    this.counter++;
    return {
      count: this.counter,
      config: this.config
    };
  }
  
  reset() {
    this.counter = 0;
  }
}

export default new MyPlugin();
```

### Using External Dependencies

Install and use npm packages:

```bash
npm install axios
```

```typescript
import axios from 'axios';

export default {
  name: 'api-plugin',
  
  async execute(url: string) {
    const response = await axios.get(url);
    return response.data;
  }
};
```

**Note:** Dependencies are bundled by `@moduul/builder` automatically.

### Error Handling

Implement robust error handling:

```typescript
export default {
  name: 'safe-plugin',
  
  async execute(input: unknown) {
    try {
      // Validate input
      if (typeof input !== 'string') {
        throw new TypeError('Input must be a string');
      }
      
      // Process
      const result = await processInput(input);
      
      return { success: true, result };
    } catch (error) {
      // Log error
      console.error('Plugin execution failed:', error);
      
      // Return error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

async function processInput(input: string) {
  // Processing logic
  return input.toUpperCase();
}
```

### Configuration Support

Allow host applications to configure your plugin:

```typescript
interface PluginConfig {
  apiKey?: string;
  timeout?: number;
  debug?: boolean;
}

class ConfigurablePlugin {
  private config: PluginConfig;
  
  constructor(config: PluginConfig = {}) {
    this.config = {
      timeout: 5000,
      debug: false,
      ...config
    };
  }
  
  configure(newConfig: Partial<PluginConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
  
  execute() {
    if (this.config.debug) {
      console.log('Debug mode enabled');
    }
    
    // Use config
    return `Timeout: ${this.config.timeout}ms`;
  }
}

export default ConfigurablePlugin;
```

## Building and Testing

### Build Your Plugin

```bash
npm run build
```

This creates:
```
dist/
├── index.js              # Bundled plugin code
├── index.js.map          # Source map for debugging
└── plugin.manifest.json  # Copied manifest
```

### Test with PluginHost

Create a test file:

**test.js:**
```typescript
import { PluginHost } from '@moduul/core';

const host = new PluginHost({
  folder: './dist'
});

await host.reload();

const plugin = host.find('my-plugin');
if (plugin) {
  const result = await plugin.plugin.execute();
  console.log('Result:', result);
} else {
  console.error('Plugin not found');
}
```

Run the test:
```bash
node test.js
```

### Unit Testing

Test your plugin code before building:

**src/index.test.ts:**
```typescript
import { describe, it, expect } from '@jest/globals';
import plugin from './index.js';

describe('MyPlugin', () => {
  it('should execute successfully', () => {
    const result = plugin.execute();
    expect(result).toBe('Hello from my plugin!');
  });
  
  it('should handle errors gracefully', () => {
    expect(() => plugin.execute(null)).not.toThrow();
  });
});
```

## Best Practices

### 1. Export a Default Object

Always export a default object with a consistent interface:

```typescript
export default {
  name: 'my-plugin',
  version: '1.0.0',
  execute() { /* ... */ }
};
```

### 2. Version Your Plugin

Use semantic versioning in both `package.json` and `plugin.manifest.json`:

- **Major** (1.0.0 → 2.0.0) - Breaking changes
- **Minor** (1.0.0 → 1.1.0) - New features, backward compatible
- **Patch** (1.0.0 → 1.0.1) - Bug fixes

### 3. Document Your API

Add JSDoc comments:

```typescript
/**
 * My plugin for processing data
 */
export default {
  /**
   * Process input data
   * @param input - The data to process
   * @returns Processed result
   * @throws {TypeError} If input is invalid
   */
  execute(input: string): string {
    return input.toUpperCase();
  }
};
```

### 4. Validate Inputs

Always validate user inputs:

```typescript
function isValidInput(input: unknown): input is string {
  return typeof input === 'string' && input.length > 0;
}

export default {
  execute(input: unknown) {
    if (!isValidInput(input)) {
      throw new TypeError('Invalid input');
    }
    
    return input.toUpperCase();
  }
};
```

### 5. Handle Async Operations

Use async/await for asynchronous operations:

```typescript
export default {
  async execute() {
    // Wait for operations to complete
    const data = await fetchData();
    const processed = await processData(data);
    return processed;
  }
};
```

### 6. Cleanup Resources

Implement cleanup for resources:

```typescript
export default {
  connections: [],
  
  async init() {
    this.connections.push(await createConnection());
  },
  
  async cleanup() {
    await Promise.all(
      this.connections.map(conn => conn.close())
    );
    this.connections = [];
  }
};
```

### 7. Use TypeScript

Type safety prevents runtime errors:

```typescript
interface ExecuteParams {
  url: string;
  method: 'GET' | 'POST';
}

export default {
  execute(params: ExecuteParams): Promise<Response> {
    return fetch(params.url, { method: params.method });
  }
};
```

## Advanced Topics

### Multiple Entry Points

Export multiple functions:

```typescript
export default {
  // Primary function
  execute() {
    return 'primary';
  },
  
  // Additional utilities
  utils: {
    format(data: any) {
      return JSON.stringify(data, null, 2);
    },
    parse(json: string) {
      return JSON.parse(json);
    }
  }
};
```

### Plugin Lifecycle Hooks

Implement lifecycle methods:

```typescript
export default {
  // Called when plugin is first loaded
  async onLoad() {
    console.log('Plugin loaded');
  },
  
  // Called when plugin is initialized
  async onInit(config: any) {
    console.log('Plugin initialized');
  },
  
  // Called before plugin is unloaded
  async onUnload() {
    console.log('Plugin unloading');
  },
  
  // Main execution
  execute() {
    return 'result';
  }
};
```

### Event System Integration

Create an event-driven plugin:

```typescript
import { EventEmitter } from 'events';

class EventPlugin extends EventEmitter {
  constructor() {
    super();
  }
  
  execute(action: string, ...args: any[]) {
    // Emit event
    this.emit(action, ...args);
    
    // Return event listener count
    return this.listenerCount(action);
  }
}

export default new EventPlugin();
```

### Dependency Injection

Accept dependencies via initialization:

```typescript
interface Dependencies {
  logger: Console;
  database: any;
}

class Plugin {
  private deps: Dependencies;
  
  init(deps: Dependencies) {
    this.deps = deps;
  }
  
  execute() {
    this.deps.logger.log('Executing');
    return this.deps.database.query('SELECT * FROM data');
  }
}

export default new Plugin();
```

### Hot Reload Support

Design for hot reloading:

```typescript
// Store state externally if needed
const globalState = new Map();

export default {
  // Initialize with preserved state
  init() {
    if (!globalState.has('counter')) {
      globalState.set('counter', 0);
    }
  },
  
  execute() {
    const counter = globalState.get('counter');
    globalState.set('counter', counter + 1);
    return counter;
  }
};
```

## Troubleshooting

### Plugin Not Loading

1. Check manifest is valid JSON
2. Verify `entryPoint` path is correct
3. Ensure `dist/index.js` exists
4. Check console for error messages

### Import Errors

If you see import errors:

1. Verify dependencies are installed
2. Check `package.json` has `"type": "module"`
3. Use `.js` extensions in imports (TypeScript requirement)

### Build Failures

Common issues:

- **TypeScript errors**: Fix type errors in source
- **Missing files**: Ensure all imports resolve
- **Invalid manifest**: Validate JSON syntax

## Examples Repository

Check out the [examples directory](../../examples/) for complete working examples:

- **hello-world** - Basic plugin structure
- **advanced-plugin** - Complex plugin with state management

## Support

- **Documentation**: [GitHub Wiki](https://github.com/your-org/moduul)
- **Issues**: [GitHub Issues](https://github.com/your-org/moduul/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/moduul/discussions)

## Next Steps

1. Build your first plugin using the boilerplate
2. Test it with `@moduul/core`
3. Add features incrementally
4. Share your plugin with the community!
