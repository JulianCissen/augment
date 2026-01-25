/**
 * Jest configuration for ESM integration tests
 * This config enables experimental ESM support to test native ES module loading
 */
export default {
  displayName: 'esm-integration',
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['<rootDir>/src/**/*.esm.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.esm.json',
      },
    ],
  },
};
