// ESM Plugin Test Fixture - Bundled style
// This simulates a bundled ESM plugin (like what esbuild would produce)

const plugin = {
  name: 'ESM Test Plugin',
  version: '1.0.0',
  format: 'esm',

  execute(input) {
    return `ESM processed: ${input}`;
  },

  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      format: this.format,
      loadedAt: Date.now()
    };
  }
};

export default plugin;
