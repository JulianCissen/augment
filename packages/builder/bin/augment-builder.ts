#!/usr/bin/env node

import { Command } from 'commander';
import { buildPlugin, watchPlugin, BuildOptions, WatchOptions } from '../src/index.js';
import { initPlugin, InitOptions } from '../src/init.js';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const program = new Command();

program
  .name('augment-builder')
  .description('CLI tool for building plugins for the Augment plugin system')
  .version('0.0.0');

program
  .command('build')
  .description('Build a plugin from TypeScript source')
  .option('-i, --input <path>', 'Input directory containing plugin source', './src')
  .option('-o, --output <path>', 'Output directory for built plugin', './dist')
  .option('-m, --minify', 'Minify the output', false)
  .option('--zip', 'Create a ZIP archive of the built plugin', false)
  .action(async (options: BuildOptions) => {
    try {
      console.log('Building plugin...');
      console.log('Input:', options.input);
      console.log('Output:', options.output);
      await buildPlugin(options);
      console.log('✓ Build complete');
    } catch (error) {
      console.error('Build failed:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('watch')
  .description('Watch for changes and rebuild automatically')
  .option('-i, --input <path>', 'Input directory containing plugin source', './src')
  .option('-o, --output <path>', 'Output directory for built plugin', './dist')
  .action(async (options: WatchOptions) => {
    try {
      console.log('Starting watch mode...');
      console.log('Input:', options.input);
      console.log('Output:', options.output);
      await watchPlugin(options);
    } catch (error) {
      console.error('Watch failed:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('init <plugin-name>')
  .description('Initialize a new plugin project')
  .option('-d, --description <text>', 'Plugin description')
  .option('-a, --author <name>', 'Plugin author')
  .option('-v, --version <version>', 'Initial version', '1.0.0')
  .option('-y, --yes', 'Skip prompts and use defaults', false)
  .action(async (pluginName: string, cmdOptions: { description?: string; author?: string; version?: string; yes?: boolean }) => {
    try {
      let options: InitOptions = {
        name: pluginName,
        version: cmdOptions.version,
        description: cmdOptions.description,
        author: cmdOptions.author,
      };

      // Interactive prompts if not using --yes flag
      if (!cmdOptions.yes) {
        const rl = readline.createInterface({ input, output });

        if (!options.description) {
          options.description = await rl.question('Description (optional): ');
        }

        if (!options.author) {
          options.author = await rl.question('Author (optional): ');
        }

        rl.close();
      }

      await initPlugin(options);
    } catch (error) {
      console.error('Init failed:', (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
