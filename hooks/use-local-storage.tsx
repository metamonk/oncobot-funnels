import { useState, useCallback, useEffect } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Always initialize with defaultValue to avoid hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Only read from localStorage after hydration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const item = localStorage.getItem(key);
      if (item && item !== 'undefined') {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    
    setIsHydrated(true);
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Update React state immediately
        const newValue = value instanceof Function ? value(storedValue) : value;
        setStoredValue(newValue);
        
        // Defer localStorage update to avoid hydration issues
        if (typeof window !== 'undefined') {
          // Use setTimeout to ensure this happens after render
          setTimeout(() => {
            try {
              if (newValue === undefined) {
                localStorage.removeItem(key);
              } else {
                localStorage.setItem(key, JSON.stringify(newValue));
              }
            } catch (error) {
              console.warn(`Error writing to localStorage key "${key}":`, error);
            }
          }, 0);
        }
      } catch (error) {
        console.warn(`Error saving to localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
}