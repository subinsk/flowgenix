import { useCallback, useRef } from "react";

export function useThrottle<T extends (...args: unknown[]) => void>(callback: T, delay: number) {
  const lastRan = useRef<number>(0);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = now;
    }
  }, [callback, delay]);

  return throttledCallback as (...args: Parameters<T>) => void;
}