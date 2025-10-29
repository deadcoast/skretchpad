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

// Dynamic language loading
export async function setLanguage(view: EditorView, lang: string) {
  const langModule = await import(`@codemirror/lang-${lang}`);
  view.dispatch({
    effects: languageCompartment.reconfigure(langModule[lang]()),
  });
}