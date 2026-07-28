import { Modal } from './Modal.tsx';

interface ConfirmModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly loading?: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  loading = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal open={open} title={title} onClose={onClose} size="md">
      <p className="modal__message">{message}</p>
      <div className="form-actions modal__footer">
        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>
          Batal
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Menghapus…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
