export default function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  nested = false,
}) {
  if (!open) return null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 ${
        nested ? 'z-[70]' : 'z-[60]'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative bg-white rounded-xl shadow-xl w-full ${
          wide ? 'max-w-lg' : 'max-w-md'
        } p-6`}
      >
        {title && (
          <h3 id="modal-title" className="text-lg font-bold text-gray-900 mb-5">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  )
}
