'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings2, Scissors, LayoutGrid } from 'lucide-react';
import RoomEditor from '@/components/game/dev/RoomEditor';
import SpriteSheetSlicer from '@/components/game/dev/SpriteSheetSlicer';
import AmbientesEditor from '@/components/game/dev/AmbientesEditor';
import type { RoomTemplate } from '@/lib/game/room-template-types';

type Tab = 'room' | 'slices' | 'ambientes';

const IS_DEV =
  typeof window !== 'undefined'
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : process.env.NODE_ENV === 'development';

export default function GameDevPage() {
  const [tab, setTab] = useState<Tab>('room');
  const [template, setTemplate] = useState<RoomTemplate | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadTemplate = useCallback(async () => {
    if (!IS_DEV) return;
    try {
      const res = await fetch('/api/game/dev/room-template');
      if (res.ok) {
        const data = await res.json();
        setTemplate(data);
      }
    } catch (e) {
      console.error('[GameDev] loadTemplate', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleSaveTemplate = useCallback(async (t: RoomTemplate) => {
    if (!IS_DEV) return;
    try {
      const res = await fetch('/api/game/dev/room-template', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      });
      if (res.ok) {
        setTemplate(t);
      }
    } catch (e) {
      console.error('[GameDev] saveTemplate', e);
    }
  }, []);

  if (typeof window !== 'undefined' && !IS_DEV) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <p className="text-amber-400">Esta página só está disponível em modo desenvolvimento (localhost).</p>
        <Link href="/game" className="mt-4 text-slate-400 hover:text-white">Voltar ao Meu Mundo</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-700">
        <Link href="/game" className="p-2 -m-2 rounded-lg hover:bg-slate-800" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold text-amber-400">Dev — Editor da sala e sprite sheet</h1>
      </header>

      <div className="flex border-b border-slate-700">
        <button
          type="button"
          onClick={() => setTab('room')}
          className={`flex items-center gap-2 px-4 py-3 text-sm ${tab === 'room' ? 'bg-slate-700 text-white border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Settings2 className="w-4 h-4" />
          Editor da sala
        </button>
        <button
          type="button"
          onClick={() => setTab('slices')}
          className={`flex items-center gap-2 px-4 py-3 text-sm ${tab === 'slices' ? 'bg-slate-700 text-white border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Scissors className="w-4 h-4" />
          Cortar sprite sheet
        </button>
        <button
          type="button"
          onClick={() => setTab('ambientes')}
          className={`flex items-center gap-2 px-4 py-3 text-sm ${tab === 'ambientes' ? 'bg-slate-700 text-white border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}
        >
          <LayoutGrid className="w-4 h-4" />
          Ambientes
        </button>
      </div>

      <main className="flex-1 overflow-auto p-4">
        {tab === 'room' && (
          loaded ? (
            <RoomEditor initialTemplate={template} onSave={handleSaveTemplate} />
          ) : (
            <p className="text-slate-400">Carregando template...</p>
          )
        )}
        {tab === 'slices' && <SpriteSheetSlicer />}
        {tab === 'ambientes' && <AmbientesEditor />}
      </main>
    </div>
  );
}
