import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ListRefreshContextValue {
  readonly version: number;
  readonly bump: () => void;
}

const ListRefreshContext = createContext<ListRefreshContextValue | null>(null);

export function ListRefreshProvider({ children }: { readonly children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);
  const value = useMemo(() => ({ version, bump }), [version, bump]);

  return <ListRefreshContext.Provider value={value}>{children}</ListRefreshContext.Provider>;
}

export function useListRefresh(): ListRefreshContextValue {
  const ctx = useContext(ListRefreshContext);
  if (!ctx) {
    throw new Error('useListRefresh must be used within ListRefreshProvider');
  }
  return ctx;
}
