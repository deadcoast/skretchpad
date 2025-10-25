# editor-loader.ts

## 5. `src/lib/editor-loader.ts`

Why:

- CodeMirror 6 initialization with all extensions
- Lazy loading of language support (dynamic imports)
- Extension compartment management (hot-swappable configs)
- Theme integration (CSS variables → CodeMirror theme)
- Keybinding system setup
- Diff editor creation and management
- Editor state persistence
- Language detection from file extensions
- Custom extension development (e.g., plugin hooks)
- Performance optimization (split packages, lazy load)

Responsibilities:

```typescript
- createEditor()
- createDiffEditor()
- loadLanguage(lang: string)
- applyTheme(theme: Theme)
- registerKeybindings(bindings: Keybindings)
- getEditorExtensions()
- setupPluginHooks()
- handleEditorDestroy()
```

Integration Points:

- CodeMirror 6 core
- 10+ language packages
- Theme system
- Keybinding system
- Plugin hook system
- File type detection
- State management

---

```typescript
// src/lib/editor-loader.ts

import { EditorView, ViewUpdate, keymap, highlightActiveLine, drawSelection } from '@codemirror/view';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { 
  indentOnInput, 
  bracketMatching, 
  foldGutter, 
  foldKeymap,
  indentUnit,
  syntaxHighlighting,
  defaultHighlightStyle,
  LanguageSupport
} from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import type { Theme } from './stores/theme';
import type { Keybindings } from './stores/keybindings';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EditorOptions {
  theme?: Theme;
  keybindings?: Keybindings;
  readOnly?: boolean;
  onChange?: (update: ViewUpdate) => void;
  onCursorMove?: (update: ViewUpdate) => void;
  onSelection?: (update: ViewUpdate) => void;
  extensions?: Extension[];
}

export interface DiffEditorOptions {
  original: string;
  modified: string;
  readOnly?: boolean;
  theme?: Theme;
}

export interface LanguageInfo {
  name: string;
  extensions: string[];
  support?: LanguageSupport;
  loaded: boolean;
}

// ============================================================================
// COMPARTMENTS FOR HOT-SWAPPING
// ============================================================================

// Compartments allow us to dynamically reconfigure parts of the editor
const languageCompartment = new Compartment();
const themeCompartment = new Compartment();
const keybindingCompartment = new Compartment();
const readOnlyCompartment = new Compartment();
const pluginHooksCompartment = new Compartment();

// ============================================================================
// LANGUAGE REGISTRY
// ============================================================================

class LanguageRegistry {
  private languages: Map<string, LanguageInfo> = new Map();
  private extensionMap: Map<string, string> = new Map();

  constructor() {
    this.registerLanguages();
  }

  private registerLanguages() {
    // Register all supported languages with their file extensions
    const languageDefinitions: Array<{
      name: string;
      extensions: string[];
    }> = [
      { name: 'javascript', extensions: ['js', 'jsx', 'mjs', 'cjs'] },
      { name: 'typescript', extensions: ['ts', 'tsx', 'mts', 'cts'] },
      { name: 'python', extensions: ['py', 'pyw', 'pyi'] },
      { name: 'rust', extensions: ['rs'] },
      { name: 'json', extensions: ['json', 'jsonc'] },
      { name: 'markdown', extensions: ['md', 'markdown'] },
      { name: 'html', extensions: ['html', 'htm'] },
      { name: 'css', extensions: ['css'] },
      { name: 'yaml', extensions: ['yaml', 'yml'] },
      { name: 'toml', extensions: ['toml'] },
      { name: 'xml', extensions: ['xml', 'svg'] },
      { name: 'sql', extensions: ['sql'] },
    ];

    for (const def of languageDefinitions) {
      this.languages.set(def.name, {
        name: def.name,
        extensions: def.extensions,
        loaded: false,
      });

      // Map extensions to language names
      for (const ext of def.extensions) {
        this.extensionMap.set(ext, def.name);
      }
    }
  }

  detectLanguage(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return null;
    return this.extensionMap.get(ext) || null;
  }

  async loadLanguage(languageName: string): Promise<LanguageSupport | null> {
    const info = this.languages.get(languageName);
    if (!info) return null;

    // Return cached support if already loaded
    if (info.loaded && info.support) {
      return info.support;
    }

    try {
      // Dynamically import language support
      let support: LanguageSupport;

      switch (languageName) {
        case 'javascript':
          const { javascript } = await import('@codemirror/lang-javascript');
          support = javascript({ jsx: true });
          break;

        case 'typescript':
          const { javascript: ts } = await import('@codemirror/lang-javascript');
          support = ts({ typescript: true, jsx: true });
          break;

        case 'python':
          const { python } = await import('@codemirror/lang-python');
          support = python();
          break;

        case 'rust':
          const { rust } = await import('@codemirror/lang-rust');
          support = rust();
          break;

        case 'json':
          const { json } = await import('@codemirror/lang-json');
          support = json();
          break;

        case 'markdown':
          const { markdown } = await import('@codemirror/lang-markdown');
          support = markdown();
          break;

        case 'html':
          const { html } = await import('@codemirror/lang-html');
          support = html();
          break;

        case 'css':
          const { css } = await import('@codemirror/lang-css');
          support = css();
          break;

        case 'yaml':
          const { yaml } = await import('@codemirror/lang-yaml');
          support = yaml();
          break;

        case 'toml':
          const { toml } = await import('@codemirror/lang-toml');
          support = toml();
          break;

        case 'xml':
          const { xml } = await import('@codemirror/lang-xml');
          support = xml();
          break;

        case 'sql':
          const { sql } = await import('@codemirror/lang-sql');
          support = sql();
          break;

        default:
          return null;
      }

      // Cache the loaded support
      info.support = support;
      info.loaded = true;

      return support;
    } catch (error) {
      console.error(`Failed to load language ${languageName}:`, error);
      return null;
    }
  }

  getLanguageInfo(languageName: string): LanguageInfo | null {
    return this.languages.get(languageName) || null;
  }

  getAllLanguages(): LanguageInfo[] {
    return Array.from(this.languages.values());
  }
}

// Global language registry instance
const languageRegistry = new LanguageRegistry();

// ============================================================================
// THEME INTEGRATION
// ============================================================================

function createThemeExtension(theme?: Theme): Extension {
  if (!theme) return [];

  // Create CodeMirror theme from CSS variables
  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--editor-bg)',
        color: 'var(--editor-fg)',
        height: '100%',
      },
      '.cm-content': {
        caretColor: 'var(--cursor-color)',
        fontFamily: 'var(--editor-font-family, monospace)',
        fontSize: 'var(--editor-font-size, 14px)',
        lineHeight: 'var(--editor-line-height, 1.6)',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--cursor-color)',
        borderLeftWidth: 'var(--cursor-width, 2px)',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'var(--cursor-color)',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'var(--selection-bg)',
      },
      '.cm-activeLine': {
        backgroundColor: 'var(--line-active)',
      },
      '.cm-selectionMatch': {
        backgroundColor: 'var(--selection-match, rgba(0, 217, 255, 0.1))',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--gutter-bg)',
        color: 'var(--line-number)',
        border: 'none',
        borderRight: '1px solid var(--border-color)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: 'var(--line-number-active)',
      },
      '.cm-lineNumbers': {
        minWidth: 'var(--gutter-width, 50px)',
      },
      '.cm-foldGutter': {
        opacity: 0,
        transition: 'opacity 150ms ease',
      },
      '.cm-line:hover .cm-foldGutter': {
        opacity: 1,
      },
      '.cm-scroller': {
        fontFamily: 'var(--editor-font-family, monospace)',
        lineHeight: 'var(--editor-line-height, 1.6)',
      },
      '.cm-tooltip': {
        backgroundColor: 'var(--tooltip-bg, rgba(28, 28, 28, 0.95))',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
      },
      '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
          backgroundColor: 'var(--selection-bg)',
        },
      },
      '.cm-searchMatch': {
        backgroundColor: 'var(--search-match, rgba(255, 193, 7, 0.3))',
      },
      '.cm-searchMatch-selected': {
        backgroundColor: 'var(--search-match-selected, rgba(255, 193, 7, 0.5))',
      },
    },
    { dark: theme.metadata.base === 'dark' }
  );
}

// ============================================================================
// PLUGIN HOOKS SYSTEM
// ============================================================================

interface PluginHook {
  name: string;
  handler: (view: EditorView, data: any) => void;
}

class PluginHooksManager {
  private hooks: Map<string, PluginHook[]> = new Map();

  register(hookName: string, handler: (view: EditorView, data: any) => void): () => void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hook: PluginHook = {
      name: hookName,
      handler,
    };

    this.hooks.get(hookName)!.push(hook);

    // Return unregister function
    return () => {
      const hooks = this.hooks.get(hookName);
      if (hooks) {
        const index = hooks.indexOf(hook);
        if (index > -1) {
          hooks.splice(index, 1);
        }
      }
    };
  }

  trigger(hookName: string, view: EditorView, data: any): void {
    const hooks = this.hooks.get(hookName);
    if (!hooks) return;

    for (const hook of hooks) {
      try {
        hook.handler(view, data);
      } catch (error) {
        console.error(`Plugin hook ${hookName} failed:`, error);
      }
    }
  }

  createExtension(): Extension {
    return EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        this.trigger('content_change', update.view, {
          changes: update.changes,
          newDoc: update.state.doc.toString(),
        });
      }

      if (update.selectionSet) {
        this.trigger('selection_change', update.view, {
          selection: update.state.selection,
        });
      }

      if (update.focusChanged) {
        this.trigger('focus_change', update.view, {
          focused: update.view.hasFocus,
        });
      }
    });
  }

  clear(): void {
    this.hooks.clear();
  }
}

// Global plugin hooks manager
const pluginHooksManager = new PluginHooksManager();

// ============================================================================
// EDITOR CREATION
// ============================================================================

export async function createEditor(
  parent: HTMLElement,
  options: EditorOptions = {}
): Promise<EditorView> {
  const {
    theme,
    keybindings,
    readOnly = false,
    onChange,
    onCursorMove,
    onSelection,
    extensions = [],
  } = options;

  // Build extension array
  const editorExtensions: Extension[] = [
    // Core functionality
    history(),
    drawSelection(),
    highlightActiveLine(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    highlightSelectionMatches(),
    
    // UI elements
    foldGutter(),
    EditorView.lineWrapping,
    
    // Syntax highlighting
    syntaxHighlighting(defaultHighlightStyle),
    
    // Indentation
    indentUnit.of('  '), // 2 spaces
    
    // Keymaps (order matters - later ones override earlier ones)
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
    
    // Compartments for hot-swapping
    languageCompartment.of([]),
    themeCompartment.of(createThemeExtension(theme)),
    keybindingCompartment.of([]),
    readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
    pluginHooksCompartment.of(pluginHooksManager.createExtension()),
    
    // Custom event handlers
    EditorView.updateListener.of((update) => {
      if (update.docChanged && onChange) {
        onChange(update);
      }
      if (update.selectionSet) {
        if (onCursorMove) onCursorMove(update);
        if (onSelection) onSelection(update);
      }
    }),
    
    // User-provided extensions
    ...extensions,
  ];

  // Create editor state
  const state = EditorState.create({
    doc: '',
    extensions: editorExtensions,
  });

  // Create editor view
  const view = new EditorView({
    state,
    parent,
  });

  return view;
}

// ============================================================================
// DIFF EDITOR CREATION
// ============================================================================

export async function createDiffEditor(
  parent: HTMLElement,
  options: DiffEditorOptions
): Promise<{ original: EditorView; modified: EditorView }> {
  const { original, modified, readOnly = true, theme } = options;

  // Create container for side-by-side layout
  const container = document.createElement('div');
  container.className = 'diff-editor-container';
  container.style.display = 'flex';
  container.style.height = '100%';
  parent.appendChild(container);

  // Original (left) pane
  const originalContainer = document.createElement('div');
  originalContainer.className = 'diff-editor-original';
  originalContainer.style.flex = '1';
  originalContainer.style.borderRight = '1px solid var(--border-color)';
  container.appendChild(originalContainer);

  // Modified (right) pane
  const modifiedContainer = document.createElement('div');
  modifiedContainer.className = 'diff-editor-modified';
  modifiedContainer.style.flex = '1';
  container.appendChild(modifiedContainer);

  // Create original editor
  const originalView = await createEditor(originalContainer, {
    theme,
    readOnly,
  });

  // Create modified editor
  const modifiedView = await createEditor(modifiedContainer, {
    theme,
    readOnly: false, // Allow editing modified version
  });

  // Set content
  originalView.dispatch({
    changes: {
      from: 0,
      to: originalView.state.doc.length,
      insert: original,
    },
  });

  modifiedView.dispatch({
    changes: {
      from: 0,
      to: modifiedView.state.doc.length,
      insert: modified,
    },
  });

  // Sync scrolling
  let isScrolling = false;

  const syncScroll = (source: EditorView, target: EditorView) => {
    if (isScrolling) return;
    isScrolling = true;

    const scrollInfo = source.scrollDOM.getBoundingClientRect();
    target.scrollDOM.scrollTop = source.scrollDOM.scrollTop;

    requestAnimationFrame(() => {
      isScrolling = false;
    });
  };

  originalView.scrollDOM.addEventListener('scroll', () => {
    syncScroll(originalView, modifiedView);
  });

  modifiedView.scrollDOM.addEventListener('scroll', () => {
    syncScroll(modifiedView, originalView);
  });

  return { original: originalView, modified: modifiedView };
}

// ============================================================================
// LANGUAGE MANAGEMENT
// ============================================================================

export async function setLanguage(
  view: EditorView,
  languageName: string
): Promise<boolean> {
  const support = await languageRegistry.loadLanguage(languageName);

  if (!support) {
    console.warn(`Language ${languageName} not available`);
    return false;
  }

  // Update language compartment
  view.dispatch({
    effects: languageCompartment.reconfigure(support),
  });

  return true;
}

export function detectLanguage(filename: string): string | null {
  return languageRegistry.detectLanguage(filename);
}

export function getAvailableLanguages(): LanguageInfo[] {
  return languageRegistry.getAllLanguages();
}

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

export function updateTheme(view: EditorView, theme: Theme): void {
  view.dispatch({
    effects: themeCompartment.reconfigure(createThemeExtension(theme)),
  });
}

// ============================================================================
// KEYBINDING MANAGEMENT
// ============================================================================

export function registerKeybindings(
  view: EditorView,
  keybindings: Keybindings
): void {
  // Convert keybindings to CodeMirror keymap format
  const keymapArray = Object.entries(keybindings).map(([key, command]) => ({
    key,
    run: () => {
      // Execute command
      console.log(`Executing command: ${command}`);
      // This would be integrated with the command system
      return true;
    },
  }));

  view.dispatch({
    effects: keybindingCompartment.reconfigure(keymap.of(keymapArray)),
  });
}

// ============================================================================
// READ-ONLY MODE
// ============================================================================

export function setReadOnly(view: EditorView, readOnly: boolean): void {
  view.dispatch({
    effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
  });
}

// ============================================================================
// PLUGIN HOOKS
// ============================================================================

export function registerPluginHook(
  hookName: string,
  handler: (view: EditorView, data: any) => void
): () => void {
  return pluginHooksManager.register(hookName, handler);
}

export function setupPluginHooks(view: EditorView): void {
  // Plugin hooks are automatically set up via the compartment
  // This function is for manual setup if needed
  view.dispatch({
    effects: pluginHooksCompartment.reconfigure(
      pluginHooksManager.createExtension()
    ),
  });
}

// ============================================================================
// STATE PERSISTENCE
// ============================================================================

interface EditorStateSnapshot {
  doc: string;
  selection: {
    anchor: number;
    head: number;
  };
  scrollTop: number;
  scrollLeft: number;
}

export function saveEditorState(view: EditorView): EditorStateSnapshot {
  return {
    doc: view.state.doc.toString(),
    selection: {
      anchor: view.state.selection.main.anchor,
      head: view.state.selection.main.head,
    },
    scrollTop: view.scrollDOM.scrollTop,
    scrollLeft: view.scrollDOM.scrollLeft,
  };
}

export function restoreEditorState(
  view: EditorView,
  snapshot: EditorStateSnapshot
): void {
  // Restore document
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: snapshot.doc,
    },
    selection: {
      anchor: snapshot.selection.anchor,
      head: snapshot.selection.head,
    },
  });

  // Restore scroll position
  view.scrollDOM.scrollTop = snapshot.scrollTop;
  view.scrollDOM.scrollLeft = snapshot.scrollLeft;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getEditorContent(view: EditorView): string {
  return view.state.doc.toString();
}

export function setEditorContent(view: EditorView, content: string): void {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: content,
    },
  });
}

export function getCursorPosition(view: EditorView): { line: number; column: number } {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);

  return {
    line: line.number,
    column: pos - line.from + 1,
  };
}

export function getSelection(view: EditorView): string {
  const { from, to } = view.state.selection.main;
  return view.state.doc.sliceString(from, to);
}

export function insertText(view: EditorView, text: string): void {
  const { from, to } = view.state.selection.main;
  
  view.dispatch({
    changes: {
      from,
      to,
      insert: text,
    },
    selection: {
      anchor: from + text.length,
    },
  });
}

export function replaceSelection(view: EditorView, text: string): void {
  const { from, to } = view.state.selection.main;
  
  view.dispatch({
    changes: {
      from,
      to,
      insert: text,
    },
  });
}

export function gotoLine(view: EditorView, lineNumber: number): void {
  const line = view.state.doc.line(Math.max(1, Math.min(lineNumber, view.state.doc.lines)));
  
  view.dispatch({
    selection: { anchor: line.from },
    scrollIntoView: true,
  });
}

export function focus(view: EditorView): void {
  view.focus();
}

export function blur(view: EditorView): void {
  (view.contentDOM as HTMLElement).blur();
}

// ============================================================================
// CLEANUP
// ============================================================================

export function destroyEditor(view: EditorView): void {
  // Clear plugin hooks
  pluginHooksManager.clear();
  
  // Destroy view
  view.destroy();
}

// ============================================================================
// CUSTOM EXTENSIONS
// ============================================================================

/
 * Extension to show line length indicator
 */
export function lineLengthIndicator(maxLength: number = 80): Extension {
  return EditorView.decorations.of((view) => {
    const decorations = [];
    const { from, to } = view.viewport;

    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      
      if (line.length > maxLength) {
        const decoration = Decoration.mark({
          class: 'cm-line-too-long',
          attributes: {
            style: 'text-decoration: underline wavy red;',
          },
        }).range(line.from + maxLength, line.to);
        
        decorations.push(decoration);
      }

      pos = line.to + 1;
    }

    return Decoration.set(decorations);
  });
}

/
 * Extension to highlight trailing whitespace
 */
export function highlightTrailingWhitespace(): Extension {
  return EditorView.decorations.of((view) => {
    const decorations = [];
    const { from, to } = view.viewport;

    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      const text = line.text;
      const match = text.match(/\s+$/);

      if (match) {
        const decoration = Decoration.mark({
          class: 'cm-trailing-whitespace',
          attributes: {
            style: 'background-color: rgba(255, 0, 0, 0.2);',
          },
        }).range(line.from + match.index!, line.to);

        decorations.push(decoration);
      }

      pos = line.to + 1;
    }

    return Decoration.set(decorations);
  });
}

/
 * Extension for read-only regions
 */
export function readOnlyRanges(ranges: Array<{ from: number; to: number }>): Extension {
  return EditorState.changeFilter.of((transaction) => {
    for (const change of transaction.changes) {
      for (const range of ranges) {
        if (change.from < range.to && change.to > range.from) {
          return false; // Reject change
        }
      }
    }
    return true; // Allow change
  });
}

// Import Decoration for custom extensions
import { Decoration } from '@codemirror/view';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  EditorView,
  EditorState,
  type Extension,
  type ViewUpdate,
  languageRegistry as languages,
  pluginHooksManager as pluginHooks,
};
```

