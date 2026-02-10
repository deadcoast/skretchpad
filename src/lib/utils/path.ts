export function getDisplayNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || 'Untitled';
}

export function coercePathString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && value !== null && 'path' in value) {
    return coercePathString((value as { path: unknown }).path);
  }
  return null;
}
