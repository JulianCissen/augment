import { readFile } from 'fs/promises';
import { join } from 'path';
import type { PluginManifest } from './types.js';

/**
 * Custom error for manifest parsing failures
 */
export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManifestValidationError';
  }
}

/**
 * Validates that a parsed manifest object contains all required fields
 */
function validateManifest(data: unknown): asserts data is PluginManifest {
  if (typeof data !== 'object' || data === null) {
    throw new ManifestValidationError('Manifest must be a JSON object');
  }

  const manifest = data as Record<string, unknown>;

  if (typeof manifest.name !== 'string' || manifest.name.trim() === '') {
    throw new ManifestValidationError('Manifest must contain a non-empty "name" field');
  }

  if (typeof manifest.version !== 'string' || manifest.version.trim() === '') {
    throw new ManifestValidationError('Manifest must contain a non-empty "version" field');
  }

  if (typeof manifest.entryPoint !== 'string' || manifest.entryPoint.trim() === '') {
    throw new ManifestValidationError('Manifest must contain a non-empty "entryPoint" field');
  }

  if (manifest.meta !== undefined && typeof manifest.meta !== 'object') {
    throw new ManifestValidationError('Manifest "meta" field must be an object if provided');
  }
}

/**
 * Reads and parses a plugin.manifest.json file from a directory
 * @param pluginPath - Absolute path to the plugin directory
 * @returns Validated PluginManifest object
 * @throws ManifestValidationError if the manifest is invalid or missing
 */
export async function readManifest(pluginPath: string): Promise<PluginManifest> {
  const manifestPath = join(pluginPath, 'plugin.manifest.json');

  try {
    const content = await readFile(manifestPath, 'utf-8');

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new ManifestValidationError(
        `Invalid JSON in manifest: ${(error as Error).message}`
      );
    }

    validateManifest(parsed);
    return parsed;
  } catch (error) {
    if (error instanceof ManifestValidationError) {
      throw error;
    }

    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ManifestValidationError(
        `Manifest file not found: ${manifestPath}`
      );
    }

    throw new ManifestValidationError(
      `Failed to read manifest: ${(error as Error).message}`
    );
  }
}