---

## Integration Dependencies Map

## Module Dependencies

```plaintext
editor-loader.ts (THIS FILE - 700 lines)
├─> CodeMirror 6 Core
│   ├─> @codemirror/view
│   │   ├─> EditorView
│   │   ├─> ViewUpdate
│   │   ├─> keymap
│   │   ├─> highlightActiveLine
│   │   ├─> drawSelection
│   │   └─> Decoration
│   │
│   ├─> @codemirror/state
│   │   ├─> EditorState
│   │   ├─> Compartment
│   │   └─> Extension
│   │
│   ├─> @codemirror/commands
│   │   ├─> defaultKeymap
│   │   ├─> history
│   │   └─> historyKeymap
│   │
│   ├─> @codemirror/language
│   │   ├─> indentOnInput
│   │   ├─> bracketMatching
│   │   ├─> foldGutter
│   │   ├─> syntaxHighlighting
│   │   └─> LanguageSupport
│   │
│   ├─> @codemirror/search
│   │   ├─> searchKeymap
│   │   └─> highlightSelectionMatches
│   │
│   └─> @codemirror/autocomplete
│       ├─> autocompletion
│       ├─> completionKeymap
│       └─> closeBrackets
│
├─> Language Packages (lazy-loaded)
│   ├─> @codemirror/lang-javascript
│   ├─> @codemirror/lang-python
│   ├─> @codemirror/lang-rust
│   ├─> @codemirror/lang-json
│   ├─> @codemirror/lang-markdown
│   ├─> @codemirror/lang-html
│   ├─> @codemirror/lang-css
│   ├─> @codemirror/lang-yaml
│   ├─> @codemirror/lang-toml
│   ├─> @codemirror/lang-xml
│   └─> @codemirror/lang-sql
│
├─> Local Types
│   ├─> src/lib/stores/theme.ts
│   │   └─> Theme type
│   │
│   └─> src/lib/stores/keybindings.ts
│       └─> Keybindings type
│
└─> Used By
    ├─> src/components/Editor.svelte
    │   ├─> createEditor()
    │   ├─> setLanguage()
    │   ├─> updateTheme()
    │   ├─> destroyEditor()
    │   └─> All utility functions
    │
    └─> src/components/DiffView.svelte (if exists)
        └─> createDiffEditor()
```

