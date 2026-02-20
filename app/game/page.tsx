'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, Home, Coins, Heart, Zap, Wrench } from 'lucide-react';
import GameProfileCard from '@/components/game/GameProfileCard';
import type { GameProfile } from '@/lib/db/game-types';

type GameStatus = {
  health: number;
  stress: number;
  coins: number;
  level: number;
  experience: number;
};

export default function GamePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    try {
      const [statusRes, profileRes] = await Promise.all([
        fetch('/api/game/status'),
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
  }, [user, authLoading, router, loadStatus]);

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
        />
        {status && (
          <section className="rounded-xl bg-slate-800/80 p-4 space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Status</h2>
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
            <div className="space-y-1">
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
              <p className="text-sm text-slate-400">Em construção</p>
            </div>
          </div>
        </Link>

        {process.env.NODE_ENV === 'development' && (
          <Link
            href="/game/dev"
            className="block rounded-xl bg-amber-900/30 p-4 border border-amber-700/50 hover:border-amber-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-800/50 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-medium text-amber-200">Dev — Editor da sala e sprite sheet</h3>
                <p className="text-sm text-slate-400">Escolher móveis, posição, tamanho e cortar sprite sheets</p>
              </div>
            </div>
          </Link>
        )}
      </main>
    </div>
  );
}
