import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { readManifest, ManifestValidationError } from './manifest.js';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

describe('ManifestParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readManifest', () => {
    it('should successfully parse a valid manifest', async () => {
      const validManifest = {
        name: 'test-plugin',
        version: '1.0.0',
        entryPoint: './dist/index.js',
        meta: { type: 'test' },
      };

      mockReadFile.mockResolvedValue(JSON.stringify(validManifest));

      const result = await readManifest('/plugins/test-plugin');

      expect(result).toEqual(validManifest);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('plugin.manifest.json'),
        'utf-8'
      );
    });

    it('should parse manifest without optional meta field', async () => {
      const validManifest = {
        name: 'test-plugin',
        version: '1.0.0',
        entryPoint: './dist/index.js',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(validManifest));

      const result = await readManifest('/plugins/test-plugin');

      expect(result).toEqual(validManifest);
    });

    it('should throw error when manifest file is not found', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      await expect(readManifest('/plugins/missing')).rejects.toThrow(ManifestValidationError);
      await expect(readManifest('/plugins/missing')).rejects.toThrow(
        'Manifest file not found'
      );
    });

    it('should throw error when manifest contains invalid JSON', async () => {
      mockReadFile.mockResolvedValue('{ invalid json }');

      await expect(readManifest('/plugins/bad-json')).rejects.toThrow(ManifestValidationError);
      await expect(readManifest('/plugins/bad-json')).rejects.toThrow('Invalid JSON');
    });

    it('should throw error when name field is missing', async () => {
      const invalidManifest = {
        version: '1.0.0',
        entryPoint: './dist/index.js',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(invalidManifest));

      await expect(readManifest('/plugins/no-name')).rejects.toThrow(ManifestValidationError);
      await expect(readManifest('/plugins/no-name')).rejects.toThrow('name');
    });

    it('should throw error when version field is missing', async () => {
      const invalidManifest = {
        name: 'test-plugin',
        entryPoint: './dist/index.js',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(invalidManifest));

      await expect(readManifest('/plugins/no-version')).rejects.toThrow(ManifestValidationError);
      await expect(readManifest('/plugins/no-version')).rejects.toThrow('version');
    });

    it('should throw error when entryPoint field is missing', async () => {
      const invalidManifest = {
        name: 'test-plugin',
        version: '1.0.0',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(invalidManifest));

      await expect(readManifest('/plugins/no-entry')).rejects.toThrow(ManifestValidationError);
      await expect(readManifest('/plugins/no-entry')).rejects.toThrow('entryPoint');
    });

    it('should throw error when name is empty string', async () => {
      const invalidManifest = {
        name: '   ',
        version: '1.0.0',
        entryPoint: './dist/index.js',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(invalidManifest));

      await expect(readManifest('/plugins/empty-name')).rejects.toThrow(ManifestValidationError);
      await expect(readManifest('/plugins/empty-name')).rejects.toThrow('non-empty "name"');
    });

    it('should throw error when manifest is not an object', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify('not an object'));

      await expect(readManifest('/plugins/invalid')).rejects.toThrow(ManifestValidationError);
      await expect(readManifest('/plugins/invalid')).rejects.toThrow('must be a JSON object');
    });

    it('should throw error when manifest is null', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(null));

      await expect(readManifest('/plugins/null')).rejects.toThrow(ManifestValidationError);
      await expect(readManifest('/plugins/null')).rejects.toThrow('must be a JSON object');
    });

    it('should throw error when meta field is not an object', async () => {
      const invalidManifest = {
        name: 'test-plugin',
        version: '1.0.0',
        entryPoint: './dist/index.js',
        meta: 'not an object',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(invalidManifest));

      await expect(readManifest('/plugins/bad-meta')).rejects.toThrow(ManifestValidationError);
      await expect(readManifest('/plugins/bad-meta')).rejects.toThrow('meta');
    });
  });
});
