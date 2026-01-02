import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface CacheContextType {
  getCache: <T>(key: string) => T | null;
  setCache: <T>(key: string, value: T) => void;
  clearCache: (key?: string) => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCache] = useState<Record<string, any>>({});

  const getCache = useCallback(<T,>(key: string): T | null => {
    return cache[key] || null;
  }, [cache]);

  const setCacheValue = useCallback(<T,>(key: string, value: T) => {
    setCache((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      setCache((prev) => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  return (
    <CacheContext.Provider value={{ getCache, setCache: setCacheValue, clearCache }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error("useCache must be used within a CacheProvider");
  }
  return context;
};
