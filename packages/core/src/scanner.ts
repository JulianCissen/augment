import { readdir, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

/**
 * Scanner for discovering plugin artifacts in a directory.
 * Supports both plugin folders and .zip archives.
 */
export class PluginScanner {
  constructor(private readonly rootPath: string) {}

  /**
   * Scans the root path for valid plugin directories.
   * A directory is considered a valid plugin if it contains a `plugin.manifest.json` file.
   * @returns Array of absolute paths to plugin directories
   */
  async scanDirectories(): Promise<string[]> {
    try {
      const entries = await readdir(this.rootPath, { withFileTypes: true });
      const pluginPaths: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = join(this.rootPath, entry.name);
          const manifestPath = join(dirPath, 'plugin.manifest.json');

          try {
            await access(manifestPath, constants.R_OK);
            pluginPaths.push(dirPath);
          } catch {
            // Directory doesn't contain a manifest, skip it
          }
        }
      }

      return pluginPaths;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Plugin directory not found: ${this.rootPath}`);
      }
      throw error;
    }
  }
}
