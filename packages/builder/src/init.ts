import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface InitOptions {
  name: string;
  description?: string;
  author?: string;
  version?: string;
}

const templates = {
  packageJson: (options: InitOptions) => ({
    name: options.name,
    version: options.version || '1.0.0',
    description: options.description || 'A plugin for the Augment plugin system',
    type: 'module',
    scripts: {
      build: 'augment-builder build',
      watch: 'augment-builder watch',
    },
    keywords: ['augment', 'plugin'],
    author: options.author || '',
    license: 'MIT',
    devDependencies: {
      '@augment/builder': '^0.0.0',
      typescript: '^5.3.0',
    },
  }),

  tsconfig: () => ({
    compilerOptions: {
      target: 'ES2022',
      module: 'ES2022',
      moduleResolution: 'node',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
      outDir: './dist',
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  }),

  manifest: (options: InitOptions) => ({
    name: options.name,
    version: options.version || '1.0.0',
    entryPoint: './dist/index.js',
    meta: {
      description: options.description || 'A plugin for the Augment plugin system',
      author: options.author || '',
    },
  }),

  indexTs: (options: InitOptions) => `export default {
  name: '${options.name}',
  version: '${options.version || '1.0.0'}',

  /**
   * Initialize the plugin
   */
  async init() {
    console.log('${options.name} initializing...');
  },

  /**
   * Execute the plugin
   */
  async execute() {
    console.log('${options.name} executing...');
    return 'success';
  },

  /**
   * Clean up plugin resources
   */
  async cleanup() {
    console.log('${options.name} cleaning up...');
  },
};
`,

  gitignore: () => `# Dependencies
node_modules/

# Build output
dist/
*.zip

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Environment
.env
.env.local
`,

  readme: (options: InitOptions) => `# ${options.name}

${options.description || 'A plugin for the Augment plugin system'}

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
# Build the plugin
npm run build

# Watch for changes
npm run watch
\`\`\`

## Usage

Load this plugin using the Augment plugin system:

\`\`\`typescript
import { PluginHost } from '@augment/core';

const host = new PluginHost({ folder: './path/to/${options.name}' });
await host.reload();

const plugin = host.find('${options.name}');
if (plugin) {
  await plugin.plugin.execute();
}
\`\`\`

## License

MIT
`,
};

export async function initPlugin(options: InitOptions): Promise<void> {
  const projectDir = join(process.cwd(), options.name);

  // Check if directory already exists
  if (existsSync(projectDir)) {
    throw new Error(`Directory "${options.name}" already exists`);
  }

  // Create project structure
  await mkdir(projectDir);
  await mkdir(join(projectDir, 'src'));

  // Write files
  await writeFile(
    join(projectDir, 'package.json'),
    JSON.stringify(templates.packageJson(options), null, 2)
  );

  await writeFile(
    join(projectDir, 'tsconfig.json'),
    JSON.stringify(templates.tsconfig(), null, 2)
  );

  await writeFile(
    join(projectDir, 'plugin.manifest.json'),
    JSON.stringify(templates.manifest(options), null, 2)
  );

  await writeFile(join(projectDir, 'src', 'index.ts'), templates.indexTs(options));

  await writeFile(join(projectDir, '.gitignore'), templates.gitignore());

  await writeFile(join(projectDir, 'README.md'), templates.readme(options));

  console.log(`\n✓ Created plugin project: ${options.name}`);
  console.log('\nNext steps:');
  console.log(`  cd ${options.name}`);
  console.log('  npm install');
  console.log('  npm run build');
}
