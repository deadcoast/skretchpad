# debounce.ts Architecture

> **Source File**: [`src/lib/utils/debounce.ts`](../../../src/lib/utils/debounce.ts)
> **Status**: ✅ Implemented
> **Module Type**: Utility Functions
> **Lines of Code**: 247

---

## Table of Contents

- [Overview](#overview)
- [Core Functions](#core-functions)
- [Advanced Functions](#advanced-functions)
- [Usage Examples](#usage-examples)
- [Related Documentation](#related-documentation)

---

## Overview

The `debounce.ts` module provides a comprehensive collection of debouncing and throttling utilities for optimizing function execution timing. These utilities are essential for performance optimization in event handlers, API calls, and state updates.

### Key Features

- **7 debounce variants**: Standard, immediate, leading, async, with-cancel, with-max-wait
- **Throttle function**: Limits execution frequency
- **Type-safe**: Full TypeScript generics support
- **Context preservation**: Maintains `this` binding
- **Cancellable**: Advanced variants support cancellation and flushing

---

## Core Functions

### debounce

```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

Standard debounce - delays execution until after `wait` milliseconds have elapsed since the last invocation.

**Source**: Lines 4-22

**Parameters**:
- `func`: Function to debounce
- `wait`: Milliseconds to wait before execution

**Example**:
```typescript
const handleChange = debounce((value: string) => {
  console.log('Value:', value);
}, 300);
```

**Used in**: [`Editor.svelte:425`](2_Editor.svelte.md) - Content change handler (300ms delay)

---

### throttle

```typescript
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

Ensures function is called at most once per `wait` period.

**Source**: Lines 57-86

**Parameters**:
- `func`: Function to throttle
- `wait`: Minimum milliseconds between executions

**Behavior**:
- First call executes immediately
- Subsequent calls within wait period are queued
- Last queued call executes when period expires

**Example**:
```typescript
const handleScroll = throttle(() => {
  console.log('Scroll position:', window.scrollY);
}, 100);
```

---

## Advanced Functions

### debounceImmediate

```typescript
export function debounceImmediate<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void
```

Debounce with optional immediate execution on leading edge.

**Source**: Lines 25-54

**Parameters**:
- `func`: Function to debounce
- `wait`: Milliseconds to wait
- `immediate`: If `true`, execute on leading edge instead of trailing

**Use case**: Form validation that runs immediately, then debounces

---

### debounceLeading

```typescript
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

Executes immediately on first call, then debounces subsequent calls.

**Source**: Lines 124-145

**Behavior**:
- First invocation executes immediately
- Subsequent invocations are ignored until wait period expires

**Use case**: Button click handlers that should execute immediately but prevent rapid re-clicks

---

### debounceAsync

```typescript
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>>
```

Debounces async functions while maintaining promise semantics.

**Source**: Lines 89-121

**Returns**: Promise that resolves with the debounced function result

**Use case**: Debounced API calls with proper error handling

**Example**:
```typescript
const searchAPI = debounceAsync(async (query: string) => {
  const response = await fetch(`/api/search?q=${query}`);
  return response.json();
}, 500);

// Usage
try {
  const results = await searchAPI('typescript');
  console.log(results);
} catch (error) {
  console.error('Search failed:', error);
}
```

---

### debounceWithCancel

```typescript
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
}

export function debounceWithCancel<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T>
```

Debounce with manual control via `cancel()` and `flush()` methods.

**Source**: Lines 148-202

**Methods**:
- `cancel()`: Cancels pending execution
- `flush()`: Immediately executes pending call

**Example**:
```typescript
const saveData = debounceWithCancel((data: any) => {
  localStorage.setItem('data', JSON.stringify(data));
}, 1000);

saveData(data1);
saveData(data2);

// Cancel if user navigates away
window.addEventListener('beforeunload', () => {
  saveData.cancel();
});

// Or flush immediately
saveData.flush();
```

---

### debounceWithMaxWait

```typescript
export function debounceWithMaxWait<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  maxWait: number
): (...args: Parameters<T>) => void
```

Debounce that guarantees execution at least once per `maxWait` period.

**Source**: Lines 205-247

**Parameters**:
- `func`: Function to debounce
- `wait`: Standard debounce delay
- `maxWait`: Maximum time to wait before forced execution

**Use case**: Auto-save that debounces user input but guarantees save every 5 seconds

**Example**:
```typescript
const autoSave = debounceWithMaxWait(
  (content: string) => saveToServer(content),
  1000,   // Debounce 1s
  5000    // Force save every 5s
);
```

---

## Usage Examples

### Editor Content Changes

```typescript
// From Editor.svelte:425
const handleEditorChange = debounce((update: ViewUpdate) => {
  if (!update.docChanged) return;

  isDirty = true;
  updateEditorState();
  editorStore.markDirty();

  executePluginHook('on_content_change', {
    path: currentFilePath,
    changes: update.changes,
  });
}, 300);
```

**Why 300ms?**: Balances responsiveness with performance - executes after user stops typing for 300ms.

### Search Input

```typescript
const handleSearchInput = debounce(async (query: string) => {
  if (query.length < 3) return;

  const results = await invoke('search_files', { query });
  updateSearchResults(results);
}, 500);
```

### Window Resize

```typescript
const handleResize = throttle(() => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  updateLayout({ width, height });
}, 100);

window.addEventListener('resize', handleResize);
```

---

## Implementation Details

### Context Preservation

All functions preserve `this` context:

```typescript
return function (this: any, ...args: Parameters<T>) {
  const context = this;
  // ...
  func.apply(context, args);
};
```

This ensures methods work correctly when debounced:

```typescript
class Editor {
  content = '';

  save = debounce(function(this: Editor) {
    console.log(this.content); // Correct context
  }, 1000);
}
```

### TypeScript Generics

Full type inference for parameters and return types:

```typescript
const handleChange = debounce((value: string, index: number) => {
  // TypeScript infers: (...args: [string, number]) => void
}, 300);

handleChange('foo', 0);   // ✅ Valid
handleChange('foo');      // ❌ Error: missing argument
handleChange(123, 0);     // ❌ Error: wrong type
```

---

## Related Documentation

### Usage in Components

- **[Editor.svelte](2_Editor.svelte.md)** - Content change debouncing (line 425)

### Store Usage

- **[editor.ts](12_editor.ts.md)** - State update debouncing
- **[theme.ts](6_theme.ts.md)** - Theme change debouncing

### Project Documentation

- **[Technical Details](../core/02_technical-details.md)** - Performance optimization patterns
- **[STATUS.md](../../reports/STATUS_2026-02-10.md)** - Development progress

---

## Performance Considerations

### Memory Usage

Each debounced function creates:
- One timeout reference
- One closure
- For advanced variants: additional state storage (lastArgs, lastContext)

**Recommendation**: Don't create debounced functions in render loops.

❌ **Bad**:
```typescript
{#each items as item}
  <input on:input={debounce(handleInput, 300)} />
{/each}
```

✅ **Good**:
```typescript
const debouncedInput = debounce(handleInput, 300);

{#each items as item}
  <input on:input={debouncedInput} />
{/each}
```

### Choosing the Right Function

| Use Case        | Function              | Reason                            |
|-----------------|-----------------------|-----------------------------------|
| Input handlers  | `debounce`            | Wait for user to stop typing      |
| Scroll handlers | `throttle`            | Limit execution frequency         |
| API calls       | `debounceAsync`       | Handle promises correctly         |
| Button clicks   | `debounceLeading`     | Execute immediately, prevent spam |
| Auto-save       | `debounceWithMaxWait` | Guarantee periodic saves          |
| Cleanup needed  | `debounceWithCancel`  | Cancel on unmount                 |

---

**Documentation Version**: 1.0.0
**Module Version**: 0.1.0
**Accuracy**: Verified against source code 2025-10-28
