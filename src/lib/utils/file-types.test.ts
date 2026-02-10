import { describe, expect, it } from 'vitest';
import { getFileCategory, getFileVisual } from './file-types';

describe('file-types', () => {
  it('categorizes configured files', () => {
    expect(getFileCategory('package.json')).toBe('config');
  });

  it('categorizes hidden files and dot-prefixed entries as hidden', () => {
    expect(getFileCategory('AGENTS.md')).toBe('hidden');
    expect(getFileCategory('.env')).toBe('hidden');
    expect(getFileVisual('.git', true).category).toBe('hidden');
  });

  it('categorizes development and docs by extension', () => {
    expect(getFileCategory('index.ts')).toBe('development');
    expect(getFileCategory('README.md')).toBe('documentation');
  });

  it('builds language badges', () => {
    expect(getFileVisual('main.rs', false).badge).toBe('RS');
    expect(getFileVisual('index.tsx', false).badge).toBe('TSX');
  });

  it('builds syntax glyphs and fallback glyphs', () => {
    expect(getFileVisual('schema.json', false).glyph).toBe('{}');
    expect(getFileVisual('mystery.bin', false).glyph).toBe('FILE');
  });
});
