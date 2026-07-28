interface ModalFormFooterProps {
  readonly onCancel: () => void;
  readonly submitLabel: string;
  readonly loading?: boolean;
}

export function ModalFormFooter({ onCancel, submitLabel, loading = false }: ModalFormFooterProps) {
  return (
    <div className="form-actions form-actions--end form-grid--full">
      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? 'Menyimpan…' : submitLabel}
      </button>
      <button type="button" className="btn btn--ghost" onClick={onCancel}>
        Batal
      </button>
    </div>
  );
}
