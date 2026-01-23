/**
 * Manifest file that defines plugin metadata and entry point.
 * This file must be named `plugin.manifest.json` and placed in the plugin root.
 */
export interface PluginManifest {
  /**
   * Unique name identifier for the plugin
   */
  name: string;

  /**
   * Semantic version of the plugin
   */
  version: string;

  /**
   * Path to the plugin's entry point (relative to manifest location)
   * @example "./dist/index.js"
   */
  entryPoint: string;

  /**
   * Arbitrary metadata defined by the host application.
   * Can be used to store host-specific configuration or categorization.
   */
  meta?: Record<string, unknown>;
}

/**
 * Configuration options for initializing the PluginHost
 */
export interface PluginHostOptions<T> {
  /**
   * Filesystem path where plugins are located.
   * Can contain plugin folders or .zip archives.
   */
  folder: string;

  /**
   * Optional runtime validator to ensure loaded plugins match expected signature.
   * Use TypeScript type guards for type-safe validation.
   * @param plugin - The loaded plugin module
   * @returns true if plugin matches type T
   */
  validator?: (plugin: unknown) => plugin is T;
}

/**
 * Represents a successfully loaded plugin with its manifest and code
 */
export interface LoadedPlugin<T> {
  /**
   * The parsed manifest metadata
   */
  manifest: PluginManifest;

  /**
   * The loaded plugin code (matching signature T)
   */
  plugin: T;
}
