'use client';

import { useState, useMemo } from 'react';
import { getBadgesInOrder, hasUnlockedNextTier, type BadgeDef } from '@/lib/game/badges';
import { PROFILE_COVERS, getCoverById } from '@/lib/game/profile-covers';
import {
  AVATAR_DISPLAY_SIZE_PX,
  COVER_RECOMMENDED_LABEL,
} from '@/lib/game/profile-asset-resolutions';
import { PROFILE_AVATARS, DEFAULT_AVATAR_PATH } from '@/lib/game/profile-avatars';
import { PETS, getPetStressReductionPercent } from '@/lib/game/pet-assets';
import { getCoverBonus } from '@/lib/game/cover-bonuses';
import type { GameProfile } from '@/lib/db/game-types';
import Image from 'next/image';
import PetAnimation from '@/components/game/PetAnimation';

export const AVATAR_SIZE_PX = AVATAR_DISPLAY_SIZE_PX;
export { DEFAULT_AVATAR_PATH };

type GameProfileCardProps = {
  username: string;
  profile: GameProfile | null;
  onCoverChange?: (coverId: string) => void;
  onCoverPositionChange?: (positionY: number) => void;
  onAvatarChange?: (avatarPath: string) => void;
  onPetChange?: (petId: string) => void;
  /** Se definido, só exibe itens possuídos nos seletores (loja). */
  ownedCoverIds?: string[];
  ownedAvatarIds?: string[];
  ownedPetIds?: string[];
};

