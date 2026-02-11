import { describe, expect, it } from 'vitest';
import { extractSymbolsFromContent } from './editor-loader';

describe('extractSymbolsFromContent', () => {
  it('extracts TypeScript function and class symbols using syntax tree', async () => {
    const content = `
export function alpha() { return 1; }
class Beta {}
const gamma = () => 42;
`;

    const symbols = await extractSymbolsFromContent('sample.ts', content);
    const names = symbols.map((s) => s.name);

    expect(names).toContain('alpha');
    expect(names).toContain('Beta');
  });

  it('extracts markdown headings', async () => {
    const content = `
# Title
## Section
`;
    const symbols = await extractSymbolsFromContent('README.md', content);
    const headingNames = symbols.filter((s) => s.kind === 'heading').map((s) => s.name);

    expect(headingNames).toContain('Title');
    expect(headingNames).toContain('Section');
  });
});
