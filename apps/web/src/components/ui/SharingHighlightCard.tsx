import { formatRupiah } from '../../lib/format.ts';

interface SharingHighlightCardProps {
  readonly amount: string;
  readonly transactionCount: number;
  readonly filtered: boolean;
}

export function SharingHighlightCard({
  amount,
  transactionCount,
  filtered,
}: SharingHighlightCardProps) {
  const pct =
    transactionCount > 0 ? Math.min(100, Math.round((transactionCount / 50) * 100)) : 0;

  return (
    <section className="sharing-highlight-card">
      <div className="sharing-highlight-card__body">
        <p className="sharing-highlight-card__caption">
          {filtered ? 'Akumulasi (filter dokter)' : 'Akumulasi komisi'}
        </p>
        <p className="sharing-highlight-card__amount">{formatRupiah(amount)}</p>
        <p className="sharing-highlight-card__meta">{transactionCount} transaksi</p>
      </div>
      <div className="sharing-highlight-card__chart" aria-hidden>
        <div
          className="sharing-highlight-card__bar"
          style={{ width: `${Math.max(pct, 8)}%` }}
        />
      </div>
    </section>
  );
}
