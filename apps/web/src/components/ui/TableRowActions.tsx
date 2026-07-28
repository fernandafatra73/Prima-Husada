import { IconPencil, IconPrint, IconTrash } from '../icons/ActionIcons.tsx';

interface TableRowActionsProps {
  readonly onEdit: () => void;
  readonly onDelete?: () => void;
  readonly onPrint?: () => void;
  readonly editLabel?: string;
  readonly deleteLabel?: string;
  readonly printLabel?: string;
}

export function TableRowActions({
  onEdit,
  onDelete,
  onPrint,
  editLabel = 'Ubah data',
  deleteLabel = 'Hapus',
  printLabel = 'Cetak hasil',
}: TableRowActionsProps) {
  return (
    <div className="table-actions">
      {onPrint && (
        <button
          type="button"
          className="icon-btn icon-btn--print"
          onClick={onPrint}
          aria-label={printLabel}
          title={printLabel}
        >
          <IconPrint className="icon-btn__svg" />
        </button>
      )}
      <button
        type="button"
        className="icon-btn icon-btn--edit"
        onClick={onEdit}
        aria-label={editLabel}
        title={editLabel}
      >
        <IconPencil className="icon-btn__svg" />
      </button>
      {onDelete && (
        <button
          type="button"
          className="icon-btn icon-btn--delete"
          onClick={onDelete}
          aria-label={deleteLabel}
          title={deleteLabel}
        >
          <IconTrash className="icon-btn__svg" />
        </button>
      )}
    </div>
  );
}
