/**
 * Test plugin for verifying the builder
 */

export interface TestPlugin {
  name: string;
  version: string;
  execute: () => string;
}

const plugin: TestPlugin = {
  name: 'Test Plugin',
  version: '1.0.0',
  execute: () => {
    return 'Test plugin executed successfully!';
  },
};

export default plugin;
