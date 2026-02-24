/**
 * Credita bônus do Meu Mundo para usuários que cadastraram/concluíram tarefas
 * mas não receberam o crédito (até 4 tarefas por usuário, sem atividade em game_activities).
 *
 * Uso: node scripts/credit-game-bonus-by-username.mjs
 *
 * Usuários: nell92, paminha (configuráveis no array USERNAMES abaixo).
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const USERNAMES = ['nell92', 'paminha'];
const MAX_TASKS_PER_USER = 4;

// Recompensas base (igual lib/game/folder-types.ts)
const FOLDER_REWARDS = {
  trabalho: { coins: 120, xp: 35, health_change: -6, stress_change: 16 },
  estudos: { coins: 0, xp: 55, health_change: -3, stress_change: 8 },
  lazer: { coins: 0, xp: 0, health_change: 12, stress_change: -8 },
  tarefas_pessoais: { coins: 0, xp: 0, health_change: 5, stress_change: -4 },
};
const IMPORTANCE_MULT = { simple: 0.6, medium: 1, important: 1.4 };
const STRESS_CAP = 120;

function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) {
    console.error('Arquivo .env.local não encontrado.');
    process.exit(1);
  }
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).replace(/\\"/g, '"');
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1).replace(/\\'/g, "'");
        process.env[key] = value;
      }
    }
  }
}

/** Nível 1–50 a partir da experiência (igual lib/game/level-progression.ts). */
function levelFromExperience(experience) {
  if (experience <= 0) return 1;
  const XP_FOR_NEXT = [];
  for (let i = 0; i < 49; i++) XP_FOR_NEXT.push(88 + i * 3);
  const CUMULATIVE = [0];
  for (let i = 0; i < XP_FOR_NEXT.length; i++) CUMULATIVE.push(CUMULATIVE[i] + XP_FOR_NEXT[i]);
  for (let L = 49; L >= 0; L--) {
    if (experience >= CUMULATIVE[L]) return L + 1;
  }
  return 1;
}

function getReward(folderType, importance) {
  const base = FOLDER_REWARDS[folderType] ?? FOLDER_REWARDS.trabalho;
  const mult = IMPORTANCE_MULT[importance] ?? 1;
  return {
    coins: Math.round(base.coins * mult),
    xp: Math.round(base.xp * mult),
    health_change: Math.round(base.health_change * mult),
    stress_change: Math.round(base.stress_change * mult),
  };
}

