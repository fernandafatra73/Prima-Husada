import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '../lib/api.ts';
import type { PaginatedResponse, PaginationMeta } from '../lib/pagination.ts';

const DEFAULT_LIMIT = 20;

export interface ListReloadOptions {
  /** Jump to page 1 after create so new rows are visible. */
  readonly resetPage?: boolean;
}

export function usePaginatedList<T, R extends PaginatedResponse<T> = PaginatedResponse<T>>(
  path: string,
  queryParams?: Record<string, string | undefined>,
  onLoaded?: (response: R) => void,
) {
  const [page, setPage] = useState(1);
  const pageRef = useRef(page);
  pageRef.current = page;
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const filterKey = JSON.stringify(queryParams ?? {});

  const load = useCallback(
    async (options?: ListReloadOptions) => {
      if (options?.resetPage && pageRef.current !== 1) {
        setPage(1);
        return;
      }
      const targetPage = pageRef.current;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(DEFAULT_LIMIT),
          _: String(Date.now()),
        });
        if (queryParams) {
          for (const [key, value] of Object.entries(queryParams)) {
            if (value) params.set(key, value);
          }
        }
        const res = await apiGet<R>(`${path}?${params.toString()}`);
        setItems(res.items);
        setPagination(res.pagination);
        onLoadedRef.current?.(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    },
    [path, filterKey],
  );

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  useEffect(() => {
    void load();
  }, [load, page]);

  const reload = useCallback(
    async (options?: ListReloadOptions) => {
      await load(options);
    },
    [load],
  );

  return {
    items,
    pagination,
    page,
    setPage,
    loading,
    error,
    setError,
    reload,
  };
}
