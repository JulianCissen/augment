/**
 * @augment/builder
 * Plugin builder utilities
 */

import * as esbuild from 'esbuild';
import { join, resolve } from 'path';
import { readFile } from 'fs/promises';

export const version = '0.0.0';

/**
 * Options for building a plugin
 */
export interface BuildOptions {
  input: string;
  output: string;
  minify?: boolean;
  zip?: boolean;
}

/**
 * Options for watching a plugin
 */
export interface WatchOptions {
  input: string;
  output: string;
}

/**
 * Find the entry point file in the input directory
 * Looks for index.ts, index.js, or main.ts
 */
async function findEntryPoint(inputDir: string): Promise<string> {
  const candidates = ['index.ts', 'index.js', 'main.ts', 'main.js'];
  
  for (const candidate of candidates) {
    try {
      const entryPath = resolve(inputDir, candidate);
      await readFile(entryPath);
      return entryPath;
    } catch {
      // Continue to next candidate
    }
  }
  
  throw new Error(
    `No entry point found in ${inputDir}. Expected one of: ${candidates.join(', ')}`
  );
}

/**
 * Build a plugin from TypeScript source
 * @param options Build configuration options
 */
export async function buildPlugin(options: BuildOptions): Promise<void> {
  const inputDir = resolve(options.input);
  const outputDir = resolve(options.output);
  
  // Find entry point
  const entryPoint = await findEntryPoint(inputDir);
  
  // Configure esbuild
  const buildOptions: esbuild.BuildOptions = {
    entryPoints: [entryPoint],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    outfile: join(outputDir, 'index.js'),
    sourcemap: true,
    minify: options.minify ?? false,
    external: [
      // Exclude Node.js built-ins
      'fs',
      'path',
      'url',
      'os',
      'crypto',
      'stream',
      'util',
      'events',
      'buffer',
      'process',
      'child_process',
      'http',
      'https',
      'net',
      'tls',
      'dns',
      'dgram',
      'cluster',
      'readline',
      'repl',
      'vm',
      'zlib',
      'assert',
      'constants',
      'module',
      'perf_hooks',
      'querystring',
      'string_decoder',
      'timers',
      'tty',
      'v8',
      'worker_threads',
    ],
    logLevel: 'info',
  };
  
  // Build with esbuild
  await esbuild.build(buildOptions);
}

/**
 * Watch plugin source for changes and rebuild automatically
 * @param options Watch configuration options
 */
export async function watchPlugin(options: WatchOptions): Promise<void> {
  const inputDir = resolve(options.input);
  const outputDir = resolve(options.output);
  
  // Find entry point
  const entryPoint = await findEntryPoint(inputDir);
  
  // Configure esbuild context for watch mode
  const buildOptions: esbuild.BuildOptions = {
    entryPoints: [entryPoint],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    outfile: join(outputDir, 'index.js'),
    sourcemap: true,
    external: [
      // Same externals as build
      'fs', 'path', 'url', 'os', 'crypto', 'stream', 'util', 'events',
      'buffer', 'process', 'child_process', 'http', 'https', 'net', 'tls',
      'dns', 'dgram', 'cluster', 'readline', 'repl', 'vm', 'zlib', 'assert',
      'constants', 'module', 'perf_hooks', 'querystring', 'string_decoder',
      'timers', 'tty', 'v8', 'worker_threads',
    ],
    logLevel: 'info',
  };
  
  // Create esbuild context for watch mode
  const ctx = await esbuild.context(buildOptions);
  
  console.log('Watching for changes...');
  await ctx.watch();
  
  // Keep the process running
  await new Promise(() => {
    // This promise never resolves, keeping watch active
  });
}
