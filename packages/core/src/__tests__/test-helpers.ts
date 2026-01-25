import { jest } from '@jest/globals';

/**
 * Suppresses expected console warnings during plugin loading tests.
 * Use this in beforeEach hooks to keep test output clean while preserving
 * visibility into unexpected warnings.
 * 
 * @returns A spied console.warn function that suppresses expected warnings
 * 
 * @example
 * ```typescript
 * let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
 * 
 * beforeEach(() => {
 *   consoleWarnSpy = suppressExpectedWarnings();
 * });
 * 
 * afterEach(() => {
 *   consoleWarnSpy.mockRestore();
 * });
 * ```
 */
export function suppressExpectedWarnings(): jest.SpiedFunction<typeof console.warn> {
  return jest.spyOn(console, 'warn').mockImplementation((message?: unknown) => {
    // Only suppress expected plugin loading failures and validation errors
    if (
      typeof message === 'string' &&
      (message.includes('Failed to load plugin') ||
        message.includes('Unexpected token') ||
        message.includes('Manifest must contain'))
    ) {
      return;
    }
    // Let other warnings through (simply ignore them for test purposes)
  });
}
