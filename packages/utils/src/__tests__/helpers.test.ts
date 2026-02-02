import { describe, it, expect } from 'vitest';
import { generateId, generateShortId, sleep } from '../helpers';

describe('helpers', () => {
  describe('generateId', () => {
    it('returns string without prefix', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('returns prefixed id when prefix provided', () => {
      const id = generateId('prd');
      expect(id.startsWith('prd_')).toBe(true);
    });
  });

  describe('generateShortId', () => {
    it('returns uppercase string', () => {
      const id = generateShortId();
      expect(id).toBe(id.toUpperCase());
      expect(id.length).toBe(10);
    });
  });

  describe('sleep', () => {
    it('resolves after specified ms', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });
});
