/**
 * My Augment Plugin
 * 
 * This is a template for creating plugins for the Augment plugin system.
 * Replace this code with your own plugin implementation.
 */

/**
 * Plugin interface - define your plugin's structure
 */
export interface MyPlugin {
  name: string;
  version: string;
  execute: (input: string) => string;
  shutdown?: () => void;
}

/**
 * Plugin implementation
 */
const plugin: MyPlugin = {
  name: 'My Augment Plugin',
  version: '1.0.0',
  
  /**
   * Main plugin functionality
   * @param input - Input string to process
   * @returns Processed output
   */
  execute: (input: string): string => {
    return `Plugin processed: ${input}`;
  },
  
  /**
   * Optional cleanup function called when plugin is unloaded
   */
  shutdown: (): void => {
    console.log('Plugin shutting down...');
  },
};

export default plugin;
