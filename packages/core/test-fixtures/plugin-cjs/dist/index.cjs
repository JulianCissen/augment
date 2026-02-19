// CJS Plugin Test Fixture
const name = 'CJS Test Plugin';
const version = '1.0.0';
const format = 'cjs';

function execute(input) {
  return `CJS processed: ${input}`;
}

function getMetadata() {
  return {
    name,
    version,
    format,
    loadedAt: Date.now()
  };
}

module.exports = {
  name,
  version,
  format,
  execute,
  getMetadata
};
