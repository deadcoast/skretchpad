// src/lib/utils/debounce.ts

// Debounce function - delays execution until after wait milliseconds have elapsed since the last invocation
export function debounce<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Return,
  wait: number
): (this: This, ...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: This, ...args: Args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

// Debounce function with immediate execution option
export function debounceImmediate<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Return,
  wait: number,
  immediate = false
): (this: This, ...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: This, ...args: Args) {
    const later = () => {
      timeoutId = null;
      if (!immediate) {
        func.apply(this, args);
      }
    };

    const callNow = immediate && timeoutId === null;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(later, wait);

    if (callNow) {
      func.apply(this, args);
    }
  };
}

// Throttle function - ensures function is called at most once per wait period
export function throttle<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Return,
  wait: number
): (this: This, ...args: Args) => void {
  let inThrottle = false;
  let lastInvoke: (() => void) | null = null;

  return function (this: This, ...args: Args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;

        if (lastInvoke) {
          lastInvoke();
          lastInvoke = null;
        }
      }, wait);
    } else {
      lastInvoke = () => func.apply(this, args);
    }
  };
}

// Async debounce - debounces async functions
export function debounceAsync<This, Args extends unknown[], Result>(
  func: (this: This, ...args: Args) => Promise<Result>,
  wait: number
): (this: This, ...args: Args) => Promise<Result> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<Result> | null = null;

  return function (this: This, ...args: Args): Promise<Result> {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await func.apply(this, args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            pendingPromise = null;
            timeoutId = null;
          }
        }, wait);
      });
    }

    return pendingPromise;
  };
}

// Leading edge debounce - executes immediately, then debounces subsequent calls
export function debounceLeading<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Return,
  wait: number
): (this: This, ...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: This, ...args: Args) {
    if (timeoutId === null) {
      func.apply(this, args);
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
    }, wait);
  };
}

// Debounce with cancel method
export interface DebouncedFunction<This, Args extends unknown[]> {
  (this: This, ...args: Args): void;
  cancel(): void;
  flush(): void;
}

export function debounceWithCancel<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Return,
  wait: number
): DebouncedFunction<This, Args> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingCall: (() => void) | null = null;

  const debounced = function (this: This, ...args: Args) {
    pendingCall = () => func.apply(this, args);

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      pendingCall?.();
      pendingCall = null;
      timeoutId = null;
    }, wait);
  } as DebouncedFunction<This, Args>;

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingCall = null;
  };

  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingCall?.();
    pendingCall = null;
  };

  return debounced;
}

// Debounce with max wait - ensures function is called at least once per maxWait
export function debounceWithMaxWait<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Return,
  wait: number,
  maxWait: number
): (this: This, ...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingCall: (() => void) | null = null;

  const invoke = () => {
    pendingCall?.();
    pendingCall = null;
    
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
  };

  return function (this: This, ...args: Args) {
    pendingCall = () => func.apply(this, args);

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(invoke, wait);

    if (maxTimeoutId === null) {
      maxTimeoutId = setTimeout(invoke, maxWait);
    }
  };
}
