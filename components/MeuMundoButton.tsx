"use client";

import Link from "next/link";
import { Sword } from "pixelarticons/react";

interface MeuMundoButtonProps {
  /**
   * Se informado, abre o "Meu Mundo" daquele usuário (modo visitante) em /game?userId=...
   * Se omitido, abre o mundo do usuário logado em /game.
   */
  userId?: string;
  /**
   * Username do perfil que está sendo visto (para Voltar e links Casa/Trabalho no modo visitante).
   */
  fromUsername?: string;
}

/**
 * Botão "Meu Mundo" – entrada para o jogo (ícone espada + aventura).
 * No perfil de outro usuário, leva ao mundo dele; no seu perfil, ao seu mundo.
 */
export default function MeuMundoButton({ userId, fromUsername }: MeuMundoButtonProps) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (fromUsername) params.set('from', fromUsername);
  const href = params.toString() ? `/game?${params.toString()}` : '/game';
  return (
    <Link
      href={href}
      className="flex items-center justify-center min-w-0 h-8 py-1 px-2 rounded-md bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 hover:from-amber-200 hover:via-amber-300 hover:to-amber-500 text-amber-950 border border-amber-700 transition-colors active:scale-95 shadow hover:shadow-md text-[11px]"
      aria-label="Meu Mundo - aventura"
      title="Meu Mundo - aventura"
    >
      <Sword width={20} height={20} className="flex-shrink-0 mr-0.5" />
      <span className="font-medium whitespace-nowrap">aventura</span>
    </Link>
  );
}
