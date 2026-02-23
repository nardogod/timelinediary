"use client";

import Link from "next/link";
import { Sword } from "pixelarticons/react";

/**
 * Botão "Meu Mundo" – entrada para o jogo (ícone espada + aventura).
 */
export default function MeuMundoButton() {
  return (
    <Link
      href="/game"
      className="flex items-center justify-center min-w-0 h-8 py-1 px-2 rounded-md bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 hover:from-amber-200 hover:via-amber-300 hover:to-amber-500 text-amber-950 border border-amber-700 transition-colors active:scale-95 shadow hover:shadow-md text-[11px]"
      aria-label="Meu Mundo - aventura"
      title="Meu Mundo - aventura"
    >
      <Sword width={20} height={20} className="flex-shrink-0 mr-0.5" />
      <span className="font-medium whitespace-nowrap">aventura</span>
    </Link>
  );
}
