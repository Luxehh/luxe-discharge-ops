import Modal from './Modal'

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  loading,
  title = 'Please confirm',
  message = 'Delete this login? That person will no longer be able to sign in.',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-400 rounded-lg hover:bg-red-50 disabled:opacity-60"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}
