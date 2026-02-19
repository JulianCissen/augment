import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PluginHost } from './host.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { suppressExpectedWarnings } from './__tests__/test-helpers.js';

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestPlugin {
  name: string;
  format: string;
  execute: (input: string) => string;
}

describe('PluginHost - Jest ESM Mode Integration', () => {
  const fixturesPath = resolve(__dirname, '../test-fixtures');
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    consoleWarnSpy = suppressExpectedWarnings();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should load and execute true ESM plugin with experimental VM modules', async () => {
    // With --experimental-vm-modules, Jest can load native ESM plugins
    const host = new PluginHost({
      folder: fixturesPath,
    });

    await host.reload();

    const esmPlugin = host.find('test-plugin-esm');

    expect(esmPlugin).toBeDefined();
    expect(esmPlugin?.manifest.name).toBe('test-plugin-esm');
    expect(esmPlugin?.manifest.version).toBe('1.0.0');
    expect(esmPlugin?.manifest.meta?.format).toBe('esm');

    const plugin = esmPlugin?.plugin as TestPlugin;
    expect(plugin.name).toBe('ESM Test Plugin');
    expect(plugin.format).toBe('esm');
    expect(plugin.execute('test')).toBe('ESM processed: test');
  });

  it('should load both ESM and CJS plugins', async () => {
    const host = new PluginHost({
      folder: fixturesPath,
    });

    await host.reload();

    const plugins = host.getAll();
    expect(plugins.length).toBeGreaterThanOrEqual(2);

    const pluginNames = plugins.map((p) => p.manifest.name);
    expect(pluginNames).toContain('test-plugin-esm');
    expect(pluginNames).toContain('test-plugin-cjs');
  });

  it('should handle cache busting with ESM', async () => {
    const host = new PluginHost({
      folder: fixturesPath,
    });

    // First load
    await host.reload();
    const firstLoad = host.find('test-plugin-esm');
    expect(firstLoad).toBeDefined();

    // Second load with cache busting
    await host.reload();
    const secondLoad = host.find('test-plugin-esm');
    expect(secondLoad).toBeDefined();

    expect(firstLoad?.manifest.name).toBe(secondLoad?.manifest.name);
  });
});
