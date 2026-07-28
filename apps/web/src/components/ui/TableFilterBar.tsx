import type { ReactNode } from 'react';

export interface FilterTab {
  readonly id: string;
  readonly label: string;
}

export interface FilterSelect {
  readonly id: string;
  /** Untuk aksesibilitas (aria-label), tidak ditampilkan di UI. */
  readonly label: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}

interface TableFilterBarProps {
  readonly tabs?: readonly FilterTab[];
  readonly activeTab?: string;
  readonly onTabChange?: (tabId: string) => void;
  readonly selects?: readonly FilterSelect[];
  readonly searchPlaceholder?: string;
  readonly searchValue?: string;
  readonly onSearchChange?: (value: string) => void;
  readonly onRefresh?: () => void;
  readonly extra?: ReactNode;
}

function IconSearch() {
  return (
    <svg className="filter-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12a8 8 0 0 1 13.5-5.7M20 6v5h-5M20 12a8 8 0 0 1-13.5 5.7M4 18v-5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TableFilterBar({
  tabs,
  activeTab,
  onTabChange,
  selects,
  searchPlaceholder = 'Cari…',
  searchValue = '',
  onSearchChange,
  onRefresh,
  extra,
}: TableFilterBarProps) {
  return (
    <div className="table-filter-bar">
      {tabs && tabs.length > 0 && onTabChange && (
        <div className="table-filter-bar__tabs filter-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`filter-tab ${activeTab === tab.id ? 'filter-tab--active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="table-filter-bar__controls">
        {extra}
        {selects?.map((sel) => (
          <select
            key={sel.id}
            id={sel.id}
            className="filter-control filter-control--select"
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            aria-label={sel.label}
          >
            {sel.placeholder && <option value="">{sel.placeholder}</option>}
            {sel.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {onSearchChange && (
          <div className="filter-control filter-control--search filter-control--grow">
            <IconSearch />
            <input
              type="search"
              id="filter-search"
              className="filter-search__input"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={searchPlaceholder}
            />
          </div>
        )}

        {onRefresh && (
          <button
            type="button"
            className="filter-control filter-control--icon"
            onClick={onRefresh}
            aria-label="Muat ulang"
            title="Muat ulang"
          >
            <IconRefresh />
          </button>
        )}
      </div>
    </div>
  );
}
