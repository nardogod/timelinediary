'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import RoomCanvasBase from '@/components/game/RoomCanvasBase';
import { DEFAULT_ROOM_OPTIONS } from '@/lib/game/room-canvas-config';
import type { CasaRoomConfig } from '@/lib/game/casa-room-types';
import type { RoomCanvasItem } from '@/lib/game/room-canvas-config';

/**
 * Minha Casa — quarto em perspectiva (estilo zipgame/cair).
 * Config editada em Dev → Ambientes; salva em public/game/casa-room.json.
 */
export default function CasaPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<CasaRoomConfig | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/game/casa-room.json');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      setConfig(null);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  const opts = config?.options ? { ...DEFAULT_ROOM_OPTIONS, ...config.options } : DEFAULT_ROOM_OPTIONS;
  const items = (config?.items ?? []) as RoomCanvasItem[];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
        <Link href="/game" className="p-2 -m-2 rounded-lg hover:bg-slate-800" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold">Minha Casa</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 flex flex-col items-center">
        <div className="rounded-xl border border-slate-600 bg-slate-800/50 overflow-hidden shadow-xl w-full max-w-[min(100%,400px)]">
          <RoomCanvasBase
            backgroundImageSrc={config?.backgroundImageSrc ?? undefined}
            fullRoomImageSrc={config?.fullRoomImageSrc ?? undefined}
            colors={config?.colors}
            options={opts}
            items={items}
            className="rounded-lg"
          />
        </div>
        <p className="text-slate-500 text-sm mt-4 text-center max-w-md">
          Quarto em perspectiva. Edite em <strong>Meu Mundo → Dev → Ambientes</strong> (imagem de fundo, elementos, cama).
        </p>
      </main>
    </div>
  );
}
