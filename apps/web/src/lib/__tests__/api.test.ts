import { describe, it, expect } from 'vitest';
import { ApiError } from '../api';

describe('API utilities', () => {
  it('formats currency for India', () => {
    const amount = 185000;
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
    expect(formatted).toContain('1,85');
  });

  it('handles empty search params', () => {
    const q = new URLSearchParams();
    expect(q.toString()).toBe('');
  });
});

describe('ApiError', () => {
  it('creates error with message and status', () => {
    const err = new ApiError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
    expect(err.name).toBe('ApiError');
  });

  it('creates error with code and details', () => {
    const err = new ApiError('Validation failed', 400, 'VALIDATION_ERROR', { field: 'email' });
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ field: 'email' });
  });
});
