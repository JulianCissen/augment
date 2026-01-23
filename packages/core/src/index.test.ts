import { describe, it, expect } from '@jest/globals';
import { add } from './index.js';

describe('Core Package', () => {
  it('should pass a basic test', () => {
    expect(add(2, 3)).toBe(5);
  });
});