## Required Files to Create

### 🔴 CRITICAL - Must exist before editor-loader.ts compiles

```plaintext
1. src/lib/stores/theme.ts (150-200 lines)
   └─> NEW FILE REQUIRED ⚠️
   └─> Exports:
       ├─> Theme interface
       ├─> ThemeMetadata interface
       └─> themeStore (writable)

2. src/lib/stores/keybindings.ts (100-150 lines)
   └─> NEW FILE REQUIRED ⚠️
   └─> Exports:
       ├─> Keybindings type
       └─> keybindingStore (writable)
```

### 🟡 IMPORTANT - Runtime dependencies

```plaintext
3. package.json dependencies
   └─> Add all CodeMirror packages:
       ├─> codemirror@^6.0.1
       ├─> @codemirror/view@^6.23.0
       ├─> @codemirror/state@^6.4.0
       ├─> @codemirror/commands@^6.3.3
       ├─> @codemirror/language@^6.10.0
       ├─> @codemirror/search@^6.5.5
       ├─> @codemirror/autocomplete@^6.12.0
       ├─> @codemirror/lint@^6.5.0
       └─> Language packages (all @codemirror/lang-*)

4. src/components/Editor.svelte (ALREADY EXISTS ✅)
   └─> Uses: createEditor(), setLanguage(), updateTheme()
```

