import { useMemo, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue.ts';

export function useListQueryParams(
  filters: Record<string, string>,
  search: string,
): Record<string, string | undefined> {
  const debouncedSearch = useDebouncedValue(search);

  return useMemo(() => {
    const params: Record<string, string | undefined> = {};
    if (debouncedSearch.trim()) {
      params.q = debouncedSearch.trim();
    }
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params[key] = value;
      }
    }
    return params;
  }, [debouncedSearch, JSON.stringify(filters)]);
}

export function useListSearch(initial = ''): {
  readonly search: string;
  readonly setSearch: (value: string) => void;
} {
  const [search, setSearch] = useState(initial);
  return { search, setSearch };
}
