import { vi } from 'vitest';

export const homeDir = vi.fn(async () => '/home/testuser');
export const appDataDir = vi.fn(async () => '/home/testuser/.local/share');
export const appConfigDir = vi.fn(async () => '/home/testuser/.config');
export const resolve = vi.fn(async (...paths: string[]) => paths.join('/'));
export const join = vi.fn(async (...paths: string[]) => paths.join('/'));
export const basename = vi.fn(async (path: string) => path.split('/').pop() || '');
export const dirname = vi.fn(async (path: string) => {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/');
});
