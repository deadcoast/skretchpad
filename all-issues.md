# all-issues.md

## All issues / JS-0339

> Found non-null assertions: JS-0339
> Anti-pattern
> Major: 8 hours ago — 8 hours old
> Occurrences: 21

- Search occurrences in a file path

Forbidden non-null assertion

> src/lib/editor-loader.ts | JS-0339

```typescript
          attributes: {
            style: 'background-color: rgba(255, 0, 0, 0.2);',
          },
        }).range(line.from + match.index!, line.to);

        decorations.push(decoration);
      }
```

Forbidden non-null assertion

> src/lib/editor-loader.ts | JS-0339

```typescript
      handler,
    };

    this.hooks.get(hookName)!.push(hook);

    // Return unregister function
    return () => {
```

Forbidden non-null assertion

> src/components/CommandPalette.test.ts | JS-0339

```typescript
    component.$on('close', closeSpy);

    const backdrop = container.querySelector('.command-palette-backdrop');
    await fireEvent.keyDown(backdrop!, { key: 'Escape' });

    expect(closeSpy).toHaveBeenCalled();
  });
```

Forbidden non-null assertion

> src/components/CommandPalette.test.ts | JS-0339

```typescript
    expect(footer).not.toBeNull();
    expect(footer!.textContent).toContain('commands');
    expect(footer!.textContent).toContain('files');
    expect(footer!.textContent).toContain('symbols');
  });

  it('dispatches close event on Escape', async () => {
```

Forbidden non-null assertion

> src/components/CommandPalette.test.ts | JS-0339

```typescript
    const footer = container.querySelector('.command-palette__footer');
    expect(footer).not.toBeNull();
    expect(footer!.textContent).toContain('commands');
    expect(footer!.textContent).toContain('files');
    expect(footer!.textContent).toContain('symbols');
  });
```

### Description

Using non-null assertions cancels out the benefits of strict null-checking, and introduces the possibility of runtime errors. Avoid non-null assertions unless absolutely necessary. If you still need to use one, write a skipcq comment to explain why it is safe.

Ideally, you want to have a validation function that confirms a value isn't null, with a return type like this:

```typescript
type AccentedColor = `${Color}-${Accent}`;
function isColorValid(name: string): name is AccentedColor {
  // ...
}
```

Bad Practice

```typescript
// a user named "injuly" may not exist in the DB
const injuly: User | null = db.getUserByName('injuly');

// Using the non-null assertion operator will bypass null-checking
const pfp = injuly!.profilePicture;
```

Recommended

```typescript
const injuly: User | null = db.getUserByName('injuly');
const pfp = injuly?.profilePicture; // pfp: Image | undefined

// OR:

const pfp_ = injuly ? injuly.pfp : defaultPfp; // pfp: Image
```

Alternatively:

```typescript
function isUserValid(userObj: User | null | undefined): userObj is User {
  return Boolean(userObj) && validate(userObj);
}

const injuly = db.getUserByName('injuly');
if (isUserValid(injuly)) {
  const pfp = injuly.profilePicture;
  // ...
}
```

---

> Found non-null assertions | JS-0339
> Anti-pattern
> Major: 8 hours ago — 8 hours old
> Occurrences: 21

- Search occurrences in a file path

Forbidden non-null assertion

> src/components/CommandPalette.test.ts | JS-0339

```typescript
    const { container } = render(CommandPalette, { props: { visible: true } });
    const footer = container.querySelector('.command-palette__footer');
    expect(footer).not.toBeNull();
    expect(footer!.textContent).toContain('commands');
    expect(footer!.textContent).toContain('files');
    expect(footer!.textContent).toContain('symbols');
  });
```

Forbidden non-null assertion

> src/test/mocks/tauri-event.ts | JS-0339

```typescript
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(wrappedHandler);

  return () => {
    listeners.get(event)?.delete(wrappedHandler);
```

Forbidden non-null assertion

> src/test/mocks/tauri-event.ts | JS-0339

```typescript
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(handler);

  // Return unlisten function
  return () => {
```

Forbidden non-null assertion

> src/main.ts | JS-0339

```typescript
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

Forbidden non-null assertion

> src/lib/utils/ui.ts | JS-0339

```typescript
    }
  }

  throw lastError!;
}

