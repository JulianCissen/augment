/**
 * Hello World Plugin
 * 
 * A minimal example demonstrating the Moduul plugin system.
 * This plugin greets users and demonstrates basic plugin structure.
 */

/**
 * Hello World Plugin Interface
 */
export interface HelloWorldPlugin {
  name: string;
  version: string;
  greet: (name?: string) => string;
  getInfo: () => { uptime: number; callCount: number };
}

// Plugin state
let callCount = 0;
const startTime = Date.now();

/**
 * Hello World Plugin Implementation
 */
const plugin: HelloWorldPlugin = {
  name: 'Hello World Plugin',
  version: '1.0.0',
  
  /**
   * Greet a user by name
   * @param name - Optional name to greet
   * @returns Greeting message
   */
  greet: (name?: string): string => {
    callCount++;
    const greeting = name 
      ? `Hello, ${name}! Welcome to Moduul plugins.`
      : 'Hello, World! This is a Moduul plugin.';
    
    console.log(`[HelloWorld] ${greeting}`);
    return greeting;
  },
  
  /**
   * Get plugin statistics
   * @returns Plugin info including uptime and call count
   */
  getInfo: () => {
    const uptime = Date.now() - startTime;
    return {
      uptime,
      callCount,
    };
  },
};

export default plugin;
