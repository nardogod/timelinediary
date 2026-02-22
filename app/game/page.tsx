'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, Home, Coins, Heart, Zap, Wrench, ShoppingBag, Target, Check, Building2 } from 'lucide-react';
import GameProfileCard from '@/components/game/GameProfileCard';
import { LevelUpEffect, type LevelUpPayload } from '@/components/game/LevelUpEffect';
import type { GameProfile } from '@/lib/db/game-types';
import type { OwnedItems } from '@/lib/db/shop';

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
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopCatalog, setShopCatalog] = useState<{
    catalog: { cover: { id: string; name: string; price: number; imagePath: string }[]; avatar: { id: string; name: string; price: number; imagePath: string; unlockOnlyByMission?: boolean }[]; pet: { id: string; name: string; price: number; imagePath: string }[] };
    owned: OwnedItems;
  } | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [missions, setMissions] = useState<Array<{
    id: string;
    name: string;
    description: string;
    requirement: string;
    reward: { type: string; item_type?: string; item_id?: string; amount?: number };
    completed: boolean;
  }> | null>(null);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [roomsData, setRoomsData] = useState<{
    catalog: { house: { id: string; name: string; price: number; relax_extra: number; health_bonus?: number }[]; work: { id: string; name: string; price: number; work_coins_extra: number; work_health_extra: number }[] };
    owned: { house: string[]; work: string[] };
    current_house_id: string;
    current_work_room_id: string;
  } | null>(null);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [roomPurchasing, setRoomPurchasing] = useState<string | null>(null);
  const [levelUpTestPayload, setLevelUpTestPayload] = useState<LevelUpPayload | null>(null);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    try {
      const [statusRes, profileRes] = await Promise.all([
        fetch('/api/game/status', { cache: 'no-store' }),
        fetch('/api/game/profile'),
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
  }, [user]);

  const loadShopCatalog = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/game/shop/catalog');
      if (res.ok) {
        const data = await res.json();
        setShopCatalog(data);
      }
    } catch (e) {
      console.error('[GamePage] Erro ao carregar loja:', e);
    }
  }, [user]);

  const loadMissions = useCallback(async () => {
    if (!user) return;
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
  }, [user, loadShopCatalog]);

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
          href={user ? `/u/${user.username}` : '/'}
          className="p-2 -m-2 rounded-lg hover:bg-slate-800"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">Meu Mundo</h1>
      </header>

      <main className="flex-1 overflow-auto p-4 space-y-4">
        <GameProfileCard
          username={user?.username ?? ''}
          profile={profile}
          onCoverChange={handleCoverChange}
          onCoverPositionChange={handleCoverPositionChange}
          onAvatarChange={handleAvatarChange}
          onPetChange={handlePetChange}
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
                <span className="text-amber-300/90">— Saúde baixa: trabalho rende menos e gera mais stress.</span>
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

        <Link
          href="/game/trabalho"
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
          href="/game/casa"
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
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
              <p className="text-sm text-slate-400">Moedas: <strong className="text-amber-300">{status.coins}</strong></p>
              {(['cover', 'avatar', 'pet'] as const).map((type) => (
                <div key={type}>
                  <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
                    {type === 'cover' ? 'Capas' : type === 'avatar' ? 'Avatares' : 'Pets'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {shopCatalog.catalog[type].map((item) => {
                      const owned = shopCatalog.owned[type].includes(item.id);
                      const key = `${type}-${item.id}`;
                      return (
                        <div
                          key={key}
                          className="relative rounded-lg border border-slate-600 bg-slate-900/80 p-2 flex flex-col items-center min-w-[80px]"
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
                            <span className="text-xs text-emerald-400">Possui</span>
                          ) : type === 'avatar' && (item as { unlockOnlyByMission?: boolean }).unlockOnlyByMission ? (
                            <span className="text-xs mt-1 text-amber-200/90 text-center">Desbloqueie completando a missão</span>
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
                </div>
              ))}
            </div>
          )}
        </section>

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
              <p className="text-sm text-slate-400">Requisitos e desbloqueio de itens</p>
            </div>
          </button>
          {missionsOpen && missions && missions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
              {missions.map((m) => (
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
                      <h4 className="font-medium text-white">{m.name}</h4>
                      <p className="text-sm text-slate-400 mt-0.5">{m.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{m.requirement}</p>
                      <p className="text-xs text-amber-300/90 mt-1">
                        Recompensa:{' '}
                        {m.reward.type === 'unlock_item'
                          ? `Desbloqueia ${m.reward.item_type === 'cover' ? 'capa' : m.reward.item_type === 'avatar' ? 'avatar' : 'pet'}`
                          : `${m.reward.amount} moedas`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
