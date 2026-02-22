'use client';

interface DeathModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal exibido quando o personagem morre (saúde chegou a 0).
 * Informa que voltará ao nível inicial sem itens e permite fechar para continuar.
 */
export function DeathModal({ open, onClose }: DeathModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="death-modal-title"
      aria-describedby="death-modal-desc"
    >
      <div
        className="rounded-2xl bg-slate-800 border-2 border-rose-600/80 shadow-2xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-rose-900/50 px-6 py-4 border-b border-rose-700/50">
          <h2 id="death-modal-title" className="text-xl font-bold text-rose-100 text-center">
            Você morreu
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <p id="death-modal-desc" className="text-slate-300 text-center text-sm leading-relaxed">
            Sua saúde chegou a zero. Você volta ao nível inicial, sem nenhum dos itens desbloqueados.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