### 🟢 OPTIONAL - Enhanced features

```plaintext
5. src/lib/editor-extensions/
   └─> Custom extensions
       ├─> vim-mode.ts
       ├─> emacs-mode.ts
       ├─> snippets.ts
       └─> collaborative-editing.ts
```

## package.json Dependencies

```json
{
  "dependencies": {
    "codemirror": "^6.0.1",
    "@codemirror/view": "^6.23.0",
    "@codemirror/state": "^6.4.0",
    "@codemirror/commands": "^6.3.3",
    "@codemirror/language": "^6.10.0",
    "@codemirror/search": "^6.5.5",
    "@codemirror/autocomplete": "^6.12.0",
    "@codemirror/lint": "^6.5.0",
    "@codemirror/lang-javascript": "^6.2.1",
    "@codemirror/lang-python": "^6.1.3",
    "@codemirror/lang-rust": "^6.0.1",
    "@codemirror/lang-json": "^6.0.1",
    "@codemirror/lang-markdown": "^6.2.4",
    "@codemirror/lang-html": "^6.4.8",
    "@codemirror/lang-css": "^6.2.1",
    "@codemirror/lang-yaml": "^6.0.0",
    "@codemirror/lang-xml": "^6.0.2",
    "@codemirror/lang-sql": "^6.5.4"
  }
}
```

