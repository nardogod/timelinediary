/**
 * Catálogo da loja (capas, avatares, pets, itens anti-stress dos Guardiões).
 */

import { PROFILE_COVERS, type ProfileCoverOption } from '@/lib/game/profile-covers';
import { PROFILE_AVATARS, type ProfileAvatarOption } from '@/lib/game/profile-avatars';
import { PETS, type PetOption } from '@/lib/game/pet-assets';
import { GUARDIAN_ITEMS } from '@/lib/game/guardian-items';

export type ShopItemType = 'cover' | 'avatar' | 'pet' | 'guardian_item';

export interface ShopItem {
  type: ShopItemType;
  id: string;
  name: string;
  price: number;
  /** Para capa: imagePath; para avatar: path; para pet: spritePath; para guardian_item: ícone */
  imagePath: string;
  /** Se true, item só pode ser desbloqueado completando missão (não comprável com moedas). */
  unlockOnlyByMission?: boolean;
  /** Só para guardian_item: missão que desbloqueia (ex.: avatar_9_3). */
  unlockMissionId?: string;
  /** Só para guardian_item: bônus (anti-stress %, etc.). */
  bonus?: { stress_reduce_percent?: number; xp_percent?: number; coins_percent?: number };
}

/** Preços 5× e capas +15× (rebalanceamento). */
const COVER_PRICE = 6000;
const AVATAR_PRICE = 300;
/** Preço padrão de pet quando o pet não define price (fallback). 12×. */
const PET_PRICE_DEFAULT = 6000;

function coverToShopItem(c: ProfileCoverOption, index: number): ShopItem {
  return {
    type: 'cover',
    id: c.id,
    name: c.name,
    price: index === 0 ? 0 : COVER_PRICE,
    imagePath: c.imagePath || '',
  };
}

function avatarToShopItem(a: ProfileAvatarOption): ShopItem {
  const isDefault = a.id === 'personagem9';
  return {
    type: 'avatar',
    id: a.id,
    name: a.name,
    price: 0,
    imagePath: a.path,
    unlockOnlyByMission: !isDefault,
  };
}

function petToShopItem(p: PetOption): ShopItem {
  return {
    type: 'pet',
    id: p.id,
    name: p.name,
    price: p.price ?? PET_PRICE_DEFAULT,
    imagePath: p.spritePath,
  };
}

export const SHOP_CATALOG_COVERS: ShopItem[] = PROFILE_COVERS.map((c, i) => coverToShopItem(c, i));
export const SHOP_CATALOG_AVATARS: ShopItem[] = PROFILE_AVATARS.map(avatarToShopItem);
export const SHOP_CATALOG_PETS: ShopItem[] = PETS.map(petToShopItem);

export const SHOP_CATALOG_GUARDIAN_ITEMS: ShopItem[] = GUARDIAN_ITEMS.map((g) => ({
  type: 'guardian_item' as const,
  id: g.id,
  name: g.name,
  price: g.price,
  imagePath: g.imagePath,
  unlockMissionId: g.unlockMissionId,
  bonus: g.bonus,
}));

export function getShopItem(type: ShopItemType, itemId: string): ShopItem | undefined {
  const list =
    type === 'cover' ? SHOP_CATALOG_COVERS
    : type === 'avatar' ? SHOP_CATALOG_AVATARS
    : type === 'pet' ? SHOP_CATALOG_PETS
    : SHOP_CATALOG_GUARDIAN_ITEMS;
  return list.find((i) => i.id === itemId);
}

export function getCatalog(): { cover: ShopItem[]; avatar: ShopItem[]; pet: ShopItem[]; guardian_item: ShopItem[] } {
  return {
    cover: SHOP_CATALOG_COVERS,
    avatar: SHOP_CATALOG_AVATARS,
    pet: SHOP_CATALOG_PETS,
    guardian_item: SHOP_CATALOG_GUARDIAN_ITEMS,
  };
}