/**
```

---

> Found non-null assertions | JS-0339
> Anti-pattern
> Major: 8 hours ago — 8 hours old
> Occurrences: 21

- Search occurrences in a file path

Forbidden non-null assertion

> src/lib/stores/ui.ts | JS-0339

```typescript
    }
  }

  throw lastError!;
}

/**
```

Forbidden non-null assertion

> src/lib/stores/plugins.ts | JS-0339

```typescript
src/lib/stores/plugins.ts
JS-0339
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(command);
  }

  return grouped;
```

Forbidden non-null assertion

> src/lib/stores/keybindings.test.ts | JS-0339

```typescript
      modifiers: ['Ctrl', 'Shift'],
      command: 'custom.action',
    });
    const vimScheme = get(keybindingStore).available.find((s) => s.name === 'Vim')!;
    keybindingStore.setScheme(vimScheme);
    const state = get(keybindingStore);
    // Custom bindings are merged into current
```

Forbidden non-null assertion

> src/lib/stores/keybindings.test.ts | JS-0339

```typescript
  it('resetToDefault restores default scheme', () => {
    const state = get(keybindingStore);
    const vimScheme = state.available.find((s) => s.name === 'Vim')!;
    keybindingStore.setScheme(vimScheme);
    keybindingStore.resetToDefault();
    expect(get(keybindingStore).currentScheme?.name).toBe('Default');
```

Forbidden non-null assertion

> src/lib/stores/keybindings.test.ts | JS-0339

```typescript
  it('switch to Emacs scheme', () => {
    const state = get(keybindingStore);
    const emacsScheme = state.available.find((s) => s.name === 'Emacs')!;
    keybindingStore.setScheme(emacsScheme);
    const updated = get(keybindingStore);
    expect(updated.currentScheme?.name).toBe('Emacs');
```

---

> Found non-null assertions | JS-0339
> Anti-pattern
> Major: 8 hours ago — 8 hours old
> Occurrences: 21

- Search occurrences in a file path

Forbidden non-null assertion

> src/components/CommandPalette.test.ts | JS-0339

```typescript
    const { container } = render(CommandPalette, { props: { visible: true } });
    const footer = container.querySelector('.command-palette__footer');
    expect(footer).not.toBeNull();
    expect(footer!.textContent).toContain('commands');
    expect(footer!.textContent).toContain('files');
    expect(footer!.textContent).toContain('symbols');
  });
```

Forbidden non-null assertion

> src/test/mocks/tauri-event.ts | JS-0339

```typescript
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(wrappedHandler);

  return () => {
    listeners.get(event)?.delete(wrappedHandler);
```

Forbidden non-null assertion

> src/test/mocks/tauri-event.ts | JS-0339

```typescript
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(handler);

  // Return unlisten function
  return () => {
```

Forbidden non-null assertion

> src/main.ts | JS-0339

```typescript
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

Forbidden non-null assertion

> src/lib/utils/ui.ts | JS-0339

```typescript
    }
  }

  throw lastError!;
}

/**
```

---

> Found non-null assertions | JS-0339
> Anti-pattern
> Major: 8 hours ago — 8 hours old
> Occurrences: 21

- Search occurrences in a file path

Forbidden non-null assertion

> src/lib/stores/keybindings.test.ts | JS-0339

```typescript
  it('scheme switching updates current bindings', () => {
    const state = get(keybindingStore);
    const vimScheme = state.available.find((s) => s.name === 'Vim')!;
    keybindingStore.setScheme(vimScheme);
    const updated = get(keybindingStore);
    expect(updated.currentScheme?.name).toBe('Vim');
```

Forbidden non-null assertion

> src/components/StatusBar.test.ts | JS-0339

```typescript
  it('applies minimal class when menuVisible is false', () => {
    const { container } = render(StatusBar, { props: { menuVisible: false } });
    const bar = container.querySelector('.status-bar');
    expect(bar!.classList.contains('status-bar--minimal')).toBe(true);
  });
});
```

Forbidden non-null assertion

> src/components/StatusBar.test.ts | JS-0339

```typescript
    const bar = container.querySelector('.status-bar');
    expect(bar).not.toBeNull();
    // When menuVisible=true, should NOT have the minimal class
    expect(bar!.classList.contains('status-bar--minimal')).toBe(false);
  });

  it('applies minimal class when menuVisible is false', () => {
```

Forbidden non-null assertion

> src/components/NotificationToast.test.ts | JS-0339

```typescript
    const actionBtn = container.querySelector('.notification-action');
    expect(actionBtn).not.toBeNull();
    await fireEvent.click(actionBtn!);

    expect(callback).toHaveBeenCalledOnce();
  });
```

Forbidden non-null assertion

> src/components/NotificationToast.test.ts | JS-0339

```typescript
    const { container } = render(NotificationToast);
    const actionBtn = container.querySelector('.notification-action');
    expect(actionBtn).not.toBeNull();
    expect(actionBtn!.textContent).toBe('Undo');
  });

  it('action button calls callback and dismisses', async () => {
```

---

> Found non-null assertions | JS-0339
> Anti-pattern
> Major: 8 hours ago — 8 hours old
> Occurrences: 21

- Search occurrences in a file path
- Forbidden non-null assertion

> src/components/NotificationToast.test.ts | JS-0339

```typescript
const dismissBtn = container.querySelector('.notification-dismiss');
expect(dismissBtn).not.toBeNull();
await fireEvent.click(dismissBtn!);

// After dismiss, the notification store should be empty
const { get } = await import('svelte/store');
```

---
