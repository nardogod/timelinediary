'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Zap, Coins, Palette, Check } from 'lucide-react';
import IsometricWorkRoom from '@/components/game/IsometricWorkRoom';
import type { RoomLayoutTrabalho } from '@/lib/db/game-types';
import type { RoomTemplate } from '@/lib/game/room-template-types';
import type { WorkRoomConfig } from '@/lib/game/work-room-types';

type GameStatus = {
  health: number;
  stress: number;
  coins: number;
  level: number;
};

export default function TrabalhoPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomLayout, setRoomLayout] = useState<RoomLayoutTrabalho | null>(null);
  const [roomTemplate, setRoomTemplate] = useState<RoomTemplate | null>(null);
  const [workRoomConfig, setWorkRoomConfig] = useState<WorkRoomConfig | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/game/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('[TrabalhoPage] Erro ao carregar status:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadRoomLayout = useCallback(async () => {
    try {
      const res = await fetch(typeof window !== 'undefined' ? `${window.location.origin}/api/game/room?room=trabalho` : '/api/game/room?room=trabalho');
      if (res.ok) {
        const data = await res.json();
        setRoomLayout(data.layout ?? null);
      }
    } catch (e) {
      console.error('[TrabalhoPage] Erro ao carregar layout:', e);
    }
  }, []);

  const loadRoomTemplate = useCallback(async () => {
    if (process.env.NODE_ENV !== 'development') return;
    try {
      const res = await fetch('/api/game/dev/room-template');
      if (res.ok) {
        const data = await res.json();
        if (data?.items?.length) setRoomTemplate(data);
      }
    } catch (e) {
      console.error('[TrabalhoPage] Erro ao carregar template:', e);
    }
  }, []);

  const loadWorkRoomConfig = useCallback(async () => {
    try {
      const res = await fetch('/game/work-room.json');
      if (res.ok) {
        const data = await res.json();
        setWorkRoomConfig(data);
      } else {
        setWorkRoomConfig(null);
      }
    } catch {
      setWorkRoomConfig(null);
    }
  }, []);

  const saveRoomLayout = useCallback(async (layout: RoomLayoutTrabalho) => {
    setLayoutError(null);
    setSavingLayout(true);
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/api/game/room?room=trabalho`
      : '/api/game/room?room=trabalho';
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoomLayout(data.layout ?? null);
      } else {
        setLayoutError('Não foi possível salvar a posição.');
      }
    } catch (_e) {
      setLayoutError('Erro de conexão. Verifique se está online e tente de novo.');
    } finally {
      setSavingLayout(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadStatus();
    loadRoomLayout();
    loadRoomTemplate();
    loadWorkRoomConfig();
  }, [user, authLoading, router, loadStatus, loadRoomLayout, loadRoomTemplate, loadWorkRoomConfig]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <span className="text-white">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-700">
        <Link href="/game" className="p-2 -m-2 rounded-lg hover:bg-slate-800" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">Sala de Trabalho</h1>
        {!workRoomConfig?.fullRoomImageSrc && (
          <button
            type="button"
            onClick={() => {
              setLayoutError(null);
              setEditMode((prev) => !prev);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm"
          >
            {editMode ? <Check className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
            {editMode ? 'Concluir' : 'Decorar sala'}
          </button>
        )}
      </header>

      <main className="flex-1 overflow-auto p-4 flex flex-col gap-6 items-center">
        <section className="w-full max-w-[min(100%,400px)]">
          <IsometricWorkRoom
            layout={roomLayout}
            template={roomTemplate ?? undefined}
            editMode={editMode}
            onLayoutChange={saveRoomLayout}
            fullRoomImageSrc={workRoomConfig?.fullRoomImageSrc ?? undefined}
          />
          {savingLayout && (
            <p className="text-xs text-slate-500 mt-2 text-center">Salvando posições...</p>
          )}
          {layoutError && (
            <p className="text-xs text-amber-400 mt-2 text-center" role="alert">{layoutError}</p>
          )}
        </section>

        {status && (
          <section className="rounded-xl bg-slate-800/80 p-4 space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Status na sala</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Saúde: {status.health}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Stress: {status.stress}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-300" />
                <span>Moedas: {status.coins}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Nível: {status.level}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${status.health}%` }}
              />
            </div>
            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${status.stress}%` }}
              />
            </div>
          </section>
        )}

        <p className="text-slate-500 text-sm text-center">
          Hoje: ganhos e tarefas serão exibidos aqui quando vinculados à timeline.
        </p>
      </main>
    </div>
  );
}
