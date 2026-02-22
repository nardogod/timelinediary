'use client';

import { useEffect, useState } from 'react';

export interface LevelUpPayload {
  levelUp: boolean;
  newLevel?: number;
  previousLevel?: number;
  xpEarned?: number;
}

interface LevelUpEffectProps {
  /** Quando definido, exibe o efeito de level up e chama onClose após a duração. */
  payload: LevelUpPayload | null;
  onClose: () => void;
  /** Duração em ms antes de fechar (default 2500). */
  duration?: number;
}

/**
 * Efeito visual de "Level Up!": overlay com texto e animação simples (scale + brilho).
 * Use quando a API retornar game.levelUp após concluir tarefa/evento.
 */
export function LevelUpEffect({ payload, onClose, duration = 2500 }: LevelUpEffectProps) {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!payload?.levelUp || payload.newLevel == null) return;
    setVisible(true);
    setEntered(false);
    const t = setTimeout(() => setEntered(true), 50);
    const t2 = setTimeout(() => {
      setVisible(false);
      onClose();
    }, duration);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [payload?.levelUp, payload?.newLevel, duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  if (!visible || !payload?.levelUp) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
      onClick={handleClose}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClose(); }}
      role="button"
      tabIndex={0}
      aria-label="Fechar aviso de level up"
    >
      <div className="absolute inset-0 bg-black/40 opacity-100 transition-opacity duration-300" />
      <div
        className={`relative flex flex-col items-center justify-center transition-all duration-300 pointer-events-none ${
          entered ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        <div className="rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 px-8 py-6 shadow-2xl ring-4 ring-amber-300/80 animate-pulse">
          <p className="text-center text-2xl font-bold text-amber-950 drop-shadow">
            Level Up!
          </p>
          <p className="text-center text-4xl font-black text-amber-950 mt-1">
            Nível {payload.newLevel}
          </p>
          {payload.xpEarned != null && (
            <p className="text-center text-sm text-amber-900/90 mt-2">
              +{payload.xpEarned} XP
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
