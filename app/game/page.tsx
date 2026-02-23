'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Briefcase, Home, Coins, Heart, Zap, Wrench, ShoppingBag, Target, Check, Building2, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import GameProfileCard from '@/components/game/GameProfileCard';
import { LevelUpEffect, type LevelUpPayload } from '@/components/game/LevelUpEffect';
import type { GameProfile } from '@/lib/db/game-types';
import type { OwnedItems } from '@/lib/db/shop';
import { STORY_ARCS, getArcByAvatarIndex, getArcStory } from '@/lib/game/storyline-arcs';
import { getAvatarByPath } from '@/lib/game/profile-avatars';

type GameStatus = {
  health: number;
  stress: number;
  coins: number;
  level: number;
  experience: number;
  xp_for_next_level?: number;
  xp_in_current_level?: number;
  xp_progress?: number;
  is_sick?: boolean;
  is_burnout?: boolean;
};

export default function GamePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewerUserId = searchParams.get('userId');
  const fromUsername = searchParams.get('from');
  const isViewer = !!viewerUserId && viewerUserId !== (user?.id ?? null);
  const gameQuery = [viewerUserId && `userId=${encodeURIComponent(viewerUserId)}`, fromUsername && `from=${encodeURIComponent(fromUsername)}`].filter(Boolean).join('&');
  const gamePath = (path: string) => (gameQuery ? `${path}?${gameQuery}` : path);
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopCatalog, setShopCatalog] = useState<{
    catalog: {
      cover: { id: string; name: string; price: number; imagePath: string }[];
      avatar: { id: string; name: string; price: number; imagePath: string; unlockOnlyByMission?: boolean; unlockMissionName?: string; unlockMissionRequirement?: string; previousAvatarName?: string | null }[];
      pet: { id: string; name: string; price: number; imagePath: string }[];
      guardian_item: { id: string; name: string; price: number; imagePath: string; unlockMissionId?: string; unlocked?: boolean; bonus?: { stress_reduce_percent?: number; xp_percent?: number; coins_percent?: number } }[];
    };
    owned: OwnedItems;
  } | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  /** Quais seções da loja estão expandidas (menu minimizável). */
  const [shopSectionsOpen, setShopSectionsOpen] = useState<Record<string, boolean>>({ cover: true, avatar: false, pet: false, guardian_item: false });
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const toggleShopSection = (key: string) => {
    setShopSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const [missions, setMissions] = useState<Array<{
    id: string;
    name: string;
    description: string;
    requirement: string;
    reward: { type: string; item_type?: string; item_id?: string; amount?: number; avatarUnlockId?: string; badgeId?: string };
    completed: boolean;
    difficulty?: 'easy' | 'medium' | 'hard';
    arcId?: string;
    arcName?: string;
    arcStory?: string;
  }> | null>(null);
  const [missionsOpen, setMissionsOpen] = useState(false);
  /** Avatar cujas missões estão sendo exibidas (derivado do perfil ao abrir; ao escolher avatar na loja, atualiza). */
  const [missionFilterAvatarId, setMissionFilterAvatarId] = useState<string | null>(null);
  const [roomsData, setRoomsData] = useState<{
    catalog: { house: { id: string; name: string; price: number; relax_extra: number; health_bonus?: number }[]; work: { id: string; name: string; price: number; work_coins_extra: number; work_health_extra: number }[] };
    owned: { house: string[]; work: string[] };
    current_house_id: string;
    current_work_room_id: string;
  } | null>(null);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [roomPurchasing, setRoomPurchasing] = useState<string | null>(null);
  const [levelUpTestPayload, setLevelUpTestPayload] = useState<LevelUpPayload | null>(null);
  /** Mensagem de ganhos desde a última abertura (só para o dono do mundo). */
  const [lastOpenGains, setLastOpenGains] = useState<string | null>(null);
  /** História/Lore: minimizada e se mostra todas as trilhas. */
  const [storyMinimized, setStoryMinimized] = useState(false);
  const [storyShowAll, setStoryShowAll] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    try {
      const qs = viewerUserId ? `?userId=${encodeURIComponent(viewerUserId)}` : '';
      const [statusRes, profileRes] = await Promise.all([
        fetch(`/api/game/status${qs}`, { cache: 'no-store' }),
        fetch(`/api/game/profile${qs}`),
      ]);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      }
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }
    } catch (e) {
      console.error('[GamePage] Erro ao carregar status/perfil:', e);
    } finally {
      setLoading(false);
    }
  }, [user, viewerUserId]);

  const loadShopCatalog = useCallback(async () => {
    if (!user || isViewer) return;
    try {
      const res = await fetch('/api/game/shop/catalog');
      if (res.ok) {
        const data = await res.json();
        setShopCatalog(data);
      }
    } catch (e) {
      console.error('[GamePage] Erro ao carregar loja:', e);
    }
  }, [user, isViewer]);

  const loadMissions = useCallback(async () => {
    if (!user || isViewer) return;
    try {
      const res = await fetch('/api/game/missions');
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions ?? []);
        await loadShopCatalog();
      }
    } catch (e) {
      console.error('[GamePage] Erro ao carregar missões:', e);
    }
  }, [user, isViewer, loadShopCatalog]);

  const loadRooms = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/game/rooms');
      if (res.ok) setRoomsData(await res.json());
    } catch (e) {
      console.error('[GamePage] Erro ao carregar casas/salas:', e);
    }
  }, [user]);

  const handleCoverChange = useCallback(async (coverId: string) => {
    setProfile((prev) => (prev ? { ...prev, cover_id: coverId } : null));
    try {
      const res = await fetch('/api/game/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_id: coverId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      } else {
        const again = await fetch('/api/game/profile');
        if (again.ok) setProfile(await again.json());
      }
    } catch (e) {
      console.error('[GamePage] Erro ao atualizar capa:', e);
      const again = await fetch('/api/game/profile');
      if (again.ok) setProfile(await again.json());
    }
  }, []);

  const handleCoverPositionChange = useCallback(async (positionY: number) => {
    setProfile((prev) => (prev ? { ...prev, cover_position_y: positionY } : null));
    try {
      const res = await fetch('/api/game/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_position_y: positionY }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      }
    } catch (e) {
      console.error('[GamePage] Erro ao atualizar posição da capa:', e);
    }
  }, []);

  const handleAvatarChange = useCallback(async (avatarPath: string) => {
    const match = avatarPath.match(/personagem(\d+)\.png$/);
    const avatarId = match ? `personagem${match[1]}` : null;
    if (avatarId) setMissionFilterAvatarId(avatarId);
    setProfile((prev) => (prev ? { ...prev, avatar_image_url: avatarPath } : null));
    try {
      const res = await fetch('/api/game/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_image_url: avatarPath }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      } else {
        const again = await fetch('/api/game/profile');
        if (again.ok) setProfile(await again.json());
      }
    } catch (e) {
      console.error('[GamePage] Erro ao atualizar avatar:', e);
      const again = await fetch('/api/game/profile');
      if (again.ok) setProfile(await again.json());
    }
  }, []);

  const handlePetChange = useCallback(async (petId: string) => {
    setProfile((prev) => (prev ? { ...prev, pet_id: petId } : null));
    try {
      const res = await fetch('/api/game/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet_id: petId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      } else {
        const again = await fetch('/api/game/profile');
        if (again.ok) setProfile(await again.json());
      }
    } catch (e) {
      console.error('[GamePage] Erro ao atualizar pet:', e);
      const again = await fetch('/api/game/profile');
      if (again.ok) setProfile(await again.json());
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadStatus();
    loadShopCatalog();
    loadMissions();
    loadRooms();
  }, [user, authLoading, router, loadStatus, loadShopCatalog, loadMissions, loadRooms]);

  // Revalidar status ao voltar para a aba/página (ex.: depois de Casa ou Trabalho) para manter Doente/Burnout em dia
  useEffect(() => {
    if (!user || isViewer) return;
    const onFocus = () => loadStatus();
    window.addEventListener('focus', onFocus);
    const onVisibility = () => { if (document.visibilityState === 'visible') loadStatus(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user, isViewer, loadStatus]);

  // Ganhos desde a última abertura (só no próprio mundo): lê snapshot ao carregar e mostra diferença
  useEffect(() => {
    if (!user || isViewer || !status) return;
    const key = `timeline_game_snapshot_${user.id}`;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      const prev = raw ? (JSON.parse(raw) as { coins?: number; experience?: number; health?: number; stress?: number; level?: number; at?: string }) : null;
      if (prev && prev.at && prev.coins !== undefined) {
        const coinsDiff = status.coins - prev.coins;
        const xpDiff = (status.experience ?? 0) - (prev.experience ?? 0);
        const healthDiff = status.health - (prev.health ?? 100);
        const stressDiff = status.stress - (prev.stress ?? 0);
        const levelDiff = (status.level ?? 1) - (prev.level ?? 1);
        const parts: string[] = [];
        if (coinsDiff !== 0) parts.push(coinsDiff > 0 ? `+${coinsDiff} moedas` : `${coinsDiff} moedas`);
        if (xpDiff !== 0) parts.push(xpDiff > 0 ? `+${xpDiff} XP` : `${xpDiff} XP`);
        if (levelDiff > 0) parts.push(`+${levelDiff} nível`);
        if (healthDiff !== 0) parts.push(healthDiff > 0 ? `+${healthDiff}% saúde` : `${healthDiff}% saúde`);
        if (stressDiff !== 0) parts.push(stressDiff < 0 ? `${stressDiff}% stress` : `+${stressDiff}% stress`);
        if (parts.length > 0) {
          setLastOpenGains(`Desde a última vez: ${parts.join(', ')}`);
        }
      }
    } catch {
      // ignore
    }
  }, [user, isViewer, status]);

  // Ao sair da página, salva snapshot para “desde a última abertura” na próxima vez
  useEffect(() => {
    if (!user || isViewer || !status) return;
    const key = `timeline_game_snapshot_${user.id}`;
    const snapshot = {
      coins: status.coins,
      experience: status.experience ?? 0,
      health: status.health,
      stress: status.stress,
      level: status.level ?? 1,
      at: new Date().toISOString(),
    };
    return () => {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(snapshot));
      } catch {
        // ignore
      }
    };
  }, [user, isViewer, status]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <span className="text-white">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white safe-area-inset">
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-700">
        <Link
          href={fromUsername ? `/u/${fromUsername}` : user ? `/u/${user.username}` : '/'}
          className="p-2 -m-2 rounded-lg hover:bg-slate-800"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">{isViewer && fromUsername ? `Mundo de ${fromUsername}` : 'Meu Mundo'}</h1>
      </header>

      <main className="flex-1 overflow-auto p-4 space-y-4">
        {/* Alertas críticos no topo para sempre ficarem visíveis (Doente, Burnout, Prestes a morrer) */}
        {status && (status.is_sick || status.is_burnout || (status.health > 0 && status.health <= 25)) && (
          <div className="space-y-2">
            {status.is_burnout && (
              <div className="rounded-xl bg-rose-900/70 border-2 border-rose-500 px-4 py-3 text-rose-100 text-sm shadow-lg">
                <p className="font-semibold">⚠️ Burnout</p>
                <p className="text-rose-200/95 text-xs mt-0.5">Trabalho e estudos não dão XP nem moedas até o stress baixar. Faça atividades de lazer ou relaxe em casa.</p>
              </div>
            )}
            {status.is_sick && (
              <div className="rounded-xl bg-amber-900/70 border-2 border-amber-500 px-4 py-3 text-amber-100 text-sm shadow-lg">
                <p className="font-semibold">🤒 Doente</p>
                <p className="text-amber-200/95 text-xs mt-0.5">Saúde baixa ou stress acima de 75%: trabalho rende menos e gera mais stress. Relaxe em casa para recuperar.</p>
              </div>
            )}
            {status.health > 0 && status.health <= 25 && (
              <div className="rounded-xl bg-amber-800/70 border-2 border-amber-600 px-4 py-3 text-amber-100 text-sm shadow-lg">
                <p className="font-semibold">💀 Prestes a morrer</p>
                <p className="text-amber-200/95 text-xs mt-0.5">Se a saúde chegar a 0%, você volta ao nível inicial. Evite atividades que custam saúde ou relaxe em casa.</p>
              </div>
            )}
          </div>
        )}
        {lastOpenGains && (
          <div className="rounded-xl bg-emerald-900/60 border border-emerald-600/50 px-4 py-3 flex items-center justify-between gap-3 text-sm text-emerald-100">
            <span className="flex-1">✨ {lastOpenGains}</span>
            <button
              type="button"
              onClick={() => setLastOpenGains(null)}
              className="p-1 rounded hover:bg-emerald-700/50 text-emerald-200"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        )}
        <GameProfileCard
          username={fromUsername ?? user?.username ?? ''}
          profile={profile}
          onCoverChange={isViewer ? undefined : handleCoverChange}
          onCoverPositionChange={isViewer ? undefined : handleCoverPositionChange}
          onAvatarChange={isViewer ? undefined : handleAvatarChange}
          onPetChange={isViewer ? undefined : handlePetChange}
          ownedCoverIds={shopCatalog?.owned.cover}
          ownedAvatarIds={shopCatalog?.owned.avatar}
          ownedPetIds={shopCatalog?.owned.pet}
        />
        {status && (
          <section className="rounded-xl bg-slate-800/80 p-4 space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Status</h2>
            {status.is_sick && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-900/50 border border-amber-600/50 px-3 py-2 text-amber-200 text-sm">
                <span className="font-medium">Doente</span>
                <span className="text-amber-300/90">— Saúde baixa ou stress &gt;75%: trabalho rende menos e gera mais stress.</span>
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
                <span>Stress: {status.stress}%{status.stress >= 100 ? ' (Burnout)' : ''}</span>
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
                    className={`h-full rounded-full transition-all ${status.stress >= 100 ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, status.stress)}%` }}
                  />
                </div>
                {status.stress > 100 && (
                  <p className="text-xs text-rose-400 mt-0.5">Stress acima de 100% (Burnout) — relaxe ou faça lazer para baixar.</p>
                )}
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

        {!isViewer && (
          <section className="rounded-xl bg-slate-800/80 border border-slate-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setStoryMinimized((m) => !m)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-700/50 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-200">História</span>
              {storyMinimized ? <ChevronRight className="w-4 h-4 ml-auto text-slate-500" /> : <ChevronDown className="w-4 h-4 ml-auto text-slate-500" />}
            </button>
            {!storyMinimized && (
              <div className="px-4 pb-4 pt-0 space-y-4 text-sm text-slate-300 border-t border-slate-700">
                <p className="italic text-slate-400">Prelúdio — Luna, a Última Iniciada, te guia nos primeiros passos. Complete Primeira Luz, Caminho Iluminado e Porta Aberta para provar que está pronto e desbloquear a Trilha do Guerreiro.</p>
                {profile?.avatar_image_url && (() => {
                  const avatar = getAvatarByPath(profile.avatar_image_url);
                  const idx = parseInt(avatar?.id?.replace('personagem', '') ?? '9', 10);
                  const arc = getArcByAvatarIndex(idx);
                  const story = getArcStory(idx);
                  if (!arc || !story) return null;
                  return (
                    <div>
                      <p className="font-medium text-slate-200">Sua trilha atual ({arc.name})</p>
                      <p className="text-slate-400">{story}</p>
                    </div>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setStoryShowAll((a) => !a)}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  {storyShowAll ? 'Ocultar trilhas' : 'Ver todas as trilhas'}
                </button>
                {storyShowAll && (
                  <div className="space-y-2 pt-2 border-t border-slate-700">
                    {STORY_ARCS.map((arc) => (
                      <div key={arc.id}>
                        <p className="font-medium text-slate-200">{arc.name}</p>
                        <p className="text-slate-400 text-xs">{arc.story}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <Link
          href={gamePath('/game/trabalho')}
          className="block rounded-xl bg-slate-800/80 p-4 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h3 className="font-medium">Sala de Trabalho</h3>
              <p className="text-sm text-slate-400">Ver personagem e progresso</p>
            </div>
          </div>
        </Link>

        <Link
          href={gamePath('/game/casa')}
          className="block rounded-xl bg-slate-800/80 p-4 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
              <Home className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h3 className="font-medium">Minha Casa</h3>
              <p className="text-sm text-slate-400">Relaxar e reduzir stress</p>
            </div>
          </div>
        </Link>

        {!isViewer && (
        <section className="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <button
            type="button"
            onClick={() => setShopOpen((v) => !v)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h3 className="font-medium">Loja</h3>
              <p className="text-sm text-slate-400">Capas, avatares e pets com moedas</p>
            </div>
          </button>
          {shopOpen && shopCatalog && status !== null && (
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
              <p className="text-sm text-slate-400 mb-3">Moedas: <strong className="text-amber-300">{status.coins}</strong></p>
              {(['cover', 'avatar', 'pet'] as const).map((type) => {
                const label = type === 'cover' ? 'Capas' : type === 'avatar' ? 'Avatares' : 'Pets';
                const isOpen = shopSectionsOpen[type];
                return (
                <div key={type} className="rounded-lg border border-slate-600 bg-slate-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleShopSection(type)}
                    className="w-full flex items-center gap-2 py-2 px-3 text-left hover:bg-slate-800/50 transition-colors"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="text-xs font-medium text-slate-300 uppercase">{label}</span>
                  </button>
                  {isOpen && (
                  <div className="px-3 pb-3 pt-0 flex flex-wrap gap-2">
                    {shopCatalog.catalog[type].map((item) => {
                      const owned = shopCatalog.owned[type].includes(item.id);
                      const key = `${type}-${item.id}`;
                      return (
                        <div
                          key={key}
                          className={`relative rounded-lg border border-slate-600 bg-slate-900/80 p-2 flex flex-col items-center min-w-[80px] ${type === 'avatar' && owned ? 'cursor-pointer hover:border-amber-500/50' : ''}`}
                          role={type === 'avatar' && owned ? 'button' : undefined}
                          onClick={type === 'avatar' && owned ? () => setMissionFilterAvatarId(item.id) : undefined}
                        >
                          {item.imagePath ? (
                            type === 'avatar' ? (
                              <div
                                className="w-12 h-12 rounded-full bg-slate-800 bg-cover bg-center"
                                style={{ backgroundImage: `url(${item.imagePath})` }}
                              />
                            ) : type === 'pet' ? (
                              <div
                                className="w-12 h-12 rounded-lg bg-slate-800 bg-cover bg-center"
                                style={{ backgroundImage: `url(${item.imagePath})`, backgroundSize: '200% 200%' }}
                              />
                            ) : (
                              <div
                                className="w-16 h-10 rounded bg-slate-800 bg-cover bg-center"
                                style={{ backgroundImage: `url(${item.imagePath})` }}
                              />
                            )
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-700" />
                          )}
                          <span className="text-xs text-slate-300 mt-1 truncate w-full text-center">{item.name}</span>
                          {owned ? (
                            <span className="text-xs text-emerald-400">
                              {type === 'avatar' ? 'Possui · Clique para ver missões' : 'Possui'}
                            </span>
                          ) : type === 'avatar' && (item as { unlockOnlyByMission?: boolean }).unlockOnlyByMission ? (
                            <span className="text-xs mt-1 text-amber-200/90 text-center block">
                              {(item as { previousAvatarName?: string | null }).previousAvatarName && (
                                <>Complete o arco de <strong>{(item as { previousAvatarName: string }).previousAvatarName}</strong> (3 missões). </>
                              )}
                              Depois: missão <strong>{(item as { unlockMissionName?: string }).unlockMissionName ?? item.name}</strong>
                              {(item as { unlockMissionRequirement?: string }).unlockMissionRequirement && (
                                <> — {(item as { unlockMissionRequirement: string }).unlockMissionRequirement}</>
                              )}
                              . +2 missões (moedas e título).
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={status.coins < item.price || purchasing === key}
                              onClick={async () => {
                                setPurchasing(key);
                                try {
                                  const res = await fetch('/api/game/shop/purchase', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ item_type: type, item_id: item.id }),
                                  });
                                  const data = await res.json().catch(() => ({}));
                                  if (res.ok && data?.ok) {
                                    await loadShopCatalog();
                                    await loadStatus();
                                  }
                                } finally {
                                  setPurchasing(null);
                                }
                              }}
                              className="text-xs mt-1 py-1 px-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:pointer-events-none"
                            >
                              {item.price} moedas
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              );
              })}
              {shopCatalog.catalog.guardian_item && shopCatalog.catalog.guardian_item.length > 0 && (
                <div className="rounded-lg border border-slate-600 bg-slate-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleShopSection('guardian_item')}
                    className="w-full flex items-center gap-2 py-2 px-3 text-left hover:bg-slate-800/50 transition-colors"
                  >
                    {shopSectionsOpen.guardian_item ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="text-xs font-medium text-slate-300 uppercase">Itens anti-stress (Guardiões)</span>
                  </button>
                  {shopSectionsOpen.guardian_item && (
                  <>
                  <p className="text-xs text-slate-400 px-3 pb-1">Desbloqueie completando as 3 missões do Guardião; depois compre e equipe.</p>
                  <div className="px-3 pb-3 flex flex-wrap gap-2">
                    {shopCatalog.catalog.guardian_item.map((item) => {
                      const owned = shopCatalog.owned.guardian_item.includes(item.id);
                      const equipped = profile?.antistress_item_id === item.id;
                      const key = `guardian_item-${item.id}`;
                      const bonusText = [
                        item.bonus?.stress_reduce_percent && `-${item.bonus.stress_reduce_percent}% stress`,
                        item.bonus?.xp_percent && `+${item.bonus.xp_percent}% XP`,
                        item.bonus?.coins_percent && `+${item.bonus.coins_percent}% moedas`,
                      ].filter(Boolean).join(', ');
                      return (
                        <div
                          key={key}
                          className={`relative rounded-lg border p-2 flex flex-col items-center min-w-[80px] ${
                            equipped ? 'border-amber-500/80 bg-amber-900/20' : 'border-slate-600 bg-slate-900/80'
                          } ${owned ? 'cursor-pointer hover:border-amber-500/50' : ''}`}
                          role={owned ? 'button' : undefined}
                          onClick={owned ? async () => {
                            const next = equipped ? null : item.id;
                            const res = await fetch('/api/game/profile', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ antistress_item_id: next }),
                            });
                            if (res.ok) await loadStatus();
                          } : undefined}
                        >
                          {item.imagePath ? (
                            <div className="w-12 h-12 rounded-lg bg-slate-800 bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url(${item.imagePath})` }}>
                              {item.imagePath.endsWith('placeholder-item.svg') && <Zap className="w-6 h-6 text-slate-500" />}
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center"><Zap className="w-6 h-6 text-slate-500" /></div>
                          )}
                          <span className="text-xs text-slate-300 mt-1 truncate w-full text-center">{item.name}</span>
                          {bonusText && <span className="text-[10px] text-emerald-400/90 mt-0.5 text-center">{bonusText}</span>}
                          {!item.unlocked ? (
                            <span className="text-xs mt-1 text-amber-200/80 text-center block">Complete as 3 missões do Guardião</span>
                          ) : owned ? (
                            <span className="text-xs mt-1 text-emerald-400">{equipped ? 'Equipado' : 'Clique para equipar'}</span>
                          ) : (
                            <button
                              type="button"
                              disabled={status.coins < item.price || purchasing === key}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setPurchasing(key);
                                try {
                                  const res = await fetch('/api/game/shop/purchase', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ item_type: 'guardian_item', item_id: item.id }),
                                  });
                                  const data = await res.json().catch(() => ({}));
                                  if (res.ok && data?.ok) {
                                    await loadShopCatalog();
                                    await loadStatus();
                                  } else if (data?.error) {
                                    alert(data.error);
                                  }
                                } finally {
                                  setPurchasing(null);
                                }
                              }}
                              className="text-xs mt-1 py-1 px-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:pointer-events-none"
                            >
                              {item.price} moedas
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
        )}

        {!isViewer && (
        <section className="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <button
            type="button"
            onClick={() => setMissionsOpen((v) => !v)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
              <Target className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h3 className="font-medium">Missões</h3>
              <p className="text-sm text-slate-400">Requisitos e desbloqueio por avatar</p>
            </div>
          </button>
          {missionsOpen && missions && missions.length > 0 && (() => {
            const fromPath = profile?.avatar_image_url?.match(/personagem(\d+)\.png$/);
            const currentAvatarId = missionFilterAvatarId ?? (fromPath ? `personagem${fromPath[1]}` : null) ?? 'personagem9';
            const n = currentAvatarId.replace(/^personagem/, '') || '9';
            const avatarMissionIds = [`avatar_${n}_1`, `avatar_${n}_2`, `avatar_${n}_3`];
            const avatarMissions = missions.filter((m) => avatarMissionIds.includes(m.id));
            const avatarName = shopCatalog?.catalog.avatar.find((a) => a.id === currentAvatarId)?.name ?? `Personagem ${n}`;
            return (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                <p className="text-sm text-slate-400">
                  Missões de <strong className="text-white">{avatarName}</strong> — escolha outro avatar na loja para ver as missões dele.
                </p>
                {avatarMissions.length > 0 && avatarMissions[0]?.arcName && (
                  <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-2.5">
                    <p className="text-xs font-medium text-amber-200/90">{avatarMissions[0].arcName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{avatarMissions[0].arcStory}</p>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  <strong>Grande recompensa:</strong> complete as 3 missões deste personagem para desbloquear o próximo avatar e ganhar o título &quot;Conquista&quot; no mural.
                </p>
                {avatarMissions.length > 0 ? (
                  avatarMissions.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg border p-3 ${
                        m.completed ? 'border-emerald-600/50 bg-emerald-900/20' : 'border-slate-600 bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5">
                          {m.completed ? (
                            <Check className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <span className="w-5 h-5 rounded-full border-2 border-slate-500" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-white">{m.name}</h4>
                            {m.difficulty && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                m.difficulty === 'easy' ? 'bg-emerald-900/50 text-emerald-300' :
                                m.difficulty === 'medium' ? 'bg-amber-900/50 text-amber-300' : 'bg-rose-900/50 text-rose-300'
                              }`}>
                                {m.difficulty === 'easy' ? 'Fácil' : m.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mt-0.5">{m.description}</p>
                          <p className="text-xs text-slate-500 mt-1">{m.requirement}</p>
                          <p className="text-xs text-amber-300/90 mt-1">
                            Recompensa:{' '}
                            {typeof (m.reward as { amount?: number }).amount === 'number' && `${(m.reward as { amount: number }).amount} moedas`}
                            {(m.reward as { avatarUnlockId?: string }).avatarUnlockId && ' · Desbloqueia avatar'}
                            {(m.reward as { badgeId?: string }).badgeId && ' · Título de conquista'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma missão de avatar para este personagem.</p>
                )}
              </div>
            );
          })()}
        </section>
        )}

        {!isViewer && (
        <section className="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <button
            type="button"
            onClick={() => setRoomsOpen((v) => !v)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h3 className="font-medium">Casas e salas</h3>
              <p className="text-sm text-slate-400">Compre e ative; bônus diferentes</p>
            </div>
          </button>
          {roomsOpen && roomsData && status !== null && (
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
              <p className="text-sm text-slate-400">Moedas: <strong className="text-amber-300">{status.coins}</strong></p>
              <div>
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Casas (relaxar)</h4>
                {(() => {
                  const curHouse = roomsData.catalog.house.find((h) => h.id === roomsData.current_house_id);
                  const ownedHouses = roomsData.owned.house
                    .map((id) => roomsData.catalog.house.find((h) => h.id === id))
                    .filter(Boolean) as typeof roomsData.catalog.house;
                  const baseStress = 15;
                  const curIndex = ownedHouses.findIndex((h) => h.id === roomsData.current_house_id);
                  const nextHouse = ownedHouses[(curIndex + 1) % Math.max(1, ownedHouses.length)];
                  return (
                    <div className="space-y-2">
                      {curHouse && (
                        <div className="rounded-lg border border-amber-600/50 bg-slate-900/80 p-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">{curHouse.name} (ativa)</p>
                            <p className="text-xs text-slate-400">
                              Reduz {baseStress + (curHouse.relax_extra ?? 0)} de stress, +{(curHouse as { health_bonus?: number }).health_bonus ?? 0} saúde ao relaxar
                            </p>
                          </div>
                          {ownedHouses.length > 1 && nextHouse && (
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await fetch('/api/game/rooms', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ current_house_id: nextHouse.id }),
                                });
                                if (res.ok) loadRooms();
                              }}
                              className="text-xs py-1.5 px-2.5 rounded bg-amber-600 hover:bg-amber-500 shrink-0"
                            >
                              Próxima
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {roomsData.catalog.house.map((h) => {
                          const owned = roomsData.owned.house.includes(h.id);
                          const isCurrent = roomsData.current_house_id === h.id;
                          const key = `house-${h.id}`;
                          const healthBonus = (h as { health_bonus?: number }).health_bonus ?? 0;
                          return (
                            <div key={key} className="rounded-lg border border-slate-600 bg-slate-900/80 p-2 min-w-[120px]">
                              <p className="text-sm font-medium text-white">{h.name}</p>
                              <p className="text-xs text-slate-500">Reduz {15 + h.relax_extra} stress, +{healthBonus} saúde</p>
                              {owned ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-emerald-400">Possui</span>
                                  {!isCurrent && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const res = await fetch('/api/game/rooms', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ current_house_id: h.id }),
                                        });
                                        if (res.ok) loadRooms();
                                      }}
                                      className="text-xs py-1 px-2 rounded bg-slate-600 hover:bg-slate-500"
                                    >
                                      Usar
                                    </button>
                                  )}
                                  {isCurrent && <span className="text-xs text-amber-300">Ativa</span>}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={status.coins < h.price || roomPurchasing === key}
                                  onClick={async () => {
                                    setRoomPurchasing(key);
                                    try {
                                      const res = await fetch('/api/game/rooms/purchase', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ room_type: 'house', room_id: h.id }),
                                      });
                                      if (res.ok) { await loadRooms(); await loadStatus(); }
                                    } finally {
                                      setRoomPurchasing(null);
                                    }
                                  }}
                                  className="text-xs mt-2 py-1 px-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                                >
                                  {h.price} moedas
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div>
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Salas de trabalho</h4>
                {(() => {
                  const curRoom = roomsData.catalog.work.find((r) => r.id === roomsData.current_work_room_id);
                  const ownedWork = roomsData.owned.work
                    .map((id) => roomsData.catalog.work.find((r) => r.id === id))
                    .filter(Boolean) as typeof roomsData.catalog.work;
                  const curIndex = ownedWork.findIndex((r) => r.id === roomsData.current_work_room_id);
                  const nextRoom = ownedWork[(curIndex + 1) % Math.max(1, ownedWork.length)];
                  const baseCoins = 80;
                  const baseHealthCost = 10;
                  return (
                    <div className="space-y-2">
                      {curRoom && (
                        <div className="rounded-lg border border-amber-600/50 bg-slate-900/80 p-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">{curRoom.name} (ativa)</p>
                            <p className="text-xs text-slate-400">
                              +{baseCoins + curRoom.work_coins_extra} moedas ao ativar Trabalhar
                              {baseHealthCost + curRoom.work_health_extra !== 0 && `, custo saúde ${baseHealthCost + curRoom.work_health_extra}`}
                            </p>
                          </div>
                          {ownedWork.length > 1 && nextRoom && (
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await fetch('/api/game/rooms', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ current_work_room_id: nextRoom.id }),
                                });
                                if (res.ok) loadRooms();
                              }}
                              className="text-xs py-1.5 px-2.5 rounded bg-amber-600 hover:bg-amber-500 shrink-0"
                            >
                              Próxima
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {roomsData.catalog.work.map((r) => {
                          const owned = roomsData.owned.work.includes(r.id);
                          const isCurrent = roomsData.current_work_room_id === r.id;
                          const key = `work-${r.id}`;
                          return (
                            <div key={key} className="rounded-lg border border-slate-600 bg-slate-900/80 p-2 min-w-[120px]">
                              <p className="text-sm font-medium text-white">{r.name}</p>
                              <p className="text-xs text-slate-500">+{baseCoins + r.work_coins_extra} moedas, custo saúde {baseHealthCost + r.work_health_extra}</p>
                              {owned ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-emerald-400">Possui</span>
                                  {!isCurrent && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const res = await fetch('/api/game/rooms', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ current_work_room_id: r.id }),
                                        });
                                        if (res.ok) loadRooms();
                                      }}
                                      className="text-xs py-1 px-2 rounded bg-slate-600 hover:bg-slate-500"
                                    >
                                      Usar
                                    </button>
                                  )}
                                  {isCurrent && <span className="text-xs text-amber-300">Ativa</span>}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={status.coins < r.price || roomPurchasing === key}
                                  onClick={async () => {
                                    setRoomPurchasing(key);
                                    try {
                                      const res = await fetch('/api/game/rooms/purchase', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ room_type: 'work', room_id: r.id }),
                                      });
                                      if (res.ok) { await loadRooms(); await loadStatus(); }
                                    } finally {
                                      setRoomPurchasing(null);
                                    }
                                  }}
                                  className="text-xs mt-2 py-1 px-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                                >
                                  {r.price} moedas
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </section>
        )}

        {process.env.NODE_ENV === 'development' && (
          <section className="rounded-xl bg-amber-900/30 p-4 border border-amber-700/50 space-y-3">
            <h3 className="font-medium text-amber-200">Dev / Testes</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLevelUpTestPayload({
                  levelUp: true,
                  newLevel: (status?.level ?? 1) + 1,
                  previousLevel: status?.level ?? 1,
                  xpEarned: 35,
                })}
                className="px-3 py-2 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-amber-100 text-sm font-medium"
              >
                Ver efeito Level Up
              </button>
              <Link
                href="/game/dev"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 p-3 border border-slate-600 hover:border-slate-500 transition-colors text-sm text-slate-300"
              >
                <Wrench className="w-4 h-4" />
                Editor da sala e sprite sheet
              </Link>
            </div>
          </section>
        )}

        <LevelUpEffect
          payload={levelUpTestPayload}
          onClose={() => setLevelUpTestPayload(null)}
        />
      </main>
    </div>
  );
}
