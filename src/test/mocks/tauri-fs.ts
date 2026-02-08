import { vi } from 'vitest';

export const readTextFile = vi.fn(async () => '');
export const writeTextFile = vi.fn(async () => {});
export const readDir = vi.fn(async () => []);
export const createDir = vi.fn(async () => {});
export const removeFile = vi.fn(async () => {});
export const removeDir = vi.fn(async () => {});
export const exists = vi.fn(async () => false);
export const copyFile = vi.fn(async () => {});
export const renameFile = vi.fn(async () => {});

export const BaseDirectory = {
  App: 'App',
  AppConfig: 'AppConfig',
  AppData: 'AppData',
  AppLog: 'AppLog',
  Home: 'Home',
  Desktop: 'Desktop',
  Document: 'Document',
  Download: 'Download',
  Temp: 'Temp',
};
