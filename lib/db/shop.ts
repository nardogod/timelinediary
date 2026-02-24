import { getNeon } from '@/lib/neon';
import type { ShopItemType } from '@/lib/game/shop-catalog';
import { getShopItem, getCatalog } from '@/lib/game/shop-catalog';
import { getOrCreateGameProfile } from '@/lib/db/game';
import { getCompletedMissionIds } from '@/lib/db/missions';
import { getMissionById } from '@/lib/game/missions';

export type OwnedItems = {
  cover: string[];
  avatar: string[];
  pet: string[];
  guardian_item: string[];
  /** consumable_id -> quantity (máx 2 por item) */
  consumable: Record<string, number>;
};

/** Capa padrão desbloqueada para todos; avatar só Personagem 9; pets só compra/missão. */
const DEFAULT_OWNED_COVER_ID = 'default';
const DEFAULT_OWNED_AVATAR_ID = 'personagem9';

/** Retorna os itens possuídos. Capa: default sempre liberada + as compradas; avatar: personagem9 sempre + os comprados; pet: só da tabela; consumable: quantidades em game_consumable_owned. */
export async function getOwnedItems(userId: string): Promise<OwnedItems> {
  const sql = getNeon();
  const rows = await sql`
    SELECT item_type, item_id FROM game_owned_items WHERE user_id = ${userId}
  `;
  const list = (rows as { item_type: string; item_id: string }[]).map((r) => ({
    type: r.item_type as ShopItemType,
    id: r.item_id,
  }));
  const coverFromDb = list.filter((x) => x.type === 'cover').map((x) => x.id);
  const avatarFromDb = list.filter((x) => x.type === 'avatar').map((x) => x.id);
  const pet = list.filter((x) => x.type === 'pet').map((x) => x.id);
  const guardianItem = list.filter((x) => x.type === 'guardian_item').map((x) => x.id);

  let consumable: Record<string, number> = {};
  try {
    const consumableRows = await sql`
      SELECT consumable_id, quantity FROM game_consumable_owned WHERE user_id = ${userId}
    `;
    for (const r of consumableRows as { consumable_id: string; quantity: number }[]) {
      consumable[r.consumable_id] = Number(r.quantity);
    }
  } catch {
    // Tabela pode não existir antes da migration 025
  }

  const completedMissionIds = await getCompletedMissionIds(userId);
  const avatarUnlockedByMission: string[] = [];
  for (const missionId of completedMissionIds) {
    const mission = getMissionById(missionId);
    if (mission?.reward?.avatarUnlockId) avatarUnlockedByMission.push(mission.reward.avatarUnlockId);
  }

  return {
    cover: [...new Set([DEFAULT_OWNED_COVER_ID, ...coverFromDb])],
    avatar: [...new Set([DEFAULT_OWNED_AVATAR_ID, ...avatarFromDb, ...avatarUnlockedByMission])],
    pet,
    guardian_item: guardianItem,
    consumable,
  };
}

/** Compra um item: verifica preço, saldo, não possuído; para guardian_item exige missão desbloqueada; para consumable verifica estoque máx; debita moedas e insere. */
export async function purchaseItem(
  userId: string,
  itemType: ShopItemType,
  itemId: string
): Promise<{ ok: boolean; error?: string }> {
  const item = getShopItem(itemType, itemId);
  if (!item) return { ok: false, error: 'Item não encontrado' };
  if (item.price <= 0) return { ok: false, error: 'Item indisponível para compra' };

  if (itemType === 'guardian_item' && item.unlockMissionId) {
    const completedIds = await getCompletedMissionIds(userId);
    if (!completedIds.includes(item.unlockMissionId)) {
      return { ok: false, error: 'Complete as 3 missões do Guardião para desbloquear este item' };
    }
  }

  const profile = await getOrCreateGameProfile(userId);
  const owned = await getOwnedItems(userId);

  if (itemType === 'consumable') {
    const maxStock = item.maxStock ?? 2;
    const currentQty = owned.consumable[itemId] ?? 0;
    if (currentQty >= maxStock) return { ok: false, error: `Máximo de ${maxStock} em estoque para este item` };
    if (profile.coins < item.price) return { ok: false, error: 'Moedas insuficientes' };
    const sql = getNeon();
    try {
      await sql`
        INSERT INTO game_consumable_owned (user_id, consumable_id, quantity)
        VALUES (${userId}, ${itemId}, 1)
        ON CONFLICT (user_id, consumable_id) DO UPDATE SET
          quantity = game_consumable_owned.quantity + 1,
          updated_at = NOW()
      `;
    } catch (e) {
      console.error('[purchaseItem] consumable insert', e);
      return { ok: false, error: 'Erro ao registrar compra' };
    }
    await sql`
      UPDATE game_profiles SET coins = coins - ${item.price}, updated_at = NOW() WHERE user_id = ${userId}
    `;
    return { ok: true };
  }

  const ownedIds = owned[itemType];
  if (ownedIds.includes(itemId)) return { ok: false, error: 'Você já possui este item' };
  if (profile.coins < item.price) return { ok: false, error: 'Moedas insuficientes' };

  const sql = getNeon();
  try {
    await sql`
      INSERT INTO game_owned_items (user_id, item_type, item_id)
      VALUES (${userId}, ${itemType}, ${itemId})
      ON CONFLICT (user_id, item_type, item_id) DO NOTHING
    `;
  } catch (e) {
    console.error('[purchaseItem] insert', e);
    return { ok: false, error: 'Erro ao registrar compra' };
  }

  await sql`
    UPDATE game_profiles SET coins = coins - ${item.price}, updated_at = NOW() WHERE user_id = ${userId}
  `;
  return { ok: true };
}

/** Quantidade de usos hoje por consumível (máx. 2 por dia por item). consumable_id -> uses_count (1 ou 2). */
export async function getConsumablesUsedToday(userId: string): Promise<Record<string, number>> {
  try {
    const sql = getNeon();
    const today = new Date().toISOString().slice(0, 10);
    const rows = await sql`
      SELECT consumable_id, COALESCE(uses_count, 1) AS uses_count
      FROM game_consumable_use
      WHERE user_id = ${userId} AND used_date = ${today}::date
    `;
    const out: Record<string, number> = {};
    for (const r of rows as { consumable_id: string; uses_count: number }[]) {
      out[r.consumable_id] = Number(r.uses_count);
    }
    return out;
  } catch {
    return {};
  }
}

export { getCatalog };
