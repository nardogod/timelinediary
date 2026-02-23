'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Heart, Zap, Coins, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { getWorkRoomCoinsReward, getWorkRoomHealthCost, type WorkRoomDef } from '@/lib/game/rooms-catalog';
import { LevelUpEffect, type LevelUpPayload } from '@/components/game/LevelUpEffect';
import { DeathModal } from '@/components/game/DeathModal';
import type { GameProfile } from '@/lib/db/game-types';

type RoomsData = {
  catalog: { house: unknown[]; work: WorkRoomDef[] };
  owned: { house: string[]; work: string[] };
  current_house_id: string;
  current_work_room_id: string;
};

type GameStatus = {
  health: number;
  stress: number;
  coins: number;
  level: number;
  experience?: number;
  xp_for_next_level?: number;
  xp_in_current_level?: number;
  xp_progress?: number;
  is_sick?: boolean;
  is_burnout?: boolean;
};

function getTodayBrazil(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

const COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 horas

export default function TrabalhoPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewerUserId = searchParams.get('userId');
  const fromUsername = searchParams.get('from');
  const isViewer = !!viewerUserId && viewerUserId !== (user?.id ?? null);
  const gameQuery = [viewerUserId && `userId=${encodeURIComponent(viewerUserId)}`, fromUsername && `from=${encodeURIComponent(fromUsername)}`].filter(Boolean).join('&');
  const backHref = gameQuery ? `/game?${gameQuery}` : '/game';
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [workBonusLoading, setWorkBonusLoading] = useState(false);
  const [workBonusError, setWorkBonusError] = useState<string | null>(null);
  const [cooldownEndMs, setCooldownEndMs] = useState<number>(0);
  const [, setCooldownTick] = useState(0);
  const [roomsData, setRoomsData] = useState<RoomsData | null>(null);
  const [viewingWorkIndex, setViewingWorkIndex] = useState(0);
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [levelUpPayload, setLevelUpPayload] = useState<LevelUpPayload | null>(null);
  const [showDeathModal, setShowDeathModal] = useState(false);

  const loadRooms = useCallback(async () => {
    if (!user) return;
    try {
      const qs = viewerUserId ? `?userId=${encodeURIComponent(viewerUserId)}` : '';
      const res = await fetch(`/api/game/rooms${qs}`);
      if (res.ok) setRoomsData(await res.json());
    } catch (e) {
      console.error('[TrabalhoPage] Erro ao carregar salas:', e);
    }
  }, [user, viewerUserId]);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    try {
      const qs = viewerUserId ? `?userId=${encodeURIComponent(viewerUserId)}` : '';
      const res = await fetch(`/api/game/status${qs}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('[TrabalhoPage] Erro ao carregar status:', e);
    } finally {
      setLoading(false);
    }
  }, [user, viewerUserId]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const qs = viewerUserId ? `?userId=${encodeURIComponent(viewerUserId)}` : '';
      const res = await fetch(`/api/game/profile${qs}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error('[TrabalhoPage] Erro ao carregar perfil:', e);
    }
  }, [user, viewerUserId]);

  const workRooms = roomsData?.catalog?.work ?? [];
  const currentWorkRoom = workRooms[viewingWorkIndex];
  const ownedWork = roomsData?.owned?.work ?? [];
  const currentWorkRoomId = roomsData?.current_work_room_id ?? 'sala_1';
  const ownsCurrentWork = currentWorkRoom && (ownedWork.includes(currentWorkRoom.id) || currentWorkRoom.price <= 0);
  const isWorkActive = currentWorkRoom && currentWorkRoom.id === currentWorkRoomId;

  useEffect(() => {
    if (workRooms.length > 0 && viewingWorkIndex >= workRooms.length) {
      setViewingWorkIndex(Math.max(0, workRooms.length - 1));
    }
  }, [workRooms.length, viewingWorkIndex]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadStatus();
    loadProfile();
    loadRooms();
  }, [user, authLoading, router, loadStatus, loadProfile, loadRooms]);

  // Atualizar status ao voltar para o tab (ex.: depois de concluir tarefa noutra página)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && user) loadStatus();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [user, loadStatus]);

  const nextFromProfile = profile?.last_work_bonus_at
    ? new Date(profile.last_work_bonus_at).getTime() + COOLDOWN_MS
    : 0;
  const effectiveCooldownEnd = Math.max(cooldownEndMs, nextFromProfile > Date.now() ? nextFromProfile : 0);
  const cooldownSecondsLeft = Math.max(0, Math.ceil((effectiveCooldownEnd - Date.now()) / 1000));
  const inCooldown = cooldownSecondsLeft > 0;

  useEffect(() => {
    if (profile?.last_work_bonus_at) {
      const next = new Date(profile.last_work_bonus_at).getTime() + COOLDOWN_MS;
      if (next > Date.now()) setCooldownEndMs(next);
    }
  }, [profile?.last_work_bonus_at]);

  useEffect(() => {
    if (effectiveCooldownEnd <= 0) return;
    const t = setInterval(() => setCooldownTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [effectiveCooldownEnd]);
  useEffect(() => {
    if (effectiveCooldownEnd > 0 && cooldownSecondsLeft <= 0) setCooldownEndMs(0);
  }, [effectiveCooldownEnd, cooldownSecondsLeft]);

  const handleWorkBonus = useCallback(async () => {
    if (workBonusLoading || inCooldown) return;
    setWorkBonusError(null);
    setWorkBonusLoading(true);
    try {
      const res = await fetch('/api/game/work-bonus', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        if (data.profile) setProfile(data.profile);
        setCooldownEndMs(Date.now() + COOLDOWN_MS);
        loadStatus();
        if (data.game?.died) {
          setShowDeathModal(true);
        } else if (data.game?.levelUp && data.game?.newLevel != null) {
          setLevelUpPayload({
            levelUp: true,
            newLevel: data.game.newLevel,
            previousLevel: data.game.previousLevel,
            xpEarned: data.game.xpEarned,
          });
        }
        return;
      }
      const errorMsg =
        data?.message ||
        (data?.error === 'already_used' ? 'Aguarde 3 horas entre um uso e outro.' : null) ||
        (res.status === 401 ? 'Sessão expirada. Faça login novamente.' : null) ||
        data?.error ||
        'Não foi possível ativar. Tente de novo.';
      setWorkBonusError(errorMsg);
      if (data?.profile) setProfile(data.profile);
      if (data?.next_available_at) setCooldownEndMs(new Date(data.next_available_at).getTime());
    } catch (_e) {
      setWorkBonusError('Erro de conexão. Tente de novo.');
    } finally {
      setWorkBonusLoading(false);
    }
  }, [workBonusLoading, inCooldown, loadStatus]);

  const handlePrevWork = useCallback(() => {
    setViewingWorkIndex((i) => (i <= 0 ? workRooms.length - 1 : i - 1));
  }, [workRooms.length]);

  const handleNextWork = useCallback(() => {
    setViewingWorkIndex((i) => (i >= workRooms.length - 1 ? 0 : i + 1));
  }, [workRooms.length]);

  const handlePurchaseOrActivateWork = useCallback(async () => {
    if (!currentWorkRoom || roomActionLoading) return;
    if (ownsCurrentWork) {
      if (isWorkActive) return;
      setRoomActionLoading(true);
      try {
        const res = await fetch('/api/game/rooms', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_work_room_id: currentWorkRoom.id }),
        });
        if (res.ok) await loadRooms();
      } finally {
        setRoomActionLoading(false);
      }
      return;
    }
    if (currentWorkRoom.price <= 0) return;
    setRoomActionLoading(true);
    try {
      const res = await fetch('/api/game/rooms/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_type: 'work', room_id: currentWorkRoom.id }),
      });
      if (res.ok) {
        await loadRooms();
        loadProfile();
        loadStatus();
      }
    } finally {
      setRoomActionLoading(false);
    }
  }, [currentWorkRoom, ownsCurrentWork, isWorkActive, roomActionLoading, loadRooms, loadProfile, loadStatus]);

  const canAffordWork = profile && currentWorkRoom && profile.coins >= currentWorkRoom.price;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <span className="text-white">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <LevelUpEffect payload={levelUpPayload} onClose={() => setLevelUpPayload(null)} />
      <DeathModal
        open={showDeathModal}
        onClose={() => {
          setShowDeathModal(false);
          loadStatus();
          loadProfile();
        }}
      />
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-700">
        <Link href={backHref} className="p-2 -m-2 rounded-lg hover:bg-slate-800" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">{isViewer ? 'Sala de Trabalho' : 'Sala de Trabalho'}</h1>
      </header>

      <main className="flex-1 overflow-auto p-4 flex flex-col gap-6 items-center">
        {/* Bloco seleção de sala: benefícios, imagem com setas, botão (mesma lógica que Minha Casa) */}
        <div className="w-full max-w-[min(100%,400px)] space-y-0">
          {currentWorkRoom && (
            <>
              <div className="rounded-t-xl border border-b-0 border-slate-600 bg-sky-900/30 px-4 py-2.5 text-center">
                <p className="text-sm text-sky-200">
                  <strong className="text-white">{currentWorkRoom.name}</strong>
                  {' · '}
                  +<strong>{getWorkRoomCoinsReward(currentWorkRoom)}</strong> moedas ao ativar Trabalhar
                  {getWorkRoomHealthCost(currentWorkRoom) > 0 && (
                    <> · Custo saúde: <strong>{getWorkRoomHealthCost(currentWorkRoom)}</strong></>
                  )}
                </p>
              </div>
              <div className="relative border-x border-slate-600 bg-slate-800/50 overflow-hidden">
                {workRooms.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevWork}
                      className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-700/90 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-white shadow-lg"
                      aria-label="Sala anterior"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextWork}
                      className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-700/90 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-white shadow-lg"
                      aria-label="Próxima sala"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
                <div className="relative w-full aspect-[4/3] min-h-[200px] bg-slate-800">
                  {currentWorkRoom.imagePath ? (
                    <Image
                      src={currentWorkRoom.imagePath}
                      alt={currentWorkRoom.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 400px) 100vw, 400px"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                      Sem imagem
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-b-xl border border-t-0 border-slate-600 bg-slate-800/80 px-4 py-3">
                {isViewer ? (
                  <p className="text-center text-slate-400 text-sm">Você está apenas visitando</p>
                ) : ownsCurrentWork ? (
                  isWorkActive ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 rounded-lg bg-slate-600 text-slate-300 font-medium cursor-default"
                    >
                      Sala ativa
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePurchaseOrActivateWork}
                      disabled={roomActionLoading}
                      className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
                    >
                      {roomActionLoading ? 'Ativando...' : 'Ativar esta sala'}
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handlePurchaseOrActivateWork}
                    disabled={roomActionLoading || !canAffordWork}
                    className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
                  >
                    {roomActionLoading ? 'Comprando...' : (
                      <>Requer <strong>{currentWorkRoom.price}</strong> moedas{profile != null && !canAffordWork ? ` (você tem ${profile.coins})` : ''}</>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {!isViewer && (
          <section className="rounded-xl bg-slate-800/80 p-4 space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Trabalhar (cooldown 3h)</h2>
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
                  onClick={handleWorkBonus}
                  disabled={workBonusLoading}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
                >
                  <Briefcase className="w-4 h-4" />
                  {workBonusLoading ? 'Ativando...' : 'Trabalhar'}
                </button>
                <p className="text-xs text-slate-500 text-center">−10 saúde, +15 stress, +80 moedas, <strong>+50 XP</strong>. Hoje: tarefas dão mais moedas e menos stress.</p>
                {workBonusError && (
                  <p className="text-amber-400 text-sm mt-2 text-center" role="alert">{workBonusError}</p>
                )}
              </>
            )}
          </section>
        )}

        {status && (
          <section className="rounded-xl bg-slate-800/80 p-4 space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Status na sala</h2>
            {status.is_sick && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-900/50 border border-amber-600/50 px-3 py-2 text-amber-200 text-sm">
                <span className="font-medium">Doente</span>
                <span className="text-amber-300/90">— Saúde baixa ou stress &gt;75%: trabalho rende menos XP e moedas, mais stress.</span>
              </div>
            )}
            {status.is_burnout && (
              <div className="rounded-lg bg-rose-900/50 border border-rose-600/50 px-3 py-2 text-rose-200 text-sm space-y-1">
                <p className="font-medium">Burnout</p>
                <p className="text-rose-300/90 text-xs">Trabalho e estudos não dão XP nem moedas até o stress baixar. Faça atividades de lazer na sua vida pessoal ou relaxe em casa.</p>
              </div>
            )}
            {status.health > 0 && status.health <= 25 && (
              <div className="rounded-lg bg-slate-700/80 border border-amber-600/60 px-3 py-2 text-amber-100 text-sm space-y-1">
                <p className="font-medium">Prestes a morrer</p>
                <p className="text-amber-200/90 text-xs">Se continuar trabalhando ou registrando atividades que custam saúde, ela pode chegar a 0 e você volta ao nível inicial. Você decide.</p>
              </div>
            )}
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
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                  <span>Saúde</span>
                  <span>{status.health}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${status.health}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                  <span>Stress</span>
                  <span>{status.stress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, status.stress)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                  <span>XP para próximo nível</span>
                  <span>
                    {status.xp_for_next_level != null && status.xp_for_next_level > 0
                      ? `${status.xp_in_current_level ?? 0} / ${status.xp_for_next_level}`
                      : 'Nível máximo'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${((status.xp_progress ?? 0) * 100).toFixed(0)}%` }}
                  />
                </div>
              </div>
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
