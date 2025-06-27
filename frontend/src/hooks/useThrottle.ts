import { useCallback, useRef } from "react";

export const useThrottle = (callback: (...args: any[]) => void, delay: number) => {
  const lastRan = useRef<number>(0);

  const throttledCallback = useCallback((...args: any[]) => {
    const now = Date.now();
    
    if (now - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = now;
    }
  }, [callback, delay]);

  return throttledCallback;
};