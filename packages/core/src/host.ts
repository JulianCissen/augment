import { PluginScanner } from './scanner.js';
import { readManifest } from './manifest.js';
import type { PluginHostOptions, PluginManifest, LoadedPlugin } from './types.js';
import { join } from 'path';
import { pathToFileURL } from 'url';

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
   * Scans the plugin folder, parses manifests, loads plugin code, and updates the registry.
   * Uses cache-busting to enable hot reloading of plugins.
   */
  async reload(): Promise<void> {
    this.plugins.clear();

    const scanner = new PluginScanner(this.options.folder);
    const pluginPaths = await scanner.scan();

    for (const pluginPath of pluginPaths) {
      try {
        const manifest = await readManifest(pluginPath);

        // Construct the full path to the entry point
        const entryPointPath = join(pluginPath, manifest.entryPoint);

        // Convert to file:// URL and add cache-busting query parameter
        const fileUrl = pathToFileURL(entryPointPath);
        fileUrl.searchParams.set('t', Date.now().toString());

        // Dynamically import the plugin module
        const loadedModule = await import(fileUrl.href) as { default?: T };

        // Extract the default export or the entire module
        const pluginCode: unknown = loadedModule.default ?? loadedModule;

        // Validate the plugin if a validator is provided
        if (this.options.validator) {
          if (!this.options.validator(pluginCode)) {
            console.warn(
              `Plugin validation failed for ${manifest.name} at ${pluginPath}`
            );
            continue;
          }
        }

        this.plugins.set(manifest.name, {
          manifest,
          pluginPath,
          plugin: pluginCode as T,
        });
      } catch (error) {
        // Skip plugins with invalid manifests or import errors
        console.warn(
          `Failed to load plugin at ${pluginPath}:`,
          (error as Error).message
        );
      }
    }
  }

  /**
   * Retrieves all registered plugins with their loaded code
   * @returns Array of loaded plugins with manifests and plugin instances
   */
  getAll(): LoadedPlugin<T>[] {
    return Array.from(this.plugins.values())
      .filter((wrapper) => wrapper.plugin !== undefined)
      .map((wrapper) => ({
        manifest: wrapper.manifest,
        plugin: wrapper.plugin as T,
      }));
  }

  /**
   * Finds a loaded plugin by name
   * @param name - The plugin name to search for
   * @returns The loaded plugin with manifest and code if found, undefined otherwise
   */
  find(name: string): LoadedPlugin<T> | undefined {
    const wrapper = this.plugins.get(name);
    if (wrapper?.plugin !== undefined) {
      return {
        manifest: wrapper.manifest,
        plugin: wrapper.plugin,
      };
    }
    return undefined;
  }
}
