/**
 * Seed de dois perfis demo para a página inicial:
 * - demo_lucas (masculino)
 * - demo_clara (feminino)
 *
 * Cria/atualiza:
 * - Usuários (tabela users) com avatar bem bonito
 * - 4 pastas: Trabalho, Estudos, Lazer, Tarefas pessoais
 * - 4–8 eventos recentes distribuídos nessas pastas (mês vigente)
 * - Perfil do Meu Mundo em nível avançado, com capa e pet configurados
 *
 * Uso:
 *   node scripts/seed-demo-landing-users.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

loadEnvLocal();
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL não definida em .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

function isoDateOffsetDays(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split('T')[0];
}

const DEMO_USERS = [
  {
    username: 'demo_lucas',
    email: 'lucas.demo@timelinediary.app',
    name: 'Lucas Andrade',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LucasAndrade',
    cover_id: 'capa4',
    avatar_image_url: '/game/assets/avatar/personagem1.png',
    pet_id: 'pet3', // Gato
  },
  {
    username: 'demo_clara',
    email: 'clara.demo@timelinediary.app',
    name: 'Clara Nogueira',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ClaraNogueira',
    cover_id: 'capa5',
    avatar_image_url: '/game/assets/avatar/personagem17.png',
    pet_id: 'pet5', // Coruja
  },
];

const FOLDERS = [
  { name: 'Trabalho', color: '#dc2626' },
  { name: 'Estudos', color: '#2563eb' },
  { name: 'Lazer', color: '#16a34a' },
  { name: 'Tarefas pessoais', color: '#ca8a04' },
];

async function upsertUser(demo) {
  const existing = await sql`
    SELECT id FROM users WHERE LOWER(TRIM(username)) = ${demo.username.toLowerCase()} LIMIT 1
  `;
  if (existing.length > 0) {
    return existing[0].id;
  }
  const password_hash = await bcrypt.hash('demo1234', 10);
  const rows = await sql`
    INSERT INTO users (email, username, name, avatar, password_hash)
    VALUES (${demo.email}, ${demo.username}, ${demo.name}, ${demo.avatar}, ${password_hash})
    RETURNING id
  `;
  return rows[0].id;
}

async function ensureFolders(userId) {
  const idsByName = {};
  for (const f of FOLDERS) {
    const existing = await sql`
      SELECT id FROM folders WHERE user_id = ${userId} AND name = ${f.name} LIMIT 1
    `;
    if (existing.length > 0) {
      idsByName[f.name] = existing[0].id;
      continue;
    }
    const rows = await sql`
      INSERT INTO folders (user_id, name, color, is_private)
      VALUES (${userId}, ${f.name}, ${f.color}, false)
      RETURNING id
    `;
    idsByName[f.name] = rows[0].id;
  }
  return idsByName;
}

async function seedEventsForLucas(userId, folderIds) {
  // Limpa eventos antigos desse usuário para manter o demo enxuto
  await sql`DELETE FROM events WHERE user_id = ${userId}`;

  const events = [
    // Trabalho
    {
      title: 'Planejar semana no Notion',
      daysFromToday: -2,
      type: 'medium',
      folder: 'Trabalho',
      link: 'https://notion.so',
    },
    {
      title: 'Revisão de sprint com o time',
      daysFromToday: -5,
      type: 'important',
      folder: 'Trabalho',
      link: 'https://meet.google.com',
    },
    // Estudos
    {
      title: 'Curso online de React',
      daysFromToday: -3,
      type: 'medium',
      folder: 'Estudos',
      link: 'https://youtube.com',
    },
    {
      title: 'Leitura: hábitos atômicos',
      daysFromToday: -7,
      type: 'simple',
      folder: 'Estudos',
    },
    // Lazer
    {
      title: 'Caminhada no parque',
      daysFromToday: -1,
      type: 'simple',
      folder: 'Lazer',
    },
    {
      title: 'Cinema com amigos',
      daysFromToday: -6,
      type: 'medium',
      folder: 'Lazer',
      link: 'https://letterboxd.com',
    },
    // Tarefas pessoais
    {
      title: 'Organizar finanças do mês',
      daysFromToday: -4,
      type: 'medium',
      folder: 'Tarefas pessoais',
    },
    {
      title: 'Check-up médico anual',
      daysFromToday: -10,
      type: 'important',
      folder: 'Tarefas pessoais',
    },
  ];

  for (const ev of events) {
    const folderId = folderIds[ev.folder];
    if (!folderId) continue;
    const date = isoDateOffsetDays(ev.daysFromToday);
    await sql`
      INSERT INTO events (user_id, title, date, type, link, folder_id)
      VALUES (
        ${userId},
        ${ev.title},
        ${date},
        ${ev.type},
        ${ev.link ?? null},
        ${folderId}
      )
    `;
  }
}

async function seedEventsForClara(userId, folderIds) {
  await sql`DELETE FROM events WHERE user_id = ${userId}`;

  const events = [
    // Trabalho
    {
      title: 'Reunião de briefing com cliente',
      daysFromToday: -2,
      type: 'important',
      folder: 'Trabalho',
      link: 'https://figma.com',
    },
    {
      title: 'Revisar conteúdo para redes sociais',
      daysFromToday: -5,
      type: 'medium',
      folder: 'Trabalho',
      link: 'https://instagram.com',
    },
    // Estudos
    {
      title: 'Aula de UX Writing',
      daysFromToday: -1,
      type: 'medium',
      folder: 'Estudos',
      link: 'https://notion.so',
    },
    {
      title: 'Revisar inglês para entrevista',
      daysFromToday: -4,
      type: 'simple',
      folder: 'Estudos',
    },
    // Lazer
    {
      title: 'Clube do livro com amigas',
      daysFromToday: -3,
      type: 'simple',
      folder: 'Lazer',
    },
    {
      title: 'Yoga ao pôr do sol',
      daysFromToday: -6,
      type: 'simple',
      folder: 'Lazer',
    },
    // Tarefas pessoais
    {
      title: 'Organizar fotos do mês',
      daysFromToday: -7,
      type: 'simple',
      folder: 'Tarefas pessoais',
      link: 'https://photos.google.com',
    },
    {
      title: 'Planejar viagem de fim de semana',
      daysFromToday: -9,
      type: 'medium',
      folder: 'Tarefas pessoais',
    },
  ];

  for (const ev of events) {
    const folderId = folderIds[ev.folder];
    if (!folderId) continue;
    const date = isoDateOffsetDays(ev.daysFromToday);
    await sql`
      INSERT INTO events (user_id, title, date, type, link, folder_id)
      VALUES (
        ${userId},
        ${ev.title},
        ${date},
        ${ev.type},
        ${ev.link ?? null},
        ${folderId}
      )
    `;
  }
}

async function ensureGameProfile(demo, userId) {
  const existing = await sql`
    SELECT user_id FROM game_profiles WHERE user_id = ${userId} LIMIT 1
  `;
  const base = {
    coins: 3200,
    level: 6,
    experience: 650,
    health: 90,
    stress: 20,
  };
  if (existing.length === 0) {
    await sql`
      INSERT INTO game_profiles (user_id, profession, coins, level, experience, health, stress, cover_id, avatar_image_url, pet_id)
      VALUES (
        ${userId},
        ${'Demo inspirador'},
        ${base.coins},
        ${base.level},
        ${base.experience},
        ${base.health},
        ${base.stress},
        ${demo.cover_id},
        ${demo.avatar_image_url},
        ${demo.pet_id}
      )
    `;
  } else {
    await sql`
      UPDATE game_profiles
      SET
        coins = ${base.coins},
        level = ${base.level},
        experience = ${base.experience},
        health = ${base.health},
        stress = ${base.stress},
        cover_id = ${demo.cover_id},
        avatar_image_url = ${demo.avatar_image_url},
        pet_id = ${demo.pet_id},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  }
}

async function main() {
  console.log('Seeding usuários demo para a landing page...\n');

  for (const demo of DEMO_USERS) {
    console.log(`> Processando ${demo.username} (${demo.name})`);
    const userId = await upsertUser(demo);
    const folderIds = await ensureFolders(userId);

    if (demo.username === 'demo_lucas') {
      await seedEventsForLucas(userId, folderIds);
    } else {
      await seedEventsForClara(userId, folderIds);
    }
    await ensureGameProfile(demo, userId);
    console.log(`  OK: usuário ${demo.username}, pastas e eventos demo atualizados.\n`);
  }

  console.log('Seed concluído.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro ao executar seed demo:', err);
  process.exit(1);
});

