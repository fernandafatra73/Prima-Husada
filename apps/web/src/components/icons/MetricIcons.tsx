import type { JSX } from 'react';

export type MetricTone = 'blue' | 'green' | 'amber' | 'violet' | 'slate' | 'rose';

interface IconProps {
  readonly className?: string;
}

export type MetricIconKind =
  | 'users'
  | 'clock'
  | 'check'
  | 'currency'
  | 'percent'
  | 'tag'
  | 'clipboard'
  | 'document'
  | 'stethoscope'
  | 'chart';

function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 19c.8-3 3.2-4.5 5.5-4.5S13.7 16 14.5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="17.5" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14.5 16.5c1.2-1.5 2.8-2 4.5-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClock({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 12.2 10.8 14.5 15.8 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCurrency({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 9h0M17 15h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconPercent({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconTag({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12V6.5A2.5 2.5 0 0 1 6.5 4H12l8 8-6 6-8-8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconClipboard({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4h6v3H9z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11h8M8 15h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconDocument({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h7l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 4v4h4M8 12h8M8 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconStethoscope({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4v6a4 4 0 0 0 8 0V4M10 4h0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 14a4 4 0 0 0 4 4v1h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="20" cy="19" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconChart({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19V9M10 19V5M15 19v-6M20 19V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS: Record<MetricIconKind, (props: IconProps) => JSX.Element> = {
  users: IconUsers,
  clock: IconClock,
  check: IconCheck,
  currency: IconCurrency,
  percent: IconPercent,
  tag: IconTag,
  clipboard: IconClipboard,
  document: IconDocument,
  stethoscope: IconStethoscope,
  chart: IconChart,
};

interface MetricIconProps {
  readonly kind: MetricIconKind;
  readonly tone: MetricTone;
}

export function MetricIcon({ kind, tone }: MetricIconProps) {
  const Icon = ICONS[kind];
  return (
    <span className={`metric-card__icon metric-card__icon--${tone}`} aria-hidden>
      <Icon className="metric-card__icon-svg" />
    </span>
  );
}
