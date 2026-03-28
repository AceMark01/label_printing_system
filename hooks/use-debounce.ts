import { useState, useEffect } from 'react';

/**
 * A generic, strongly-typed debounce hook.
 * Delays updating the debounced value until after delayMs has elapsed
 * since the last time the value was changed.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Cancel the timeout if value changes before the delay finishes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
