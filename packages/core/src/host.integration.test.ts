import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PluginHost } from './host.js';
import { resolve } from 'path';
import { suppressExpectedWarnings } from './__tests__/test-helpers.js';

describe('PluginHost - Jest Integration Tests (CJS)', () => {
  const fixturesPath = resolve(__dirname, '../test-fixtures');
  const cjsPluginPath = resolve(__dirname, '../test-fixtures/plugin-cjs');
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    consoleWarnSpy = suppressExpectedWarnings();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('Loading CJS plugin format', () => {
    it('should load CJS plugin from test fixtures', async () => {
      const host = new PluginHost({
        folder: fixturesPath,
      });

      await host.reload();

      const plugins = host.getAll();
      
      // Jest can only load CJS plugins via dynamic import
      // ESM plugins tested separately with Node.js test runner
      expect(plugins.length).toBeGreaterThanOrEqual(1);

      // Check that we have CJS format
      const pluginNames = plugins.map(p => p.manifest.name);
      expect(pluginNames).toContain('test-plugin-cjs');
    });

    it('should load and execute CJS plugin', async () => {
      const host = new PluginHost({
        folder: fixturesPath,
      });

      await host.reload();

      const cjsPlugin = host.find('test-plugin-cjs');
      
      expect(cjsPlugin).toBeDefined();
      expect(cjsPlugin?.manifest.name).toBe('test-plugin-cjs');
      expect(cjsPlugin?.manifest.version).toBe('1.0.0');
      expect(cjsPlugin?.manifest.meta?.format).toBe('cjs');

      // Test plugin functionality
      interface TestPlugin {
        name: string;
        version: string;
        format: string;
        execute: (input: string) => string;
        getMetadata: () => Record<string, unknown>;
      }

      const plugin = cjsPlugin?.plugin as TestPlugin;
      expect(plugin.name).toBe('CJS Test Plugin');
      expect(plugin.format).toBe('cjs');
      expect(plugin.execute('data')).toBe('CJS processed: data');
      
      const metadata = plugin.getMetadata();
      expect(metadata.name).toBe('CJS Test Plugin');
      expect(metadata.version).toBe('1.0.0');
    });

    it('should skip plugins with invalid manifests', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      const host = new PluginHost({
        folder: fixturesPath,
      });

      await host.reload();

      // Invalid plugin should not be loaded
      const invalidPlugin = host.find('invalid-plugin');
      expect(invalidPlugin).toBeUndefined();

      // Should have warned about the invalid plugin
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load plugin'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Hot reloading with cache busting', () => {
    it('should reload plugins with fresh imports', async () => {
      const host = new PluginHost({
        folder: fixturesPath,
      });

      // First load
      await host.reload();
      const firstLoad = host.find('test-plugin-cjs');
      expect(firstLoad).toBeDefined();

      // Second load - should use cache-busted import
      await host.reload();
      const secondLoad = host.find('test-plugin-cjs');
      expect(secondLoad).toBeDefined();
      
      // Both loads should succeed (cache busting works)
      expect(firstLoad?.manifest.name).toBe(secondLoad?.manifest.name);
    });

    it('should clear previous plugins on reload', async () => {
      const host = new PluginHost({
        folder: fixturesPath,
      });

      await host.reload();
      const firstCount = host.getAll().length;
      expect(firstCount).toBeGreaterThan(0);

      await host.reload();
      const secondCount = host.getAll().length;
      expect(secondCount).toBe(firstCount);
    });
  });

  describe('Plugin validation', () => {
    it('should accept plugins that pass validator', async () => {
      interface ValidPlugin {
        name: string;
        execute: (input: string) => string;
      }

      const validator = (plugin: unknown): plugin is ValidPlugin => {
        return (
          typeof plugin === 'object' &&
          plugin !== null &&
          'name' in plugin &&
          'execute' in plugin &&
          typeof (plugin as Record<string, unknown>).execute === 'function'
        );
      };

      const host = new PluginHost<ValidPlugin>({
        folder: fixturesPath,
        validator,
      });

      await host.reload();

      // CJS plugins have name and execute, so they should pass
      const plugins = host.getAll();
      expect(plugins.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject plugins that fail validator', async () => {
      interface StrictPlugin {
        name: string;
        strictMethod: () => void;
      }

      const validator = (plugin: unknown): plugin is StrictPlugin => {
        return (
          typeof plugin === 'object' &&
          plugin !== null &&
          'strictMethod' in plugin &&
          typeof (plugin as Record<string, unknown>).strictMethod === 'function'
        );
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      const host = new PluginHost<StrictPlugin>({
        folder: fixturesPath,
        validator,
      });

      await host.reload();

      // None of our test plugins have strictMethod, so all should be rejected
      const plugins = host.getAll();
      expect(plugins.length).toBe(0);

      // Should have warned about validation failures
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Single-plugin mode (pluginPath)', () => {
    it('should load the CJS plugin directly via pluginPath', async () => {
      const host = new PluginHost({ pluginPath: cjsPluginPath });

      await host.reload();

      const plugins = host.getAll();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].manifest.name).toBe('test-plugin-cjs');
    });

    it('should find the directly-loaded plugin by name', async () => {
      const host = new PluginHost({ pluginPath: cjsPluginPath });

      await host.reload();

      const plugin = host.find('test-plugin-cjs');
      expect(plugin).toBeDefined();
      expect(plugin?.manifest.version).toBe('1.0.0');
    });

    it('should not load sibling plugins when using pluginPath', async () => {
      // Only the explicitly pointed-at plugin should be loaded, not the whole fixtures folder
      const host = new PluginHost({ pluginPath: cjsPluginPath });

      await host.reload();

      const plugins = host.getAll();
      expect(plugins).toHaveLength(1);
    });

    it('should reload the single plugin on subsequent calls', async () => {
      const host = new PluginHost({ pluginPath: cjsPluginPath });

      await host.reload();
      const first = host.find('test-plugin-cjs');
      expect(first).toBeDefined();

      await host.reload();
      const second = host.find('test-plugin-cjs');
      expect(second).toBeDefined();
      expect(second?.manifest.name).toBe(first?.manifest.name);
    });

    it('should apply the validator in single-plugin mode', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      interface StrictPlugin { strictMethod: () => void; }
      const validator = (p: unknown): p is StrictPlugin =>
        typeof p === 'object' && p !== null && 'strictMethod' in p;

      const host = new PluginHost<StrictPlugin>({ pluginPath: cjsPluginPath, validator });

      await host.reload();

      // CJS fixture does not have strictMethod – should be rejected
      expect(host.getAll()).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Plugin validation failed'),
      );

      consoleSpy.mockRestore();
    });
  });
});
