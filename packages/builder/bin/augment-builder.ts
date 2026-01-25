#!/usr/bin/env node

import { Command } from 'commander';
import { buildPlugin, watchPlugin, BuildOptions, WatchOptions } from '../src/index.js';

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

program.parse();
