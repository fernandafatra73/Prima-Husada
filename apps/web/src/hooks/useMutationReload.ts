import { useCallback } from 'react';
import { useListRefresh } from '../context/ListRefreshContext.tsx';

interface ReloadOptions {
  /** Jump to page 1 after create so new rows are visible. */
  readonly resetPage?: boolean;
}

export function useMutationReload(
  reload: (options?: ReloadOptions) => Promise<void>,
): (options?: ReloadOptions) => Promise<void> {
  const { bump } = useListRefresh();

  return useCallback(
    async (options?: ReloadOptions) => {
      await reload(options);
      bump();
    },
    [reload, bump],
  );
}
