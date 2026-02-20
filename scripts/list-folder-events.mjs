/**
 * Script para listar eventos de uma pasta específica
 * Uso: node scripts/list-folder-events.mjs <nome-da-pasta> <username>
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) {
    console.error('Arquivo .env.local não encontrado.');
    process.exit(1);
  }
  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  }
}

loadEnvLocal();

const folderName = process.argv[2] || 'pasta 1';
const username = process.argv[3];

if (!username) {
  console.error('❌ Erro: username é obrigatório');
  console.log('Uso: node scripts/list-folder-events.mjs <nome-da-pasta> <username>');
  console.log('Exemplo: node scripts/list-folder-events.mjs "pasta 1" teste_teste');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL não encontrada no .env.local');
  process.exit(1);
}

async function listFolderEvents() {
  try {
    const sql = neon(databaseUrl);
    
    // 1. Buscar usuário pelo username
    console.log(`\n🔍 Buscando usuário: ${username}...`);
    const userRows = await sql`
      SELECT id FROM users WHERE username = ${username} LIMIT 1
    `;
    
    if (userRows.length === 0) {
      console.error(`❌ Usuário "${username}" não encontrado`);
      process.exit(1);
    }
    
    const userId = userRows[0].id;
    console.log(`✅ Usuário encontrado: ${userId}`);
    
    // 2. Buscar pasta pelo nome
    console.log(`\n🔍 Buscando pasta: "${folderName}"...`);
    const folderRows = await sql`
      SELECT id, name, color FROM folders 
      WHERE user_id = ${userId} AND name = ${folderName} 
      LIMIT 1
    `;
    
    if (folderRows.length === 0) {
      console.error(`❌ Pasta "${folderName}" não encontrada para o usuário ${username}`);
      console.log('\n📁 Pastas disponíveis:');
      const allFolders = await sql`
        SELECT name FROM folders WHERE user_id = ${userId} ORDER BY name
      `;
      allFolders.forEach(f => console.log(`  - ${f.name}`));
      process.exit(1);
    }
    
    const folder = folderRows[0];
    console.log(`✅ Pasta encontrada: ${folder.name} (${folder.id})`);
    
    // 3. Buscar eventos da pasta
    console.log(`\n🔍 Buscando eventos da pasta "${folderName}"...`);
    const events = await sql`
      SELECT 
        id,
        title,
        date,
        end_date,
        type,
        link,
        task_id,
        created_at
      FROM events
      WHERE user_id = ${userId} AND folder_id = ${folder.id}
      ORDER BY date DESC, created_at DESC
    `;
    
    console.log(`\n📊 Total de eventos encontrados: ${events.length}\n`);
    
    if (events.length === 0) {
      console.log('ℹ️  Nenhum evento encontrado nesta pasta.');
      return;
    }
    
    // 4. Separar eventos regulares e eventos de tarefas
    const regularEvents = events.filter(e => !e.task_id);
    const taskEvents = events.filter(e => e.task_id);
    
    console.log(`📝 Eventos regulares: ${regularEvents.length}`);
    console.log(`✅ Eventos de tarefas concluídas: ${taskEvents.length}\n`);
    
    // 5. Listar eventos regulares
    if (regularEvents.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 EVENTOS REGULARES:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      regularEvents.forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.title}`);
        console.log(`   📅 Data: ${event.date}`);
        if (event.end_date) {
          console.log(`   📅 Data fim: ${event.end_date}`);
        }
        console.log(`   🏷️  Tipo: ${event.type}`);
        if (event.link) {
          console.log(`   🔗 Link: ${event.link}`);
        }
        console.log(`   🆔 ID: ${event.id}`);
        console.log(`   📅 Criado em: ${event.created_at}`);
      });
    }
    
    // 6. Listar eventos de tarefas concluídas
    if (taskEvents.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ EVENTOS DE TAREFAS CONCLUÍDAS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      taskEvents.forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.title}`);
        console.log(`   📅 Data: ${event.date}`);
        if (event.end_date) {
          console.log(`   📅 Data fim: ${event.end_date}`);
        }
        console.log(`   🏷️  Tipo: ${event.type}`);
        console.log(`   ✅ Task ID: ${event.task_id}`);
        if (event.link) {
          console.log(`   🔗 Link: ${event.link}`);
        }
        console.log(`   🆔 ID: ${event.id}`);
        console.log(`   📅 Criado em: ${event.created_at}`);
      });
    }
    
    // 7. Resumo por mês
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMO POR MÊS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const eventsByMonth = new Map();
    events.forEach(event => {
      const date = new Date(event.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!eventsByMonth.has(monthKey)) {
        eventsByMonth.set(monthKey, { regular: 0, tasks: 0 });
      }
      const counts = eventsByMonth.get(monthKey);
      if (event.task_id) {
        counts.tasks++;
      } else {
        counts.regular++;
      }
    });
    
    const sortedMonths = Array.from(eventsByMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    sortedMonths.forEach(([month, counts]) => {
      const total = counts.regular + counts.tasks;
      console.log(`\n📅 ${month}: ${total} eventos (${counts.regular} regulares + ${counts.tasks} tarefas)`);
    });
    
    console.log('\n✅ Listagem concluída!\n');
    
  } catch (error) {
    console.error('❌ Erro ao listar eventos:', error);
    process.exit(1);
  }
}

listFolderEvents();
