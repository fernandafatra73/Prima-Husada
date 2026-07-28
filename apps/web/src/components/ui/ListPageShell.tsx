import type { ReactNode } from 'react';
import type { PaginationMeta } from '../../lib/pagination.ts';
import { MetricCardsRow, type MetricCardItem } from './MetricCardsRow.tsx';
import { Pagination } from './Pagination.tsx';
import { TableFilterBar, type FilterSelect, type FilterTab } from './TableFilterBar.tsx';

interface ListPageShellProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
  readonly metrics?: readonly MetricCardItem[];
  readonly tabs?: readonly FilterTab[];
  readonly activeTab?: string;
  readonly onTabChange?: (tabId: string) => void;
  readonly selects?: readonly FilterSelect[];
  readonly searchPlaceholder?: string;
  readonly searchValue?: string;
  readonly onSearchChange?: (value: string) => void;
  readonly onRefresh?: () => void;
  readonly filterExtra?: ReactNode;
  readonly error?: string | null;
  readonly loading?: boolean;
  readonly pagination?: PaginationMeta;
  readonly onPageChange?: (page: number) => void;
  readonly children: ReactNode;
}

export function ListPageShell({
  title,
  subtitle,
  action,
  metrics,
  tabs,
  activeTab,
  onTabChange,
  selects,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onRefresh,
  filterExtra,
  error,
  loading = false,
  pagination,
  onPageChange,
  children,
}: ListPageShellProps) {
  const hasFilters =
    (tabs && tabs.length > 0) ||
    (selects && selects.length > 0) ||
    onSearchChange ||
    onRefresh ||
    filterExtra;

  return (
    <div className="list-page">
      <header className="list-page__header">
        <div>
          <h2 className="list-page__title">{title}</h2>
          {subtitle && <p className="list-page__subtitle">{subtitle}</p>}
        </div>
        {action}
      </header>

      {metrics && metrics.length > 0 && <MetricCardsRow items={[...metrics]} />}

      <section className="data-card">
        {hasFilters && (
          <TableFilterBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selects={selects}
            searchPlaceholder={searchPlaceholder}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onRefresh={onRefresh}
            extra={filterExtra}
          />
        )}

        {error && <p className="alert alert--error data-card__alert">{error}</p>}

        {loading ? (
          <p className="loading-text data-card__loading">Memuat data…</p>
        ) : (
          <>
            <div className="data-card__table">{children}</div>
            {pagination && onPageChange && (
              <Pagination pagination={pagination} onPageChange={onPageChange} />
            )}
          </>
        )}
      </section>
    </div>
  );
}
