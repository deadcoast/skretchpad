import { writable } from 'svelte/store';

export const explorerRoot = writable<string | null>(null);

export function setExplorerRoot(path: string) {
  explorerRoot.set(path);
}
