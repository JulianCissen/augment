/**
 * @augment/builder
 * Plugin builder utilities
 */

import * as esbuild from 'esbuild';
import { join, resolve, dirname } from 'path';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import AdmZip from 'adm-zip';

export const version = '0.0.0';

/**
 * Plugin manifest structure (matching @augment/core types)
 */
export interface PluginManifest {
  name: string;
  version: string;
  entryPoint: string;
  meta?: Record<string, unknown>;
}

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
 * Find and read the plugin manifest file
 * Looks in the parent directory of the input folder
 */
async function findAndReadManifest(inputDir: string): Promise<PluginManifest> {
  // Look for manifest in parent directory (project root)
  const projectRoot = resolve(inputDir, '..');
  const manifestPath = join(projectRoot, 'plugin.manifest.json');
  
  try {
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as PluginManifest;
    
    // Validate required fields
    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error('Manifest must have a valid "name" field');
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error('Manifest must have a valid "version" field');
    }
    if (!manifest.entryPoint || typeof manifest.entryPoint !== 'string') {
      throw new Error('Manifest must have a valid "entryPoint" field');
    }
    
    return manifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `No plugin.manifest.json found in ${projectRoot}. ` +
        'Please create a manifest file in your plugin root directory.'
      );
    }
    throw error;
  }
}

/**
 * Create a ZIP archive of the output directory
 */
async function createZipArchive(outputDir: string, manifest: PluginManifest): Promise<void> {
  const zip = new AdmZip();
  const outputParent = dirname(outputDir);
  const zipFileName = `${manifest.name}-${manifest.version}.zip`;
  const zipPath = join(outputParent, zipFileName);
  
  // Add all files from output directory
  const files = await readdir(outputDir, { recursive: true, withFileTypes: true });
  
  for (const file of files) {
    if (file.isFile()) {
      const filePath = join(file.path, file.name);
      const relativePath = filePath.substring(outputDir.length + 1);
      zip.addLocalFile(filePath, dirname(relativePath));
    }
  }
  
  // Write ZIP file
  zip.writeZip(zipPath);
  console.log(`Created archive: ${zipFileName}`);
}

/**
 * Build a plugin from TypeScript source
 * @param options Build configuration options
 */
export async function buildPlugin(options: BuildOptions): Promise<void> {
  const inputDir = resolve(options.input);
  const outputDir = resolve(options.output);
  
  // Find and validate manifest
  const manifest = await findAndReadManifest(inputDir);
  
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });
  
  // Find entry point
  const entryPoint = await findEntryPoint(inputDir);
  
  // Configure esbuild
  const buildOptions: esbuild.BuildOptions = {
    entryPoints: [entryPoint],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
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
  
  // Copy manifest to output directory
  const manifestPath = join(outputDir, 'plugin.manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('✓ Copied plugin.manifest.json');
  
  // Create ZIP archive if requested
  if (options.zip) {
    await createZipArchive(outputDir, manifest);
  }
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
    target: 'node20',
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