export default function GameProfileCard({
  username,
  profile,
  onCoverChange,
  onCoverPositionChange,
  onAvatarChange,
  onPetChange,
  ownedCoverIds,
  ownedAvatarIds,
  ownedPetIds,
}: GameProfileCardProps) {
  const badgesInOrder = useMemo(() => getBadgesInOrder(), []);
  const earnedSet = useMemo(
    () => new Set(profile?.earned_badge_ids ?? []),
    [profile?.earned_badge_ids]
  );
  const nextTierUnlocked = useMemo(
    () => hasUnlockedNextTier(profile?.earned_badge_ids ?? []),
    [profile?.earned_badge_ids]
  );
  const coverById = getCoverById(profile?.cover_id ?? null);
  const cover =
    coverById && (!ownedCoverIds || ownedCoverIds.includes(profile?.cover_id ?? ''))
      ? coverById
      : null;
  const avatarUrl = profile?.avatar_image_url ?? null;
  const avatarOption = PROFILE_AVATARS.find((a) => a.path === (avatarUrl || DEFAULT_AVATAR_PATH));
  const canShowAvatar = !ownedAvatarIds || (avatarOption && ownedAvatarIds.includes(avatarOption.id));
  const avatarDisplayUrl = canShowAvatar ? (avatarUrl || DEFAULT_AVATAR_PATH) : DEFAULT_AVATAR_PATH;
  const coverPositionY = Math.max(0, Math.min(100, profile?.cover_position_y ?? 50));

  const coversToShow = useMemo(
    () =>
      ownedCoverIds && ownedCoverIds.length > 0
        ? PROFILE_COVERS.filter((c) => ownedCoverIds.includes(c.id))
        : [PROFILE_COVERS[0]],
    [ownedCoverIds]
  );
  const avatarsToShow = useMemo(
    () =>
      ownedAvatarIds && ownedAvatarIds.length > 0
        ? PROFILE_AVATARS.filter((a) => ownedAvatarIds.includes(a.id))
        : PROFILE_AVATARS.filter((a) => a.id === 'personagem9'),
    [ownedAvatarIds]
  );
  const petsToShow = useMemo(
    () =>
      ownedPetIds === undefined
        ? PETS
        : ownedPetIds.length > 0
          ? PETS.filter((p) => ownedPetIds.includes(p.id))
          : [],
    [ownedPetIds]
  );

  const [badgeModal, setBadgeModal] = useState<BadgeDef | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [petPickerOpen, setPetPickerOpen] = useState(false);
  const [badgesExpanded, setBadgesExpanded] = useState(false);
  const selectedPetId =
    ownedPetIds === undefined
      ? (profile?.pet_id ?? null)
      : profile?.pet_id && ownedPetIds.includes(profile.pet_id)
        ? profile.pet_id
        : null;

  const activeBonuses = useMemo(() => {
    const list: { label: string; detail: string }[] = [];
    const coverBonus = getCoverBonus(profile?.cover_id ?? null);
    const hasCoverBonus =
      (coverBonus.xp_percent ?? 0) > 0 ||
      (coverBonus.coins_percent ?? 0) > 0 ||
      (coverBonus.stress_reduce_percent ?? 0) > 0 ||
      (coverBonus.health_extra ?? 0) > 0;
    if (coverById && coverById.id !== 'default' && hasCoverBonus) {
      const parts: string[] = [];
      if (coverBonus.xp_percent) parts.push(`+${coverBonus.xp_percent}% XP`);
      if (coverBonus.coins_percent) parts.push(`+${coverBonus.coins_percent}% €`);
      if (coverBonus.stress_reduce_percent) parts.push(`−${coverBonus.stress_reduce_percent}% stress`);
      if (coverBonus.health_extra) parts.push(`+${coverBonus.health_extra} saúde`);
      if (parts.length) list.push({ label: 'Capa', detail: parts.join(', ') });
    }
    if (selectedPetId) {
      const pet = PETS.find((p) => p.id === selectedPetId);
      const stressRed = getPetStressReductionPercent(selectedPetId);
      if (pet || stressRed > 0) {
        const parts: string[] = [];
        if (stressRed > 0) parts.push(`−${stressRed}% stress`);
        parts.push('+10% €');
        list.push({ label: pet?.name ?? 'Pet', detail: parts.join(', ') });
      }
    }
    return list;
  }, [profile?.cover_id, coverById, selectedPetId]);

  return (
    <section className="rounded-xl bg-slate-800/80 p-4 space-y-3 overflow-visible">
      {/* Capa + avatar e nome sobre a capa (esquerda, foto mais alta; nome à frente) */}
      <div className="relative -mx-4 -mt-4 mb-2 rounded-t-xl overflow-visible">
        {/* Capa de fundo (pixel art) — área clicável para trocar */}
        <div
          className="relative h-24 rounded-t-xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 cursor-pointer group"
          onClick={() => setCoverPickerOpen((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setCoverPickerOpen((v) => !v)}
          aria-label="Escolher capa de fundo"
        >
          {cover && cover.id !== 'default' && cover.imagePath ? (
            <Image
              src={cover.imagePath}
              alt=""
              fill
              className="object-cover"
              style={{ objectPosition: `center ${coverPositionY}%` }}
              sizes="(max-width: 640px) 100vw, 640px"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background: 'linear-gradient(135deg, #475569 0%, #334155 50%, #1e293b 100%)',
              }}
            />
          )}
          <div className="absolute bottom-1 right-2 flex items-center gap-1">
            {cover && cover.imagePath && onCoverPositionChange && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCoverPositionChange(Math.max(0, coverPositionY - 10));
                  }}
                  className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10"
                  aria-label="Mover capa para cima"
                  title="Mover capa para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCoverPositionChange(Math.min(100, coverPositionY + 10));
                  }}
                  className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10"
                  aria-label="Mover capa para baixo"
                  title="Mover capa para baixo"
                >
                  ↓
                </button>
              </>
            )}
            <span className="text-xs text-white/70 group-hover:text-white" title={`Capa: ${COVER_RECOMMENDED_LABEL}`}>
              Trocar capa
            </span>
          </div>
          {/* Avatar + nome sobre a capa; avatar clicável para trocar (sem fundo cinza) */}
          <div className="absolute left-3 bottom-3 flex items-center gap-3">
            <div
              className="game-profile-avatar flex-shrink-0 rounded-full overflow-hidden border-2 border-white/30 ring-2 ring-black/20 relative pointer-events-auto cursor-pointer hover:border-white/50 hover:ring-white/20 transition-colors bg-transparent"
              style={{ width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX }}
              onClick={(e) => {
                e.stopPropagation();
                if (onAvatarChange) setAvatarPickerOpen(true);
              }}
              role={onAvatarChange ? 'button' : undefined}
              aria-label={onAvatarChange ? 'Escolher foto de perfil' : undefined}
              title={onAvatarChange ? 'Trocar foto' : undefined}
            >
              <Image
                src={avatarDisplayUrl}
                alt=""
                width={AVATAR_SIZE_PX}
                height={AVATAR_SIZE_PX}
                className="w-full h-full object-cover"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div
                className="w-full h-full hidden flex items-center justify-center text-3xl text-white/80 absolute inset-0"
                aria-hidden
              >
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="min-w-0 pointer-events-none">
              <p className="font-semibold text-white truncate drop-shadow-md">@{username}</p>
              <p className="text-xs text-white/90 drop-shadow-md">Meu Mundo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Medalhas — acima da linha do pet (no lugar das resoluções recomendadas) */}
      <div className="flex-shrink-0">
        {!badgesExpanded ? (
          <button
            type="button"
            onClick={() => setBadgesExpanded(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/80 hover:bg-slate-700/80 px-3 py-2 text-left transition-colors"
            aria-expanded="false"
            aria-label="Ver medalhas"
          >
            <span className="text-xl">🏆</span>
            <span className="text-sm font-medium text-slate-300">Medalhas</span>
            <span className="text-slate-500 text-xs">
              {earnedSet.size}/{badgesInOrder.length}
            </span>
          </button>
        ) : (
          <div
            className="rounded-lg border border-slate-600 bg-slate-800/60 p-2"
            role="region"
            aria-label="Medalhas expandido"
          >
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-medium text-slate-300">Medalhas</h3>
              <button
                type="button"
                onClick={() => setBadgesExpanded(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
                aria-label="Fechar medalhas"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {badgesInOrder.map((badge) => {
                const isNextTier = badge.id === 'proximo_nivel';
                const earned =
                  earnedSet.has(badge.id) || (isNextTier && nextTierUnlocked);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setBadgeModal(badge)}
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-md border transition-colors
                      ${earned
                        ? 'bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30 text-base'
                        : 'bg-slate-800/80 border-slate-600 hover:bg-slate-700/80 text-base opacity-70'}
                    `}
                    title={`${badge.name} — ${earned ? badge.description : badge.requirement}`}
                  >
                    {earned ? badge.icon : '?'}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {coverPickerOpen && (
        <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-slate-900/80">
          {coversToShow.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">Nenhuma capa. Compre na Loja.</p>
          ) : (
          coversToShow.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onCoverChange?.(c.id);
                setCoverPickerOpen(false);
              }}
              className={`relative w-16 h-10 rounded border-2 overflow-hidden ${
                profile?.cover_id === c.id
                  ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              {c.id === 'default' || !c.imagePath ? (
                <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-slate-700" aria-hidden />
                  <Image
                    src={c.imagePath}
                    alt={c.name}
                    width={64}
                    height={40}
                    className="relative w-full h-full object-cover object-center bg-slate-700"
                    unoptimized
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const parent = img.parentElement;
                      if (parent) parent.classList.add('bg-slate-700');
                    }}
                  />
                </>
              )}
            </button>
          ))
          )}
        </div>
      )}

      {/* Seletor de foto de perfil (avatar) */}
      {avatarPickerOpen && onAvatarChange && (
        <div className="rounded-lg border border-slate-600 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-300">Escolher foto de perfil</p>
            <button
              type="button"
              onClick={() => setAvatarPickerOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          <div className="game-profile-avatar-picker grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto">
            {avatarsToShow.length === 0 ? (
              <p className="text-sm text-slate-500 col-span-full py-2">Nenhum avatar. Compre na Loja.</p>
            ) : (
            avatarsToShow.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => {
                  onAvatarChange(av.path);
                  setAvatarPickerOpen(false);
                }}
                className={`rounded-full overflow-hidden border-2 flex-shrink-0 w-12 h-12 transition-colors bg-transparent ${
                  avatarDisplayUrl === av.path
                    ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                title={av.name}
              >
                <Image
                  src={av.path}
                  alt=""
                  width={48}
                  height={48}
                  className="w-full h-full object-cover bg-transparent"
                  unoptimized
                />
              </button>
            ))
            )}
          </div>
        </div>
      )}

      {/* Seletor de pet (mesmo padrão visual do seletor de capa) */}
      {petPickerOpen && onPetChange && (
        <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-slate-900/80">
          {petsToShow.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">Nenhum pet. Compre na Loja.</p>
          ) : (
          petsToShow.map((pet) => (
            <button
              key={pet.id}
              type="button"
              onClick={() => {
                onPetChange(pet.id);
                setPetPickerOpen(false);
              }}
              className={`relative w-14 h-14 rounded-lg border-2 overflow-hidden flex items-center justify-center ${
                selectedPetId === pet.id
                  ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              title={pet.name}
            >
              <div
                className="w-full h-full bg-slate-800 bg-no-repeat"
                style={{
                  backgroundImage: `url(${pet.spritePath})`,
                  backgroundSize: '200% 200%',
                  backgroundPosition: '0% 0%',
                }}
                aria-hidden
              />
            </button>
          ))
          )}
        </div>
      )}

      {/* Linha: pet (área fixa) + Anti-stress itens */}
      <div className="flex gap-3 items-center">
        {/* Pet — área fixa para não quebrar a imagem (maior) */}
        <div
          className="flex-shrink-0 w-[120px] h-[120px] flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800/80 cursor-pointer group relative"
          onClick={() => onPetChange && setPetPickerOpen((v) => !v)}
          role={onPetChange ? 'button' : undefined}
          tabIndex={onPetChange ? 0 : undefined}
          onKeyDown={(e) => onPetChange && e.key === 'Enter' && setPetPickerOpen((v) => !v)}
          aria-label={onPetChange ? 'Escolher pet' : undefined}
        >
          {selectedPetId ? (
            <PetAnimation petId={selectedPetId} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">Pet</div>
          )}
          {onPetChange && (
            <span className="absolute bottom-1 right-2 text-xs text-white/70 group-hover:text-white" title="Trocar pet">
              Trocar pet
            </span>
          )}
        </div>
        {/* Anti-stress itens */}
        <div className="flex-shrink-0 flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-400 mb-0.5">Anti-stress itens</p>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map((slot) => (
              <button
                key={slot}
                type="button"
                className="w-10 h-10 rounded-lg border border-slate-600 bg-slate-800/80 hover:bg-slate-700/80 flex items-center justify-center text-slate-500 text-lg transition-colors"
                title="Slot de item anti-stress (comprar e equipar)"
                aria-label={`Slot de item anti-stress ${slot}`}
              >
                +
              </button>
            ))}
          </div>
        </div>
        {/* Bônus ativos (capa, pet) — discreto à direita */}
        {activeBonuses.length > 0 && (
          <div className="flex-shrink-0 min-w-0 max-w-[140px] flex flex-col gap-1.5">
            <p className="text-xs font-medium text-slate-400 mb-0.5">Bônus ativos</p>
            <div className="flex flex-col gap-1">
              {activeBonuses.map(({ label, detail }) => (
                <div
                  key={label}
                  className="rounded-md border border-slate-600/80 bg-slate-800/60 px-2 py-1.5"
                  title={detail}
                >
                  <p className="text-xs font-medium text-emerald-400/90 truncate">{label}</p>
                  <p className="text-[10px] text-slate-500 truncate leading-tight">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: ao clicar na medalha (ganha ou não) mostra nome + o que fazer para ganhar */}
      {badgeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setBadgeModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-modal-title"
        >
          <div
            className="rounded-xl bg-slate-800 border border-slate-600 p-4 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{badgeModal.icon}</span>
              <h2 id="badge-modal-title" className="font-semibold text-white">
                {badgeModal.name}
              </h2>
            </div>
            <p className="text-sm text-slate-300 mb-2">{badgeModal.description}</p>
            <div className="rounded-lg bg-slate-900/80 p-3">
              <p className="text-xs font-medium text-amber-400/90 mb-1">Como conquistar</p>
              <p className="text-sm text-slate-400">{badgeModal.requirement}</p>
            </div>
            <button
              type="button"
              onClick={() => setBadgeModal(null)}
              className="mt-4 w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