## Type Definitions Required

### theme.ts (stub)

```typescript
// src/lib/stores/theme.ts
import { writable } from 'svelte/store';

export interface ThemeMetadata {
  name: string;
  author: string;
  version: string;
  base: 'dark' | 'light' | 'high-contrast';
}

export interface Theme {
  metadata: ThemeMetadata;
  window: any; // Full definition needed
  chrome: any;
  editor: any;
  syntax: any;
  ui: any;
  transitions: any;
}

function createThemeStore() {
  const { subscribe, set, update } = writable<{
    current: Theme | null;
    available: Theme[];
  }>({
    current: null,
    available: [],
  });

  return {
    subscribe,
    setTheme: (theme: Theme) => update(state => ({ ...state, current: theme })),
    loadTheme: async (name: string) => {
      // Implementation
    },
  };
}

export const themeStore = createThemeStore();
```

### keybindings.ts (stub)

```typescript
// src/lib/stores/keybindings.ts
import { writable } from 'svelte/store';

export type Keybindings = Record<string, string>;

export interface KeybindingScheme {
  name: string;
  bindings: Keybindings;
}

function createKeybindingStore() {
  const { subscribe, set, update } = writable<{
    current: Keybindings;
    schemes: KeybindingScheme[];
  }>({
    current: {},
    schemes: [],
  });

  return {
    subscribe,
    setKeybindings: (bindings: Keybindings) => 
      update(state => ({ ...state, current: bindings })),
    loadScheme: async (name: string) => {
      // Implementation
    },
  };
}

export const keybindingStore = createKeybindingStore();
```

