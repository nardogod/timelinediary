import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getCatalog, getOwnedItems, getConsumablesUsedToday } from '@/lib/db/shop';
import { getAvatarUnlockSummary } from '@/lib/game/missions';
import { getCompletedMissionIds } from '@/lib/db/missions';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [catalog, owned, completedMissionIds, consumableUsedToday] = await Promise.all([
      getCatalog(),
      getOwnedItems(userId),
      getCompletedMissionIds(userId),
      getConsumablesUsedToday(userId),
    ]);
    const avatarCatalog = catalog.avatar.map((item) => {
      const summary = getAvatarUnlockSummary(item.id);
      return {
        ...item,
        ...(summary && {
          unlockMissionName: summary.missionName,
          unlockMissionRequirement: summary.requirement,
          previousAvatarName: summary.previousAvatarName,
        }),
      };
    });
    const guardianCatalog = catalog.guardian_item.map((item) => ({
      ...item,
      unlocked: completedMissionIds.includes(item.unlockMissionId ?? ''),
    }));
    return NextResponse.json({
      catalog: { ...catalog, avatar: avatarCatalog, guardian_item: guardianCatalog },
      owned,
      consumable_used_today: consumableUsedToday,
    });
  } catch (e) {
    console.error('[game/shop/catalog GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
