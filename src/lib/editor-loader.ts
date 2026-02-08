// src/lib/editor-loader.ts

import { EditorView, ViewUpdate, keymap, highlightActiveLine, drawSelection, lineNumbers } from '@codemirror/view';
import { MergeView } from '@codemirror/merge';
import { EditorState, Compartment, type Extension } from '@codemirror/state';
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
import { StreamLanguage } from '@codemirror/language';
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
        { name: 'xml', extensions: ['xml', 'svg'] },
        { name: 'sql', extensions: ['sql'] },
        { name: 'toml', extensions: ['toml'] },
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

        case 'xml':
          const { xml } = await import('@codemirror/lang-xml');
          support = xml();
          break;

        case 'sql':
          const { sql } = await import('@codemirror/lang-sql');
          support = sql();
          break;

        case 'toml':
          const { toml } = await import('@codemirror/legacy-modes/mode/toml');
          support = new LanguageSupport(StreamLanguage.define(toml));
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
    keybindings: _keybindings, // TODO: Implement keybinding integration
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
    wordWrapCompartment.of(EditorView.lineWrapping),
    lineNumbersCompartment.of(lineNumbers()),
    tabSizeCompartment.of(indentUnit.of('  ')),

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
): Promise<{ mergeView: MergeView; destroy: () => void }> {
  const { original, modified } = options;

  const mergeView = new MergeView({
    a: {
      doc: original,
      extensions: [
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        highlightActiveLine(),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        lineNumbers(),
      ],
    },
    b: {
      doc: modified,
      extensions: [
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        highlightActiveLine(),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        lineNumbers(),
      ],
    },
    parent,
    collapseUnchanged: { margin: 3, minSize: 4 },
    gutter: true,
  });

  return {
    mergeView,
    destroy: () => mergeView.destroy(),
  };
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

export interface EditorStateSnapshot {
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
// SETTINGS INTEGRATION (word wrap, line numbers, tab size, font size)
// ============================================================================

const wordWrapCompartment = new Compartment();
const lineNumbersCompartment = new Compartment();
const tabSizeCompartment = new Compartment();

export function setWordWrap(view: EditorView, enabled: boolean): void {
  view.dispatch({
    effects: wordWrapCompartment.reconfigure(enabled ? EditorView.lineWrapping : []),
  });
}

export function setLineNumbers(view: EditorView, enabled: boolean): void {
  view.dispatch({
    effects: lineNumbersCompartment.reconfigure(enabled ? lineNumbers() : []),
  });
}

export function setTabSize(view: EditorView, size: number): void {
  view.dispatch({
    effects: tabSizeCompartment.reconfigure(indentUnit.of(' '.repeat(size))),
  });
}

export function setFontSize(size: number): void {
  document.documentElement.style.setProperty('--editor-font-size', `${size}px`);
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

/*
 * Extension to show line length indicator
 */
export function lineLengthIndicator(maxLength: number = 80): Extension {
  return EditorView.decorations.of((view) => {
    const decorations = [];
    const { from, to } = view.viewport;

    for (let pos = from; pos <= to;) {
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

/*
 * Extension to highlight trailing whitespace
 */
export function highlightTrailingWhitespace(): Extension {
  return EditorView.decorations.of((view) => {
    const decorations = [];
    const { from, to } = view.viewport;

    for (let pos = from; pos <= to;) {
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

/*
 * Extension for read-only regions
 */
export function readOnlyRanges(ranges: Array<{ from: number; to: number }>): Extension {
  return EditorState.changeFilter.of((transaction) => {
    // Iterate through changes using iter()
    transaction.changes.iterChanges((fromA, toA) => {
      for (const range of ranges) {
        if (fromA < range.to && toA > range.from) {
          return false; // Reject change
        }
      }
    });
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