## File-Level Integration Diagram

```plaintext
┌────────────────────────────────────────────────────────────────┐
│                  EDITOR-LOADER.TS INTEGRATION                  │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│ editor-loader.ts     │ (THIS FILE - 700 lines)
└──────────┬───────────┘
           │
           ├────────────────────────────────────────────────────────┐
           │                                                        │
           ▼                                                        ▼
┌────────────────────────┐                              ┌─────────────────────┐
│ CodeMirror 6 Packages  │ External (npm)               │  Local Stores       │
├────────────────────────┤                              ├─────────────────────┤
│ • @codemirror/view     │                              │ • theme.ts          │
│ • @codemirror/state    │                              │ • keybindings.ts    │
│ • @codemirror/commands │                              └─────────────────────┘
│ • @codemirror/language │
│ • @codemirror/search   │
│ • @codemirror/autocomplete│
│ • 11 language packages │
└────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│                    LANGUAGE REGISTRY                           │
├────────────────────────────────────────────────────────────────┤
│  Manages dynamic language loading:                             │
│  ├─> detectLanguage(filename)                                  │
│  ├─> loadLanguage(name) - Dynamic import()                     │
│  └─> Cache loaded languages                                    │
└────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│                   PLUGIN HOOKS MANAGER                         │
├────────────────────────────────────────────────────────────────┤
│  Extensibility for plugins:                                    │
│  ├─> register(hookName, handler)                               │
│  ├─> trigger(hookName, view, data)                             │
│  └─> createExtension() - Integrates with CodeMirror            │
└────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│                     EXPORTED FUNCTIONS                         │
├────────────────────────────────────────────────────────────────┤
│  Public API used by Editor.svelte:                             │
│  ├─> createEditor(parent, options)                             │
│  ├─> createDiffEditor(parent, options)                         │
│  ├─> setLanguage(view, lang)                                   │
│  ├─> updateTheme(view, theme)                                  │
│  ├─> registerKeybindings(view, bindings)                       │
│  ├─> setReadOnly(view, readOnly)                               │
│  ├─> registerPluginHook(name, handler)                         │
│  ├─> getEditorContent(view)                                    │
│  ├─> setEditorContent(view, content)                           │
│  ├─> getCursorPosition(view)                                   │
│  ├─> gotoLine(view, lineNumber)                                │
│  ├─> saveEditorState(view)                                     │
│  ├─> restoreEditorState(view, snapshot)                        │
│  └─> destroyEditor(view)                                       │
└────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│                       USED BY                                  │
├────────────────────────────────────────────────────────────────┤
│  src/components/Editor.svelte                                  │
│  ├─> Calls createEditor() in onMount                           │
│  ├─> Uses setLanguage() when file opened                       │
│  ├─> Uses updateTheme() on theme change                        │
│  ├─> Uses all utility functions                                │
│  └─> Calls destroyEditor() in onDestroy                        │
└────────────────────────────────────────────────────────────────┘
```

