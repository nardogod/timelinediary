'use client';

import Link from 'next/link';

/**
 * Botão "Meu Mundo" – entrada para o jogo (estilo Habbo 2D, ícone próprio).
 * Colocar na área da legenda da timeline (canto esquerdo).
 */
export default function MeuMundoButton() {
  return (
    <Link
      href="/game"
      className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors active:scale-95"
      aria-label="Meu Mundo"
      title="Meu Mundo"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-hidden
      >
        <path
          d="M12 2L3 7v11h6v-6h6v6h6V7l-9-5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