loadEnvLocal();
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL não definida em .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function creditUser(username) {
  const userRows = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1`;
  const userId = userRows[0]?.id;
  if (!userId) {
    console.log(`  Usuário "${username}" não encontrado.`);
    return;
  }

  const profileRows = await sql`
    SELECT coins, experience, level, health, stress FROM game_profiles WHERE user_id = ${userId} LIMIT 1
  `;
  let profile = profileRows[0];
  if (!profile) {
    await sql`
      INSERT INTO game_profiles (user_id, coins, level, experience, health, stress)
      VALUES (${userId}, 200, 1, 0, 100, 0)
      ON CONFLICT (user_id) DO NOTHING
    `;
    profile = { coins: 200, experience: 0, level: 1, health: 100, stress: 0 };
  }
  profile = {
    coins: Number(profile.coins),
    experience: Number(profile.experience),
    health: Number(profile.health),
    stress: Number(profile.stress),
  };

  const tasksWithoutBonus = await sql`
    SELECT t.id AS task_id, t.folder_id, t.completed_at
    FROM tasks t
    WHERE t.user_id = ${userId} AND t.completed = true
      AND NOT EXISTS (
        SELECT 1 FROM game_activities ga
        WHERE ga.task_id = t.id AND ga.user_id = ${userId}
      )
    ORDER BY t.completed_at ASC
    LIMIT ${MAX_TASKS_PER_USER}
  `;

  const dateToday = new Date().toISOString().slice(0, 10);
  let totalCoins = 0;
  let totalXp = 0;
  let totalHealth = 0;
  let totalStress = 0;
  const activities = [];

  if (tasksWithoutBonus.length === 0) {
    const completedCount = await sql`
      SELECT COUNT(*) AS c FROM tasks WHERE user_id = ${userId} AND completed = true
    `;
    const n = Number(completedCount[0]?.c ?? 0);
    if (n >= 4) {
      console.log(`  ${username}: ${n} tarefa(s) concluída(s) mas todas já com bônus. Creditando bônus equivalente a 4 tarefas (trabalho, média).`);
    } else {
      console.log(`  ${username}: creditando bônus equivalente a 4 tarefas (trabalho, importância média).`);
    }
    const base = getReward('trabalho', 'medium');
    for (let i = 0; i < MAX_TASKS_PER_USER; i++) {
      totalCoins += base.coins;
      totalXp += base.xp;
      totalHealth += base.health_change;
      totalStress += base.stress_change;
      activities.push({
        task_id: null,
        activity_type: 'trabalho',
        scheduled_date: dateToday,
        coins_earned: base.coins,
        xp_earned: base.xp,
        health_change: base.health_change,
        stress_change: base.stress_change,
      });
    }
  } else {
    for (const t of tasksWithoutBonus) {
      const folderRows = await sql`SELECT folder_type FROM folders WHERE id = ${t.folder_id} LIMIT 1`;
      const folderType = (folderRows[0]?.folder_type ?? 'trabalho').toString();
      const eventRows = await sql`SELECT date, type FROM events WHERE task_id = ${t.task_id} LIMIT 1`;
      const ev = eventRows[0];
      const importance = (ev?.type ?? 'medium').toString();
      const dateStr = ev?.date ? new Date(ev.date).toISOString().slice(0, 10) : dateToday;

      const reward = getReward(folderType, importance);
      totalCoins += reward.coins;
      totalXp += reward.xp;
      totalHealth += reward.health_change;
      totalStress += reward.stress_change;

      const activityType = ['trabalho', 'estudos', 'lazer', 'tarefas_pessoais'].includes(folderType) ? folderType : 'trabalho';
      activities.push({
        task_id: t.task_id,
        activity_type: activityType,
        scheduled_date: dateStr,
        coins_earned: reward.coins,
        xp_earned: reward.xp,
        health_change: reward.health_change,
        stress_change: reward.stress_change,
      });
    }
  }

  const newCoins = profile.coins + totalCoins;
  const newExperience = profile.experience + totalXp;
  const newHealth = Math.max(0, Math.min(100, profile.health + totalHealth));
  const newStress = Math.max(0, Math.min(STRESS_CAP, profile.stress + totalStress));
  const newLevel = levelFromExperience(newExperience);
  const now = new Date().toISOString();

  await sql`
    UPDATE game_profiles
    SET coins = ${newCoins}, experience = ${newExperience}, level = ${newLevel},
        health = ${newHealth}, stress = ${newStress}, updated_at = NOW()
    WHERE user_id = ${userId}
  `;

  for (const a of activities) {
    await sql`
      INSERT INTO game_activities (
        user_id, task_id, activity_type, scheduled_date, scheduled_time,
        completed, completed_at, coins_earned, xp_earned, health_change, stress_change
      ) VALUES (
        ${userId}, ${a.task_id ?? null}, ${a.activity_type}, ${a.scheduled_date}, null,
        true, ${now}::timestamptz, ${a.coins_earned}, ${a.xp_earned}, ${a.health_change}, ${a.stress_change}
      )
    `;
  }

  console.log(`  ${username}: ${activities.length} tarefa(s) creditada(s).`);
  console.log(`    Moedas: ${profile.coins} → ${newCoins} (+${totalCoins}). XP: ${profile.experience} → ${newExperience} (+${totalXp}). Nível: ${newLevel}.`);
}

async function main() {
  console.log('Creditando bônus Meu Mundo (até 4 tarefas por usuário)...\n');
  for (const username of USERNAMES) {
    await creditUser(username);
  }
  console.log('\nConcluído.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