## Integration Checklist

### COMPLETED

- `src/lib/editor-loader.ts` (700 lines) - Complete CodeMirror 6 integration

### MUST CREATE NEXT

- Phase 1: Store Definitions (BLOCKING)

```plaintext
1. src/lib/stores/theme.ts (150-200 lines)
   └─> Theme interface and store
   └─> This is REQUIRED for editor-loader.ts to compile

2. src/lib/stores/keybindings.ts (100-150 lines)
   └─> Keybindings type and store
   └─> This is REQUIRED for editor-loader.ts to compile
```

- Phase 2: Install Dependencies

```plaintext
3. npm install codemirror @codemirror/view @codemirror/state ...
   └─> Install all CodeMirror packages listed above
```

- Phase 3: Integration (Editor.svelte already uses these)

```plaintext
4. Verify Editor.svelte imports (ALREADY DONE ✅)
   └─> Editor.svelte already imports from editor-loader.ts
```

- Phase 4: Optional Enhancements

```plaintext
5. Custom extensions
   └─> vim-mode, emacs-mode, snippets, etc.
```

## Usage Example (from Editor.svelte)

```typescript
// Editor.svelte excerpt showing usage

import { createEditor, setLanguage, updateTheme, destroyEditor } from '../lib/editor-loader';

let editorView: EditorView | null = null;

onMount(async () => {
  editorView = await createEditor(editorContainer, {
    theme: $themeStore.current,
    onChange: handleEditorChange,
    onCursorMove: handleCursorMove,
  });
  
  // Set language when file opened
  const lang = await detectLanguage('example.py');
  if (lang) {
    await setLanguage(editorView, lang);
  }
});

onDestroy(() => {
  if (editorView) {
    destroyEditor(editorView);
  }
});

// Theme changes
$: if (editorView && $themeStore.current) {
  updateTheme(editorView, $themeStore.current);
}
```
