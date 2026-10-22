// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { corsHeadersFor, parseAllowedOrigins } from '../cors';

const ALLOWED = ['https://janoerkoeningbatik.com'];

const headersFor = (origin: string | null, allowed: string[] = ALLOWED) =>
  new Headers(corsHeadersFor(origin, allowed));

describe('corsHeadersFor', () => {
  it('mengizinkan origin yang terdaftar', () => {
    const headers = headersFor('https://janoerkoeningbatik.com');

    expect(headers.get('Access-Control-Allow-Origin')).toBe(
      'https://janoerkoeningbatik.com',
    );
    expect(headers.get('Vary')).toBe('Origin');
    expect(headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('selalu mengizinkan localhost:5173 untuk pengembangan', () => {
    const headers = headersFor('http://localhost:5173');

    expect(headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
  });

  it('tidak memberi header allow untuk origin asing', () => {
    const headers = headersFor('https://evil.example');

    expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(headers.get('Vary')).toBe('Origin');
  });

  it('tidak memberi header allow tanpa Origin', () => {
    const headers = headersFor(null);

    expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('mengabaikan wildcard pada konfigurasi', () => {
    const headers = headersFor('https://evil.example', ['*']);

    expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('parseAllowedOrigins', () => {
  it('memisah koma, memangkas spasi, dan membuang kosong', () => {
    expect(
      parseAllowedOrigins(' https://a.test, https://b.test ,, '),
    ).toEqual(['https://a.test', 'https://b.test']);
  });

  it('mengembalikan daftar kosong untuk nilai tidak ada', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
    expect(parseAllowedOrigins(null)).toEqual([]);
  });
});
