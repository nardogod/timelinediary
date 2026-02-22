import { getNeon } from '@/lib/neon';
import { getOrCreateGameProfile } from '@/lib/db/game';
import {
  HOUSES,
  WORK_ROOMS,
  DEFAULT_HOUSE_ID,
  DEFAULT_WORK_ROOM_ID,
  getHouseById,
  getWorkRoomById,
} from '@/lib/game/rooms-catalog';

export type OwnedRooms = { house: string[]; work: string[] };

/** Retorna casas e salas possuídas. Se não tiver nenhuma, retorna as padrão (casa_1, sala_1). */
export async function getOwnedRooms(userId: string): Promise<OwnedRooms> {
  const sql = getNeon();
  const rows = await sql`
    SELECT room_type, room_id FROM game_owned_rooms WHERE user_id = ${userId}
  `;
  const list = (rows as { room_type: string; room_id: string }[]).map((r) => ({
    type: r.room_type as 'house' | 'work',
    id: r.room_id,
  }));
  const houseIds = list.filter((x) => x.type === 'house').map((x) => x.id);
  const workIds = list.filter((x) => x.type === 'work').map((x) => x.id);
  const house = houseIds.length > 0 ? houseIds : [DEFAULT_HOUSE_ID];
  const work = workIds.length > 0 ? workIds : [DEFAULT_WORK_ROOM_ID];
  return {
    house: house.includes(DEFAULT_HOUSE_ID) ? house : [DEFAULT_HOUSE_ID, ...house],
    work: work.includes(DEFAULT_WORK_ROOM_ID) ? work : [DEFAULT_WORK_ROOM_ID, ...work],
  };
}

/** Compra uma casa ou sala. Verifica preço, saldo e se já possui. */
export async function purchaseRoom(
  userId: string,
  roomType: 'house' | 'work',
  roomId: string
): Promise<{ ok: boolean; error?: string }> {
  const catalog = roomType === 'house' ? HOUSES : WORK_ROOMS;
  const room = catalog.find((r) => r.id === roomId);
  if (!room) return { ok: false, error: 'Sala não encontrada' };
  if (room.price <= 0) return { ok: false, error: 'Sala já disponível' };

  const profile = await getOrCreateGameProfile(userId);
  const owned = await getOwnedRooms(userId);
  const ownedIds = owned[roomType];
  if (ownedIds.includes(roomId)) return { ok: false, error: 'Você já possui esta sala' };
  if (profile.coins < room.price) return { ok: false, error: 'Moedas insuficientes' };

  const sql = getNeon();
  try {
    await sql`
      INSERT INTO game_owned_rooms (user_id, room_type, room_id)
      VALUES (${userId}, ${roomType}, ${roomId})
      ON CONFLICT (user_id, room_type, room_id) DO NOTHING
    `;
  } catch (e) {
    console.error('[purchaseRoom] insert', e);
    return { ok: false, error: 'Erro ao registrar compra' };
  }
  await sql`
    UPDATE game_profiles SET coins = coins - ${room.price}, updated_at = NOW() WHERE user_id = ${userId}
  `;
  const { updateGameProfile } = await import('@/lib/db/game');
  if (roomType === 'house') {
    await updateGameProfile(userId, { current_house_id: roomId });
  } else {
    await updateGameProfile(userId, { current_work_room_id: roomId });
  }
  return { ok: true };
}

/** Define a casa ativa (precisa ser uma que o usuário possui). */
export async function setCurrentHouse(
  userId: string,
  houseId: string
): Promise<{ ok: boolean; error?: string }> {
  const owned = await getOwnedRooms(userId);
  if (!owned.house.includes(houseId)) return { ok: false, error: 'Casa não possuída' };
  if (!getHouseById(houseId)) return { ok: false, error: 'Casa inválida' };
  const { updateGameProfile } = await import('@/lib/db/game');
  await updateGameProfile(userId, { current_house_id: houseId });
  return { ok: true };
}

/** Define a sala de trabalho ativa (precisa ser uma que o usuário possui). */
export async function setCurrentWorkRoom(
  userId: string,
  roomId: string
): Promise<{ ok: boolean; error?: string }> {
  const owned = await getOwnedRooms(userId);
  if (!owned.work.includes(roomId)) return { ok: false, error: 'Sala não possuída' };
  if (!getWorkRoomById(roomId)) return { ok: false, error: 'Sala inválida' };
  const { updateGameProfile } = await import('@/lib/db/game');
  await updateGameProfile(userId, { current_work_room_id: roomId });
  return { ok: true };
}

export { HOUSES, WORK_ROOMS, getHouseById, getWorkRoomById };
