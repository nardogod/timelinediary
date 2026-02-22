/**
 * Catálogo da loja (capas, avatares, pets). Nada é grátis — todos os itens têm preço em moedas.
 */

import { PROFILE_COVERS, type ProfileCoverOption } from '@/lib/game/profile-covers';
import { PROFILE_AVATARS, type ProfileAvatarOption } from '@/lib/game/profile-avatars';
import { PETS, type PetOption } from '@/lib/game/pet-assets';

export type ShopItemType = 'cover' | 'avatar' | 'pet';

export interface ShopItem {
  type: ShopItemType;
  id: string;
  name: string;
  price: number;
  /** Para capa: imagePath; para avatar: path; para pet: spritePath */
  imagePath: string;
  /** Se true, item só pode ser desbloqueado completando missão (não comprável com moedas). */
  unlockOnlyByMission?: boolean;
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

export function getShopItem(type: ShopItemType, itemId: string): ShopItem | undefined {
  const list =
    type === 'cover' ? SHOP_CATALOG_COVERS : type === 'avatar' ? SHOP_CATALOG_AVATARS : SHOP_CATALOG_PETS;
  return list.find((i) => i.id === itemId);
}

export function getCatalog(): { cover: ShopItem[]; avatar: ShopItem[]; pet: ShopItem[] } {
  return {
    cover: SHOP_CATALOG_COVERS,
    avatar: SHOP_CATALOG_AVATARS,
    pet: SHOP_CATALOG_PETS,
  };
}
