# @moduul/boilerplate

Official boilerplate template for creating Moduul plugins.

## Quick Start

### 1. Clone or Copy This Template

```bash
# Copy the boilerplate to your project
cp -r packages/boilerplate my-plugin
cd my-plugin
```

### 2. Customize Your Plugin

1. **Update `plugin.manifest.json`:**
   ```json
   {
     "name": "my-plugin-name",
     "version": "1.0.0",
     "entryPoint": "./index.js",
     "meta": {
       "description": "Your plugin description",
       "category": "your-category"
     }
   }
   ```

2. **Update `package.json`:**
   - Change the `name` field
   - Update `description`, `author`, etc.

3. **Implement your plugin in `src/index.ts`:**
   ```typescript
   export interface MyPlugin {
     name: string;
     execute: (input: string) => string;
   }

   const plugin: MyPlugin = {
     name: 'My Plugin',
     execute: (input) => {
       // Your plugin logic here
       return `Processed: ${input}`;
     },
   };

   export default plugin;
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Build Your Plugin

```bash
# Build plugin
npm run build

# Build with ZIP archive
npm run build:zip

# Development mode with watch
npm run dev
```

## Project Structure

```
my-plugin/
├── src/
│   └── index.ts          # Plugin source code
├── dist/                 # Built output (generated)
│   ├── index.js
│   ├── index.js.map
│   └── plugin.manifest.json
├── plugin.manifest.json  # Plugin metadata
├── package.json          # NPM package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Testing Your Plugin

Create a test file to load and test your plugin:

```typescript
import { PluginHost } from '@moduul/core';

const host = new PluginHost({
  folder: './dist'
});

await host.reload();
const myPlugin = host.find('my-plugin-name');

if (myPlugin) {
  console.log('Plugin loaded:', myPlugin.manifest.name);
  console.log('Result:', myPlugin.plugin.execute('test input'));
}
```

## Plugin Requirements

Your plugin must:
1. Have a `plugin.manifest.json` with `name`, `version`, and `entryPoint`
2. Export a default module from the entry point
3. Be buildable with `@moduul/builder`

## Best Practices

- **Keep plugins focused** - Each plugin should do one thing well
- **Use TypeScript** - Type safety prevents runtime errors
- **Export interfaces** - Allow host apps to type-check plugin usage
- **Handle errors gracefully** - Don't crash the host application
- **Document your API** - Add JSDoc comments to public methods
- **Version properly** - Follow semantic versioning

## Available Scripts

- `npm run build` - Build the plugin to `dist/`
- `npm run build:zip` - Build and create a ZIP archive
- `npm run dev` - Watch mode for development

## Learn More

- [Plugin Authoring Guide](../../docs/authoring-guide.md) (coming soon)
- [Core Documentation](../core/README.md) (coming soon)
- [Builder Documentation](../builder/README.md) (coming soon)

## License

MIT
