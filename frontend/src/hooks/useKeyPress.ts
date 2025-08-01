import { useCallback, useEffect } from "react";

export const useKeyPress = (targetKey: string, callback: () => void) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === targetKey) {
      callback();
    }
  }, [targetKey, callback]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
};