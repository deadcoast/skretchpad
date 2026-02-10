export type FileCategory =
  | 'documentation'
  | 'hidden'
  | 'development'
  | 'config'
  | 'font'
  | 'media'
  | 'other';

export interface FileVisual {
  badge: string;
  glyph: string;
  category: FileCategory;
}

const hiddenByName = new Set(['agents.md', 'claude.md']);

const categoryExtensions: Record<FileCategory, string[]> = {
  documentation: ['.txt', '.docx', '.md'],
  hidden: [],
  development: [
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.rs',
    '.json',
    '.yaml',
    '.yml',
    '.toml',
    '.xml',
    '.sql',
    '.html',
    '.css',
  ],
  font: ['.ttf', '.otf', '.woff', '.woff2', '.eot', '.svg', '.fnt'],
  config: [],
  media: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.mov', '.mp3', '.wav'],
  other: [],
};

const configFiles = new Set([
  '.markdownlintrc.json',
  '.markdownlint.json',
  'agents.md',
  'claude.md',
  'pyproject.toml',
  'setup.ps1',
  'serena.project.yml',
  'package.json',
  'tauri.conf.json',
  'vite.config.ts',
  'svelte.config.js',
  'tsconfig.json',
  '.eslintrc.cjs',
  '.prettierrc',
]);

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot).toLowerCase();
}

function getLanguageBadge(fileName: string): string {
  const ext = getExtension(fileName);
  const map: Record<string, string> = {
    '.js': 'JS',
    '.ts': 'TS',
    '.jsx': 'JSX',
    '.tsx': 'TSX',
    '.py': 'PY',
    '.rs': 'RS',
    '.json': '{}',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.toml': 'TOML',
    '.xml': 'XML',
    '.sql': 'SQL',
    '.html': 'HTML',
    '.css': 'CSS',
    '.md': 'MD',
    '.txt': 'TXT',
    '.docx': 'DOC',
  };
  return map[ext] || (ext ? ext.replace('.', '').slice(0, 4).toUpperCase() : 'FILE');
}

function getLanguageGlyph(fileName: string, category: FileCategory): string {
  const ext = getExtension(fileName);
  const map: Record<string, string> = {
    '.js': 'JS',
    '.ts': 'TS',
    '.jsx': 'JSX',
    '.tsx': 'TSX',
    '.py': 'PY',
    '.rs': 'RS',
    '.json': '{}',
    '.yaml': 'YML',
    '.yml': 'YML',
    '.toml': 'TOML',
    '.xml': 'XML',
    '.sql': 'SQL',
    '.html': 'HTML',
    '.css': 'CSS',
    '.md': 'MD',
    '.txt': 'TXT',
    '.docx': 'DOC',
  };

  if (map[ext]) {
    return map[ext];
  }
  if (category === 'config') return 'CFG';
  if (category === 'font') return 'FNT';
  if (category === 'media') return 'MED';
  if (category === 'hidden') return 'DOT';
  return 'FILE';
}

export function getFileCategory(fileName: string): FileCategory {
  const lower = fileName.toLowerCase();
  if (lower.startsWith('.') || hiddenByName.has(lower)) return 'hidden';
  if (configFiles.has(lower)) return 'config';

  const ext = getExtension(lower);
  for (const category of ['documentation', 'development', 'font', 'media'] as FileCategory[]) {
    if (categoryExtensions[category].includes(ext)) {
      return category;
    }
  }
  return 'other';
}

export function getFileVisual(fileName: string, isDir: boolean): FileVisual {
  const category = getFileCategory(fileName);
  if (isDir) {
    return { badge: 'DIR', glyph: 'DIR', category };
  }
  return {
    badge: getLanguageBadge(fileName),
    glyph: getLanguageGlyph(fileName, category),
    category,
  };
}
