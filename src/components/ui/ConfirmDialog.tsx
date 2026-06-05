interface Props {
  open: boolean
  titulo: string
  mensagem: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, titulo, mensagem, onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-text">{titulo}</h3>
        <p className="mt-2 text-sm text-muted">{mensagem}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-bg"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
