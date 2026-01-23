import { readdir, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';
import { tmpdir } from 'os';
import AdmZip from 'adm-zip';

/**
 * Scanner for discovering plugin artifacts in a directory.
 * Supports both plugin folders and .zip archives.
 */
export class PluginScanner {
  private readonly cacheDir: string;

  constructor(private readonly rootPath: string) {
    this.cacheDir = join(tmpdir(), 'augment-cache');
  }

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

  /**
   * Scans the root path for .zip archives containing plugins.
   * Each .zip file is extracted to a temporary cache directory.
   * @returns Array of absolute paths to extracted plugin directories
   */
  async scanZipFiles(): Promise<string[]> {
    try {
      const entries = await readdir(this.rootPath, { withFileTypes: true });
      const pluginPaths: string[] = [];

      // Ensure cache directory exists
      await mkdir(this.cacheDir, { recursive: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.zip')) {
          const zipPath = join(this.rootPath, entry.name);
          const extractPath = await this.extractZip(zipPath, entry.name);

          if (extractPath) {
            pluginPaths.push(extractPath);
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

  /**
   * Extracts a ZIP file to the cache directory and validates it contains a manifest
   * @param zipPath - Path to the ZIP file
   * @param zipName - Name of the ZIP file
   * @returns Path to extracted directory if valid, null otherwise
   */
  private async extractZip(zipPath: string, zipName: string): Promise<string | null> {
    try {
      const zip = new AdmZip(zipPath);
      const pluginName = zipName.replace('.zip', '');
      const extractPath = join(this.cacheDir, pluginName);

      // Extract to cache directory
      zip.extractAllTo(extractPath, true);

      // Verify the extracted directory contains a manifest
      const manifestPath = join(extractPath, 'plugin.manifest.json');
      try {
        await access(manifestPath, constants.R_OK);
        return extractPath;
      } catch {
        // No manifest found in extracted content
        return null;
      }
    } catch (error) {
      // Failed to extract or read ZIP file
      console.warn(`Failed to extract ${zipName}:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Scans for all plugin artifacts (directories and ZIP archives)
   * @returns Array of absolute paths to all discovered plugins
   */
  async scan(): Promise<string[]> {
    const [directories, zipFiles] = await Promise.all([
      this.scanDirectories(),
      this.scanZipFiles(),
    ]);

    return [...directories, ...zipFiles];
  }
}
