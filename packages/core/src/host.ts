import { PluginScanner } from './scanner.js';
import { readManifest } from './manifest.js';
import type { PluginHostOptions, PluginManifest } from './types.js';

/**
 * Internal wrapper for plugin state
 */
interface PluginWrapper<T> {
  manifest: PluginManifest;
  pluginPath: string;
  plugin?: T;
}

/**
 * Central registry and lifecycle manager for plugins.
 * Discovers, validates, and manages plugin instances.
 */
export class PluginHost<T = unknown> {
  private plugins: Map<string, PluginWrapper<T>> = new Map<string, PluginWrapper<T>>();

  constructor(private readonly options: PluginHostOptions<T>) {}

  /**
   * Scans the plugin folder, parses manifests, and updates the registry.
   * This method does not load plugin code yet (will be added in Step 9).
   */
  async reload(): Promise<void> {
    this.plugins.clear();

    const scanner = new PluginScanner(this.options.folder);
    const pluginPaths = await scanner.scan();

    for (const pluginPath of pluginPaths) {
      try {
        const manifest = await readManifest(pluginPath);

        this.plugins.set(manifest.name, {
          manifest,
          pluginPath,
        });
      } catch (error) {
        // Skip plugins with invalid manifests
        console.warn(
          `Failed to load plugin at ${pluginPath}:`,
          (error as Error).message
        );
      }
    }
  }

  /**
   * Retrieves all registered plugins
   * @returns Array of plugin manifests (without loaded code for now)
   */
  getAll(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((wrapper) => wrapper.manifest);
  }

  /**
   * Finds a plugin by name
   * @param name - The plugin name to search for
   * @returns The plugin manifest if found, undefined otherwise
   */
  find(name: string): PluginManifest | undefined {
    return this.plugins.get(name)?.manifest;
  }
}
