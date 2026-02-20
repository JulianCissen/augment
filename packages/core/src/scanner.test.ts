import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PluginScanner } from './scanner.js';
import * as fs from 'fs/promises';
import { sep } from 'path';
import AdmZip from 'adm-zip';

jest.mock('fs/promises');
jest.mock('adm-zip');

const mockReaddir = fs.readdir as jest.MockedFunction<typeof fs.readdir>;
const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;

describe('PluginScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scanDirectories', () => {
    it('should find directories containing plugin.manifest.json', async () => {
      const mockDirents = [
        { name: 'plugin-a', isDirectory: (): boolean => true, isFile: (): boolean => false },
        { name: 'plugin-b', isDirectory: (): boolean => true, isFile: (): boolean => false },
        { name: 'not-a-plugin', isDirectory: (): boolean => true, isFile: (): boolean => false },
        { name: 'file.txt', isDirectory: (): boolean => false, isFile: (): boolean => true },
      ];

      mockReaddir.mockResolvedValue(mockDirents as never);
      mockAccess.mockImplementation(async (path: string | Buffer | URL) => {
        const pathStr = path.toString();
        if (pathStr.includes('plugin-a') || pathStr.includes('plugin-b')) {
          return Promise.resolve();
        }
        throw new Error('ENOENT');
      });

      const scanner = new PluginScanner('/test/plugins');
      const result = await scanner.scanDirectories();

      expect(result).toHaveLength(2);
      expect(result).toContain(`${sep}test${sep}plugins${sep}plugin-a`);
      expect(result).toContain(`${sep}test${sep}plugins${sep}plugin-b`);
      expect(result).not.toContain(`${sep}test${sep}plugins${sep}not-a-plugin`);
    });

    it('should return empty array when no plugin directories exist', async () => {
      const mockDirents = [
        { name: 'folder1', isDirectory: (): boolean => true, isFile: (): boolean => false },
        { name: 'folder2', isDirectory: (): boolean => true, isFile: (): boolean => false },
      ];

      mockReaddir.mockResolvedValue(mockDirents as never);
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const scanner = new PluginScanner('/test/plugins');
      const result = await scanner.scanDirectories();

      expect(result).toHaveLength(0);
    });

    it('should ignore files in the root directory', async () => {
      const mockDirents = [
        { name: 'file1.txt', isDirectory: (): boolean => false, isFile: (): boolean => true },
        { name: 'file2.js', isDirectory: (): boolean => false, isFile: (): boolean => true },
      ];

      mockReaddir.mockResolvedValue(mockDirents as never);

      const scanner = new PluginScanner('/test/plugins');
      const result = await scanner.scanDirectories();

      expect(result).toHaveLength(0);
      expect(mockAccess).not.toHaveBeenCalled();
    });

    it('should throw error when root path does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReaddir.mockRejectedValue(error);

      const scanner = new PluginScanner('/nonexistent');

      await expect(scanner.scanDirectories()).rejects.toThrow(
        'Plugin directory not found: /nonexistent'
      );
    });

    it('should propagate other filesystem errors', async () => {
      const error = new Error('Permission denied');
      mockReaddir.mockRejectedValue(error);

      const scanner = new PluginScanner('/test/plugins');

      await expect(scanner.scanDirectories()).rejects.toThrow('Permission denied');
    });
  });

  describe('scanZipFiles', () => {
    it('should find and extract .zip files containing plugins', async () => {
      const mockDirents = [
        { name: 'plugin-a.zip', isDirectory: (): boolean => false, isFile: (): boolean => true },
        { name: 'plugin-b.zip', isDirectory: (): boolean => false, isFile: (): boolean => true },
        { name: 'not-plugin.txt', isDirectory: (): boolean => false, isFile: (): boolean => true },
      ];

      mockReaddir.mockResolvedValue(mockDirents as never);
      mockMkdir.mockResolvedValue(undefined);

      const mockZipInstance = {
        extractAllTo: jest.fn(),
      };
      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => mockZipInstance as never);

      mockAccess.mockResolvedValue(undefined);

      const scanner = new PluginScanner('/test/plugins');
      const result = await scanner.scanZipFiles();

      expect(result).toHaveLength(2);
      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('moduul-cache'), {
        recursive: true,
      });
      expect(mockZipInstance.extractAllTo).toHaveBeenCalledTimes(2);
    });

    it('should skip .zip files without manifest', async () => {
      const mockDirents = [
        { name: 'invalid.zip', isDirectory: (): boolean => false, isFile: (): boolean => true },
      ];

      mockReaddir.mockResolvedValue(mockDirents as never);
      mockMkdir.mockResolvedValue(undefined);

      const mockZipInstance = {
        extractAllTo: jest.fn(),
      };
      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => mockZipInstance as never);

      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const scanner = new PluginScanner('/test/plugins');
      const result = await scanner.scanZipFiles();

      expect(result).toHaveLength(0);
    });

    it('should return empty array when no .zip files exist', async () => {
      const mockDirents = [
        { name: 'folder1', isDirectory: (): boolean => true, isFile: (): boolean => false },
        { name: 'file.txt', isDirectory: (): boolean => false, isFile: (): boolean => true },
      ];

      mockReaddir.mockResolvedValue(mockDirents as never);
      mockMkdir.mockResolvedValue(undefined);

      const scanner = new PluginScanner('/test/plugins');
      const result = await scanner.scanZipFiles();

      expect(result).toHaveLength(0);
    });
  });

  describe('scan', () => {
    it('should return combined results from directories and zip files', async () => {
      const mockDirents = [
        { name: 'plugin-folder', isDirectory: (): boolean => true, isFile: (): boolean => false },
        { name: 'plugin.zip', isDirectory: (): boolean => false, isFile: (): boolean => true },
      ];

      mockReaddir.mockResolvedValue(mockDirents as never);
      mockMkdir.mockResolvedValue(undefined);
      mockAccess.mockResolvedValue(undefined);

      const mockZipInstance = {
        extractAllTo: jest.fn(),
      };
      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => mockZipInstance as never);

      const scanner = new PluginScanner('/test/plugins');
      const result = await scanner.scan();

      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });
});
