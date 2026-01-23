import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PluginHost } from './host.js';
import type { PluginHostOptions } from './types.js';
import * as scannerModule from './scanner.js';
import * as manifestModule from './manifest.js';

jest.mock('./scanner.js');
jest.mock('./manifest.js');

const mockScan = jest.fn<() => Promise<string[]>>();
const mockReadManifest = manifestModule.readManifest as jest.MockedFunction<
  typeof manifestModule.readManifest
>;

describe('PluginHost', () => {
  const mockOptions: PluginHostOptions<unknown> = {
    folder: '/test/plugins',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with provided options', () => {
      const host = new PluginHost(mockOptions);
      expect(host).toBeInstanceOf(PluginHost);
    });
  });

  describe('reload', () => {
    it('should discover plugins and populate registry', async () => {
      const mockPaths = ['/test/plugins/plugin-a', '/test/plugins/plugin-b'];
      const mockManifestA = {
        name: 'plugin-a',
        version: '1.0.0',
        entryPoint: './index.js',
      };
      const mockManifestB = {
        name: 'plugin-b',
        version: '2.0.0',
        entryPoint: './main.js',
      };

      (scannerModule.PluginScanner as jest.MockedClass<typeof scannerModule.PluginScanner>).prototype.scan =
        mockScan.mockResolvedValue(mockPaths) as never;

      mockReadManifest
        .mockResolvedValueOnce(mockManifestA)
        .mockResolvedValueOnce(mockManifestB);

      const host = new PluginHost(mockOptions);
      await host.reload();

      const plugins = host.getAll();
      expect(plugins).toHaveLength(2);
      expect(plugins).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'plugin-a' }),
          expect.objectContaining({ name: 'plugin-b' }),
        ])
      );
    });

    it('should skip plugins with invalid manifests', async () => {
      const mockPaths = ['/test/plugins/valid', '/test/plugins/invalid'];
      const mockManifest = {
        name: 'valid-plugin',
        version: '1.0.0',
        entryPoint: './index.js',
      };

      (scannerModule.PluginScanner as jest.MockedClass<typeof scannerModule.PluginScanner>).prototype.scan =
        mockScan.mockResolvedValue(mockPaths) as never;

      mockReadManifest
        .mockResolvedValueOnce(mockManifest)
        .mockRejectedValueOnce(new Error('Invalid manifest'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      const host = new PluginHost(mockOptions);
      await host.reload();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load plugin'),
        'Invalid manifest'
      );

      const plugins = host.getAll();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('valid-plugin');

      consoleSpy.mockRestore();
    });

    it('should clear previous plugins on reload', async () => {
      const firstPaths = ['/test/plugins/plugin-a'];
      const secondPaths = ['/test/plugins/plugin-b'];
      const manifestA = {
        name: 'plugin-a',
        version: '1.0.0',
        entryPoint: './index.js',
      };
      const manifestB = {
        name: 'plugin-b',
        version: '1.0.0',
        entryPoint: './index.js',
      };

      (scannerModule.PluginScanner as jest.MockedClass<typeof scannerModule.PluginScanner>).prototype.scan =
        mockScan;

      mockScan.mockResolvedValueOnce(firstPaths);
      mockReadManifest.mockResolvedValueOnce(manifestA);

      const host = new PluginHost(mockOptions);
      await host.reload();

      expect(host.getAll()).toHaveLength(1);
      expect(host.getAll()[0].name).toBe('plugin-a');

      mockScan.mockResolvedValueOnce(secondPaths);
      mockReadManifest.mockResolvedValueOnce(manifestB);

      await host.reload();

      expect(host.getAll()).toHaveLength(1);
      expect(host.getAll()[0].name).toBe('plugin-b');
    });
  });

  describe('getAll', () => {
    it('should return empty array when no plugins are loaded', () => {
      const host = new PluginHost(mockOptions);
      expect(host.getAll()).toEqual([]);
    });

    it('should return all plugin manifests', async () => {
      const mockPaths = ['/test/plugins/plugin-a'];
      const mockManifest = {
        name: 'plugin-a',
        version: '1.0.0',
        entryPoint: './index.js',
        meta: { category: 'utility' },
      };

      (scannerModule.PluginScanner as jest.MockedClass<typeof scannerModule.PluginScanner>).prototype.scan =
        mockScan.mockResolvedValue(mockPaths) as never;
      mockReadManifest.mockResolvedValue(mockManifest);

      const host = new PluginHost(mockOptions);
      await host.reload();

      const plugins = host.getAll();
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toEqual(mockManifest);
    });
  });

  describe('find', () => {
    it('should return undefined when plugin is not found', () => {
      const host = new PluginHost(mockOptions);
      expect(host.find('non-existent')).toBeUndefined();
    });

    it('should return plugin manifest when found', async () => {
      const mockPaths = ['/test/plugins/plugin-a'];
      const mockManifest = {
        name: 'plugin-a',
        version: '1.0.0',
        entryPoint: './index.js',
      };

      (scannerModule.PluginScanner as jest.MockedClass<typeof scannerModule.PluginScanner>).prototype.scan =
        mockScan.mockResolvedValue(mockPaths) as never;
      mockReadManifest.mockResolvedValue(mockManifest);

      const host = new PluginHost(mockOptions);
      await host.reload();

      const found = host.find('plugin-a');
      expect(found).toEqual(mockManifest);
    });

    it('should return undefined for non-existent plugin after reload', async () => {
      const mockPaths = ['/test/plugins/plugin-a'];
      const mockManifest = {
        name: 'plugin-a',
        version: '1.0.0',
        entryPoint: './index.js',
      };

      (scannerModule.PluginScanner as jest.MockedClass<typeof scannerModule.PluginScanner>).prototype.scan =
        mockScan.mockResolvedValue(mockPaths) as never;
      mockReadManifest.mockResolvedValue(mockManifest);

      const host = new PluginHost(mockOptions);
      await host.reload();

      expect(host.find('plugin-b')).toBeUndefined();
    });
  });
});
