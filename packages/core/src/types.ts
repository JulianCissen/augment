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
 * Configuration options for the PluginHost in multi-plugin (folder scan) mode.
 * The host will scan the folder for subdirectories (or .zip archives) that each
 * contain a `plugin.manifest.json`.
 */
export interface PluginHostFolderOptions<T> {
  /**
   * Filesystem path to a directory containing plugin subdirectories or .zip archives.
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
 * Configuration options for the PluginHost in single-plugin mode.
 * The host loads exactly one plugin from the given directory, which must
 * contain a `plugin.manifest.json` at its root.
 */
export interface PluginHostSingleOptions<T> {
  /**
   * Filesystem path to a single plugin directory.
   * The directory must contain a `plugin.manifest.json` file.
   */
  pluginPath: string;

  /**
   * Optional runtime validator to ensure loaded plugins match expected signature.
   * Use TypeScript type guards for type-safe validation.
   * @param plugin - The loaded plugin module
   * @returns true if plugin matches type T
   */
  validator?: (plugin: unknown) => plugin is T;
}

/**
 * Configuration options for initializing the PluginHost.
 *
 * Use `folder` (multi-plugin mode) to scan a directory for plugin subdirectories,
 * or `pluginPath` (single-plugin mode) to load one specific plugin directory directly.
 */
export type PluginHostOptions<T> = PluginHostFolderOptions<T> | PluginHostSingleOptions<T>;

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
