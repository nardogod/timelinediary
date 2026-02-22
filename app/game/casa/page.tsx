'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import RoomCanvasBase from '@/components/game/RoomCanvasBase';
import { DEFAULT_ROOM_OPTIONS } from '@/lib/game/room-canvas-config';
import { getHouseStressReduction, type HouseDef } from '@/lib/game/rooms-catalog';
import type { CasaRoomConfig } from '@/lib/game/casa-room-types';
import type { RoomCanvasItem } from '@/lib/game/room-canvas-config';
import type { GameProfile } from '@/lib/db/game-types';

function getTodayBrazil(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

const COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 horas

type RoomsData = {
  catalog: { house: HouseDef[]; work: unknown[] };
  owned: { house: string[]; work: string[] };
  current_house_id: string;
  current_work_room_id: string;
};

/**
 * Minha Casa — quartos do catálogo com benefícios, setas para trocar e botão comprar/ativar.
 * Relaxar em casa: reduz stress e aumenta saúde. Cooldown 3h.
 */
export default function CasaPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<CasaRoomConfig | null>(null);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [roomsData, setRoomsData] = useState<RoomsData | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [relaxLoading, setRelaxLoading] = useState(false);
  const [relaxError, setRelaxError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cooldownEndMs, setCooldownEndMs] = useState<number>(0);
  const [, setCooldownTick] = useState(0);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/game/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error('[CasaPage] Erro ao carregar perfil:', e);
    }
  }, [user]);

  const loadRooms = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/game/rooms');
      if (res.ok) setRoomsData(await res.json());
    } catch (e) {
      console.error('[CasaPage] Erro ao carregar casas:', e);
    }
  }, [user]);

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
    if (user) {
      loadProfile();
      loadRooms();
    }
  }, [user, authLoading, router, loadProfile, loadRooms]);

  const nextFromProfile = profile?.last_relax_at
    ? new Date(profile.last_relax_at).getTime() + COOLDOWN_MS
    : 0;
  const effectiveCooldownEnd = Math.max(cooldownEndMs, nextFromProfile > Date.now() ? nextFromProfile : 0);
  const cooldownSecondsLeft = Math.max(0, Math.ceil((effectiveCooldownEnd - Date.now()) / 1000));
  const inCooldown = cooldownSecondsLeft > 0;

  useEffect(() => {
    if (profile?.last_relax_at) {
      const next = new Date(profile.last_relax_at).getTime() + COOLDOWN_MS;
      if (next > Date.now()) setCooldownEndMs(next);
    }
  }, [profile?.last_relax_at]);

  useEffect(() => {
    if (effectiveCooldownEnd <= 0) return;
    const t = setInterval(() => setCooldownTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [effectiveCooldownEnd]);
  useEffect(() => {
    if (effectiveCooldownEnd > 0 && cooldownSecondsLeft <= 0) setCooldownEndMs(0);
  }, [effectiveCooldownEnd, cooldownSecondsLeft]);

  const houses = roomsData?.catalog?.house ?? [];
  const currentHouse = houses[viewingIndex];
  const ownedHouses = roomsData?.owned?.house ?? [];
  const currentHouseId = roomsData?.current_house_id ?? 'casa_1';
  const ownsCurrent = currentHouse && (ownedHouses.includes(currentHouse.id) || currentHouse.price <= 0);
  const isActive = currentHouse && currentHouse.id === currentHouseId;

  useEffect(() => {
    if (houses.length > 0 && viewingIndex >= houses.length) setViewingIndex(Math.max(0, houses.length - 1));
  }, [houses.length, viewingIndex]);

  const handleRelax = useCallback(async () => {
    if (relaxLoading || inCooldown) return;
    setRelaxError(null);
    setRelaxLoading(true);
    try {
      const res = await fetch('/api/game/relax', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        if (data.profile) setProfile(data.profile);
        setCooldownEndMs(Date.now() + COOLDOWN_MS);
        return;
      }
      if (data?.error === 'already_used' || data?.message) {
        setRelaxError(data?.message ?? 'Aguarde 3 horas entre um uso e outro.');
        if (data.profile) setProfile(data.profile);
        if (data.next_available_at) setCooldownEndMs(new Date(data.next_available_at).getTime());
      } else {
        setRelaxError('Não foi possível relaxar. Tente de novo.');
      }
    } catch (_e) {
      setRelaxError('Erro de conexão. Tente de novo.');
    } finally {
      setRelaxLoading(false);
    }
  }, [relaxLoading, inCooldown]);

  const handlePrev = useCallback(() => {
    setViewingIndex((i) => (i <= 0 ? houses.length - 1 : i - 1));
  }, [houses.length]);

  const handleNext = useCallback(() => {
    setViewingIndex((i) => (i >= houses.length - 1 ? 0 : i + 1));
  }, [houses.length]);

  const handlePurchaseOrActivate = useCallback(async () => {
    if (!currentHouse || actionLoading) return;
    if (ownsCurrent) {
      if (isActive) return;
      setActionLoading(true);
      try {
        const res = await fetch('/api/game/rooms', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_house_id: currentHouse.id }),
        });
        if (res.ok) await loadRooms();
      } finally {
        setActionLoading(false);
      }
      return;
    }
    if (currentHouse.price <= 0) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/game/rooms/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_type: 'house', room_id: currentHouse.id }),
      });
      if (res.ok) {
        await loadRooms();
        await loadProfile();
      }
    } finally {
      setActionLoading(false);
    }
  }, [currentHouse, ownsCurrent, isActive, actionLoading, loadRooms, loadProfile]);

  const opts = config?.options ? { ...DEFAULT_ROOM_OPTIONS, ...config.options } : DEFAULT_ROOM_OPTIONS;
  const items = (config?.items ?? []) as RoomCanvasItem[];
  const canAfford = profile && currentHouse && profile.coins >= currentHouse.price;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
        <Link href="/game" className="p-2 -m-2 rounded-lg hover:bg-slate-800" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold">Minha Casa</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-[min(100%,400px)] space-y-0">
          {/* Verde: benefícios que este quarto traz */}
          {currentHouse && (
            <div className="rounded-t-xl border border-b-0 border-slate-600 bg-emerald-900/30 px-4 py-2.5 text-center">
              <p className="text-sm text-emerald-200">
                <strong className="text-white">{currentHouse.name}</strong>
                {' · '}
                Reduz <strong>{getHouseStressReduction(currentHouse)}</strong> de stress e +<strong>{currentHouse.health_bonus}</strong> saúde ao relaxar
              </p>
            </div>
          )}

          {/* Área do quarto com setas (azul) */}
          <div className="relative rounded-xl border border-slate-600 bg-slate-800/50 overflow-hidden shadow-xl">
            {/* Seta esquerda */}
            {houses.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-700/90 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-white shadow-lg"
                aria-label="Quarto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {/* Seta direita */}
            {houses.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-700/90 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-white shadow-lg"
                aria-label="Próximo quarto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>)}

            {currentHouse?.imagePath ? (
              <div className="relative w-full aspect-[4/3] min-h-[200px] bg-slate-800">
                <Image
                  src={currentHouse.imagePath}
                  alt={currentHouse.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 400px) 100vw, 400px"
                  unoptimized
                />
              </div>
            ) : (
              <RoomCanvasBase
                backgroundImageSrc={config?.backgroundImageSrc ?? undefined}
                fullRoomImageSrc={config?.fullRoomImageSrc ?? undefined}
                colors={config?.colors}
                options={opts}
                items={items}
                className="rounded-lg"
              />
            )}
          </div>

          {/* Vermelho: botão preço / Possui / Ativar este quarto */}
          {currentHouse && (
            <div className="rounded-b-xl border border-t-0 border-slate-600 bg-slate-800/80 px-4 py-3">
              {ownsCurrent ? (
                isActive ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 rounded-lg bg-slate-600 text-slate-300 font-medium cursor-default"
                  >
                    Quarto ativo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePurchaseOrActivate}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium"
                  >
                    {actionLoading ? 'Ativando...' : 'Ativar este quarto'}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handlePurchaseOrActivate}
                  disabled={actionLoading || !canAfford}
                  className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
                >
                  {actionLoading ? 'Comprando...' : (
                    <>Requer <strong>{currentHouse.price}</strong> moedas{profile != null && !canAfford ? ` (você tem ${profile.coins})` : ''}</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {profile != null && (
          <section className="mt-4 w-full max-w-[min(100%,400px)] rounded-xl bg-slate-800/80 p-4 space-y-2">
            <h2 className="text-sm font-medium text-slate-300">Status</h2>
            {profile.health <= 50 && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-900/50 border border-amber-600/50 px-3 py-2 text-amber-200 text-sm">
                <span className="font-medium">Doente</span>
                <span className="text-amber-300/90">— Relaxar ajuda a recuperar saúde.</span>
              </div>
            )}
            {profile.stress >= 100 && (
              <div className="rounded-lg bg-rose-900/50 border border-rose-600/50 px-3 py-2 text-rose-200 text-sm space-y-1">
                <p className="font-medium">Burnout</p>
                <p className="text-rose-300/90 text-xs">Trabalho e estudos não dão XP nem moedas até o stress baixar. Relaxe em casa ou faça atividades de lazer na sua vida pessoal.</p>
              </div>
            )}
            {profile.health > 0 && profile.health <= 25 && (
              <div className="rounded-lg bg-slate-700/80 border border-amber-600/60 px-3 py-2 text-amber-100 text-sm space-y-1">
                <p className="font-medium">Prestes a morrer</p>
                <p className="text-amber-200/90 text-xs">Se continuar trabalhando ou registrando atividades que custam saúde, ela pode chegar a 0 e você volta ao nível inicial. Você decide.</p>
              </div>
            )}
            <div className="flex gap-4 text-sm text-slate-300">
              <span>Saúde: {profile.health}%</span>
              <span>Stress: {profile.stress}%</span>
            </div>
          </section>
        )}

        <section className="mt-4 w-full max-w-[min(100%,400px)] rounded-xl bg-slate-800/80 p-4">
          <h2 className="text-sm font-medium text-slate-300 mb-2">Relaxar (cooldown 3h)</h2>
          {inCooldown ? (
            <p className="text-slate-400 text-sm text-center">
              Próximo uso em <strong className="text-white">
                {cooldownSecondsLeft >= 3600
                  ? `${Math.floor(cooldownSecondsLeft / 3600)}h ${Math.floor((cooldownSecondsLeft % 3600) / 60)}min`
                  : cooldownSecondsLeft >= 60
                    ? `${Math.floor(cooldownSecondsLeft / 60)}min`
                    : `${cooldownSecondsLeft}s`}
              </strong>
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRelax}
                disabled={relaxLoading}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium"
              >
                <Sparkles className="w-4 h-4" />
                {relaxLoading ? 'Relaxando...' : 'Relaxar em casa'}
              </button>
              {relaxError && (
                <p className="text-amber-400 text-sm mt-2 text-center" role="alert">{relaxError}</p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
