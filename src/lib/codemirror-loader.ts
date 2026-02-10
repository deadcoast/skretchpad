// src/lib/codemirror-loader.ts
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { markdown } from '@codemirror/lang-markdown';

// Lazy-load language support
const languageCompartment = new Compartment();

export function createMinimalCodeMirror(container: HTMLElement) {
  const state = EditorState.create({
    extensions: [
      basicSetup,
      languageCompartment.of([]), // Start with no language
      EditorView.theme({
        '&': {
          backgroundColor: 'transparent',
          height: '100%',
        },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': { caretColor: '#00d9ff' },
        '&.cm-focused': { outline: 'none' },
      }),
    ],
  });

  return new EditorView({
    state,
    parent: container,
  });
}

// Language map for supported languages
const languageMap = {
  python: () => python(),
  rust: () => rust(),
  markdown: () => markdown(),
};

// Dynamic language loading
export async function setLanguage(view: EditorView, lang: string) {
  let languageSupport;

  if (languageMap[lang as keyof typeof languageMap]) {
    // Use pre-imported language
    languageSupport = languageMap[lang as keyof typeof languageMap]();
  } else {
    // Fallback to dynamic import for other languages
    try {
      const langModule = await import(`@codemirror/lang-${lang}`);
      languageSupport = langModule[lang]();
    } catch (error) {
      console.warn(`Failed to load language ${lang}:`, error);
      return;
    }
  }

  view.dispatch({
    effects: languageCompartment.reconfigure(languageSupport),
  });
}
