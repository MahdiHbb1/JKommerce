import { describe, it, expect } from 'vitest';
import { formatIDR } from '../money.js';

describe('formatIDR', () => {
  it('format ribuan dengan titik', () => expect(formatIDR(1234567)).toBe('Rp1.234.567'));
  it('nol', () => expect(formatIDR(0)).toBe('Rp0'));
  it('menolak nilai non-integer', () => expect(() => formatIDR(10.5)).toThrow());
});
