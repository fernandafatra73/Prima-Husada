import type { CSSProperties } from 'react';

export interface SummaryCardItem {
  readonly label: string;
  readonly value: string;
  readonly accent?: string;
}

interface PageSummaryCardsProps {
  readonly items: SummaryCardItem[];
}

export function PageSummaryCards({ items }: PageSummaryCardsProps) {
  return (
    <div className="page-summary-grid">
      {items.map((item) => (
        <article
          key={item.label}
          className="page-summary-card"
          style={
            item.accent
              ? ({ '--summary-accent': item.accent } as CSSProperties)
              : undefined
          }
        >
          <p className="page-summary-card__label">{item.label}</p>
          <p className="page-summary-card__value">{item.value}</p>
        </article>
      ))}
    </div>
  );
}
