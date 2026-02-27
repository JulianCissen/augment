import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PluginHost } from './host.js';
import type { PluginHostOptions, PluginHostFolderOptions, PluginHostSingleOptions } from './types.js';
import * as scannerModule from './scanner.js';
import * as manifestModule from './manifest.js';
import { suppressExpectedWarnings } from './__tests__/test-helpers.js';

jest.mock('./scanner.js');
jest.mock('./manifest.js');

const mockScan = jest.fn<() => Promise<string[]>>();
const mockReadManifest = manifestModule.readManifest as jest.MockedFunction<
  typeof manifestModule.readManifest
>;

describe('PluginHost', () => {
  const mockFolderOptions: PluginHostFolderOptions<unknown> = {
    folder: '/test/plugins',
  };
  // Keep the alias so existing tests below don't need to change
  const mockOptions: PluginHostOptions<unknown> = mockFolderOptions;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = suppressExpectedWarnings();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create an instance with provided options', () => {
      const host = new PluginHost(mockOptions);
      expect(host).toBeInstanceOf(PluginHost);
    });
  });

  describe('reload', () => {
    it('should call scanner and manifest reader', async () => {
      const mockPaths = ['/test/plugins/plugin-a'];
      const mockManifest = {
        name: 'plugin-a',
        version: '1.0.0',
        entryPoint: './index.js',
      };

      (scannerModule.PluginScanner as jest.MockedClass<typeof scannerModule.PluginScanner>).prototype.scan =
        mockScan.mockResolvedValue(mockPaths) as never;

      mockReadManifest.mockResolvedValueOnce(mockManifest);

      const host = new PluginHost(mockOptions);
      
      // Note: This will attempt to dynamically import which will fail in unit tests
      // The full import behavior is tested in integration tests (host.integration.test.ts)
      await host.reload();
      
      // Verify scanner and manifest reader were called
      expect(mockScan).toHaveBeenCalled();
      expect(mockReadManifest).toHaveBeenCalledWith(mockPaths[0]);
    });

    it('should skip plugins with invalid manifests', async () => {
      const mockPaths = ['/test/plugins/invalid'];
      
      (scannerModule.PluginScanner as jest.MockedClass<typeof scannerModule.PluginScanner>).prototype.scan =
        mockScan.mockResolvedValue(mockPaths) as never;

      mockReadManifest.mockRejectedValueOnce(new Error('Invalid manifest'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      const host = new PluginHost(mockOptions);
      await host.reload();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load plugin'),
        'Invalid manifest'
      );

      consoleSpy.mockRestore();
    });

    it('should clear plugins on each reload', async () => {
      const host = new PluginHost(mockOptions);
      
      (scannerModule.PluginScanner as jest.MockedClass<typeof scannerModule.PluginScanner>).prototype.scan =
        mockScan.mockResolvedValueOnce([]);
      
      await host.reload();
      expect(host.getAll()).toHaveLength(0);
      
      await host.reload();
      expect(host.getAll()).toHaveLength(0);
    });
  });

  describe('getAll', () => {
    it('should return empty array when no plugins are loaded', () => {
      const host = new PluginHost(mockOptions);
      expect(host.getAll()).toEqual([]);
    });
  });

  describe('find', () => {
    it('should return undefined when plugin is not found', () => {
      const host = new PluginHost(mockOptions);
      expect(host.find('non-existent')).toBeUndefined();
    });
  });

  describe('single-plugin mode (pluginPath)', () => {
    const mockSingleOptions: PluginHostSingleOptions<unknown> = {
      pluginPath: '/test/plugins/my-plugin',
    };

    it('should create an instance with pluginPath option', () => {
      const host = new PluginHost(mockSingleOptions);
      expect(host).toBeInstanceOf(PluginHost);
    });

    it('should load the plugin at pluginPath without using the scanner', async () => {
      const mockManifest = {
        name: 'my-plugin',
        version: '1.0.0',
        entryPoint: './index.js',
      };

      mockReadManifest.mockResolvedValueOnce(mockManifest);

      const host = new PluginHost(mockSingleOptions);
      await host.reload();

      // Scanner must NOT have been used in single-plugin mode
      expect(mockScan).not.toHaveBeenCalled();
      // Manifest reader must have been called with the pluginPath directly
      expect(mockReadManifest).toHaveBeenCalledWith(mockSingleOptions.pluginPath);
    });

    it('should warn and remain empty when the plugin at pluginPath fails to load', async () => {
      mockReadManifest.mockRejectedValueOnce(new Error('No manifest'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      const host = new PluginHost(mockSingleOptions);
      await host.reload();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load plugin'),
        'No manifest'
      );
      expect(host.getAll()).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should clear the registry on each reload in single-plugin mode', async () => {
      const host = new PluginHost(mockSingleOptions);

      mockReadManifest.mockRejectedValue(new Error('skip'));

      await host.reload();
      expect(host.getAll()).toHaveLength(0);

      await host.reload();
      expect(host.getAll()).toHaveLength(0);
    });
  });
});
