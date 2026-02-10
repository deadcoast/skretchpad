import { describe, expect, it } from 'vitest';
import { coercePathString, getDisplayNameFromPath } from './path';

describe('getDisplayNameFromPath', () => {
  it('extracts file name from POSIX paths', () => {
    expect(getDisplayNameFromPath('/tmp/example.txt')).toBe('example.txt');
  });

  it('extracts file name from Windows paths', () => {
    expect(getDisplayNameFromPath('C:\\Users\\ryan\\notes.md')).toBe('notes.md');
  });
});

describe('coercePathString', () => {
  it('returns strings as-is', () => {
    expect(coercePathString('/tmp/file.ts')).toBe('/tmp/file.ts');
  });

  it('extracts nested path objects', () => {
    expect(coercePathString({ path: { path: '/tmp/file.ts' } })).toBe('/tmp/file.ts');
  });

  it('returns null for invalid payloads', () => {
    expect(coercePathString({ file: '/tmp/file.ts' })).toBeNull();
  });
});
