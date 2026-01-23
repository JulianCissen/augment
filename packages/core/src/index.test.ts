import { describe, it, expect } from '@jest/globals';
import type { PluginManifest, PluginHostOptions, LoadedPlugin } from './index.js';

describe('Core Types', () => {
  it('should export PluginManifest type', () => {
    const manifest: PluginManifest = {
      name: 'test-plugin',
      version: '1.0.0',
      entryPoint: './dist/index.js',
      meta: { type: 'test' },
    };
    expect(manifest.name).toBe('test-plugin');
  });

  it('should export PluginHostOptions type', () => {
    const options: PluginHostOptions<{ execute: () => void }> = {
      folder: '/plugins',
      validator: (plugin): plugin is { execute: () => void } => {
        return typeof plugin === 'object' && plugin !== null && 'execute' in plugin;
      },
    };
    expect(options.folder).toBe('/plugins');
  });

  it('should export LoadedPlugin type', () => {
    const loaded: LoadedPlugin<{ execute: () => void }> = {
      manifest: {
        name: 'test',
        version: '1.0.0',
        entryPoint: './index.js',
      },
      plugin: {
        execute: (): void => {
          // Plugin execution logic
        },
      },
    };
    expect(loaded.manifest.name).toBe('test');
  });
});
