import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  debounceImmediate,
  throttle,
  debounceAsync,
  debounceLeading,
  debounceWithCancel,
  debounceWithMaxWait,
} from './debounce';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('debounce', () => {
  it('calls function after wait period', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not call before wait period elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
  });

  it('deduplicates rapid calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced();
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('uses the latest arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    debounced('b');
    debounced('c');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('c');
  });
});

describe('debounceImmediate', () => {
  it('fires first call immediately when immediate=true', () => {
    const fn = vi.fn();
    const debounced = debounceImmediate(fn, 100, true);
    debounced();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('suppresses subsequent calls during wait when immediate=true', () => {
    const fn = vi.fn();
    const debounced = debounceImmediate(fn, 100, true);
    debounced();
    debounced();
    debounced();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('allows calling again after wait period when immediate=true', () => {
    const fn = vi.fn();
    const debounced = debounceImmediate(fn, 100, true);
    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('defers execution when immediate=false (default)', () => {
    const fn = vi.fn();
    const debounced = debounceImmediate(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe('throttle', () => {
  it('fires immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('blocks calls during wait period', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('fires trailing call after wait period', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled('first');
    throttled('second');
    throttled('third');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('third');
  });
});

describe('debounceAsync', () => {
  it('returns a promise that resolves after debounce', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const debounced = debounceAsync(fn, 100);
    const promise = debounced();
    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBe('result');
  });

  it('all calls during debounce window return same promise', () => {
    const fn = vi.fn().mockResolvedValue('result');
    const debounced = debounceAsync(fn, 100);
    const p1 = debounced();
    const p2 = debounced();
    const p3 = debounced();
    // Same pending promise reused
    expect(p1).toBe(p2);
    expect(p2).toBe(p3);
  });

  it('rejects when async function throws', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('async fail'));
    const debounced = debounceAsync(fn, 100);
    const promise = debounced();
    // Set up the catch before advancing timers to avoid unhandled rejection
    const resultPromise = promise.catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(100);
    const error = await resultPromise;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('async fail');
  });
});

describe('debounceLeading', () => {
  it('fires on leading edge', () => {
    const fn = vi.fn();
    const debounced = debounceLeading(fn, 100);
    debounced();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('suppresses calls during wait period', () => {
    const fn = vi.fn();
    const debounced = debounceLeading(fn, 100);
    debounced();
    debounced();
    debounced();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('allows calling again after wait period', () => {
    const fn = vi.fn();
    const debounced = debounceLeading(fn, 100);
    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('debounceWithCancel', () => {
  it('calls function after wait', () => {
    const fn = vi.fn();
    const debounced = debounceWithCancel(fn, 100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('cancel() prevents execution', () => {
    const fn = vi.fn();
    const debounced = debounceWithCancel(fn, 100);
    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it('flush() fires immediately', () => {
    const fn = vi.fn();
    const debounced = debounceWithCancel(fn, 100);
    debounced('arg');
    debounced.flush();
    expect(fn).toHaveBeenCalledWith('arg');
  });

  it('flush() with no pending call is a no-op', () => {
    const fn = vi.fn();
    const debounced = debounceWithCancel(fn, 100);
    debounced.flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it('re-debouncing clears previous timeout', () => {
    const fn = vi.fn();
    const debounced = debounceWithCancel(fn, 100);
    debounced('first');
    vi.advanceTimersByTime(50);
    debounced('second');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('second');
  });
});

describe('debounceWithMaxWait', () => {
  it('calls after normal wait if no continuous calls', () => {
    const fn = vi.fn();
    const debounced = debounceWithMaxWait(fn, 100, 500);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('guarantees execution within maxWait under continuous debouncing', () => {
    const fn = vi.fn();
    const debounced = debounceWithMaxWait(fn, 100, 250);
    // Call every 50ms -- each resets the 100ms debounce, but maxWait=250ms
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    // At this point ~250ms have passed, maxWait should fire
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalled();
  });

  it('uses latest args when maxWait fires', () => {
    const fn = vi.fn();
    const debounced = debounceWithMaxWait(fn, 100, 200);
    debounced('a');
    vi.advanceTimersByTime(50);
    debounced('b');
    vi.advanceTimersByTime(50);
    debounced('c');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('c');
  });
});
