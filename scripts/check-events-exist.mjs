/**
 * Script para verificar quais eventos ainda existem no banco de dados
 * Uso: node scripts/check-events-exist.mjs <username> <folder-name>
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

const username = process.argv[2] || 'teste_teste';
const folderName = process.argv[3] || 'pasta 1';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL não encontrada no .env.local');
  process.exit(1);
}

// IDs dos eventos listados anteriormente
const eventIds = [
  'd4468d4b-ffec-480a-b123-7f1592375015', // jh
  '8ed94518-888e-41d9-abaa-850eb4ad5ca8', // gbghg - 12:41
  '4357593b-5b18-4345-809a-a27052ffb053', // gbghg - 12:40
  'e4f4ef92-bb06-4313-b1f5-fd830da66fb5', // gbghg - 12:40
  '96d7ac41-ac76-48dd-bf17-6ff16352a35b', // gbghg - 12:40
  '66721e2c-9913-419f-be05-4d2b2981a251', // gbghg - 12:40
  '994ea3fc-fde6-448f-beb1-27871bf30cac', // gbghg - 12:40
  '8a85eae3-0514-4e77-b26c-fcc46093022f', // gbghg - 12:40
  '3a0857cc-a3eb-4e54-9bc2-0c7c7989b28e', // gbghg - 12:39
  '95567088-625c-47b5-99e4-05417f99d6c2', // ccc - 12:42 (tarefa)
  'd6f6aeb6-4054-4dce-8ce9-a1e18328c650', // Amonia - 18:29 (tarefa)
];

async function checkEvents() {
  try {
    const sql = neon(databaseUrl);
    
    // 1. Buscar usuário
    console.log(`\n🔍 Buscando usuário: ${username}...`);
    const userRows = await sql`
      SELECT id FROM users WHERE username = ${username} LIMIT 1
    `;
    
    if (userRows.length === 0) {
      console.error(`❌ Usuário "${username}" não encontrado`);
      process.exit(1);
    }
    
    const userId = userRows[0].id;
    console.log(`✅ Usuário encontrado: ${userId}\n`);
    
    // 2. Buscar pasta
    const folderRows = await sql`
      SELECT id, name FROM folders 
      WHERE user_id = ${userId} AND name = ${folderName} 
      LIMIT 1
    `;
    
    if (folderRows.length === 0) {
      console.error(`❌ Pasta "${folderName}" não encontrada`);
      process.exit(1);
    }
    
    const folderId = folderRows[0].id;
    console.log(`📁 Pasta: "${folderName}" (${folderId})\n`);
    
    // 3. Verificar quais eventos ainda existem
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFICANDO EVENTOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const existingEvents = [];
    const deletedEvents = [];
    
    for (const eventId of eventIds) {
      const eventRows = await sql`
        SELECT id, title, date, task_id, folder_id
        FROM events
        WHERE id = ${eventId} AND user_id = ${userId}
        LIMIT 1
      `;
      
      if (eventRows.length > 0) {
        const event = eventRows[0];
        // Verificar se ainda está na pasta correta
        if (event.folder_id === folderId) {
          existingEvents.push({
            id: event.id,
            title: event.title,
            date: event.date,
            task_id: event.task_id,
            isInFolder: true
          });
        } else {
          // Evento existe mas foi movido para outra pasta
          existingEvents.push({
            id: event.id,
            title: event.title,
            date: event.date,
            task_id: event.task_id,
            isInFolder: false,
            currentFolderId: event.folder_id
          });
        }
      } else {
        deletedEvents.push(eventId);
      }
    }
    
    // 4. Listar eventos que ainda existem
    if (existingEvents.length > 0) {
      console.log(`✅ EVENTOS QUE AINDA EXISTEM (${existingEvents.length}):\n`);
      
      const inFolder = existingEvents.filter(e => e.isInFolder);
      const moved = existingEvents.filter(e => !e.isInFolder);
      
      if (inFolder.length > 0) {
        console.log('📁 Na pasta "' + folderName + '":');
        inFolder.forEach((event, index) => {
          const type = event.task_id ? '✅ Tarefa' : '📝 Regular';
          console.log(`   ${index + 1}. ${event.title} (${type})`);
          console.log(`      📅 Data: ${event.date}`);
          console.log(`      🆔 ID: ${event.id}`);
        });
        console.log('');
      }
      
      if (moved.length > 0) {
        console.log('⚠️  Movidos para outra pasta:');
        moved.forEach((event, index) => {
          const type = event.task_id ? '✅ Tarefa' : '📝 Regular';
          console.log(`   ${index + 1}. ${event.title} (${type})`);
          console.log(`      📅 Data: ${event.date}`);
          console.log(`      🆔 ID: ${event.id}`);
          console.log(`      ⚠️  Folder ID atual: ${event.currentFolderId}`);
        });
        console.log('');
      }
    }
    
    // 5. Listar eventos que foram deletados
    if (deletedEvents.length > 0) {
      console.log(`\n❌ EVENTOS QUE FORAM DELETADOS (${deletedEvents.length}):\n`);
      deletedEvents.forEach((eventId, index) => {
        console.log(`   ${index + 1}. ID: ${eventId}`);
      });
      console.log('');
    }
    
    // 6. Resumo
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total verificado: ${eventIds.length}`);
    console.log(`   ✅ Ainda existem: ${existingEvents.length}`);
    console.log(`      - Na pasta "${folderName}": ${existingEvents.filter(e => e.isInFolder).length}`);
    console.log(`      - Movidos para outra pasta: ${existingEvents.filter(e => !e.isInFolder).length}`);
    console.log(`   ❌ Deletados: ${deletedEvents.length}`);
    console.log('');
    
    // 7. Verificar eventos atuais na pasta
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 EVENTOS ATUAIS NA PASTA "' + folderName + '":');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const currentEvents = await sql`
      SELECT id, title, date, task_id, created_at
      FROM events
      WHERE user_id = ${userId} AND folder_id = ${folderId}
      ORDER BY date DESC, created_at DESC
    `;
    
    console.log(`Total atual: ${currentEvents.length} eventos\n`);
    
    if (currentEvents.length > 0) {
      const regular = currentEvents.filter(e => !e.task_id);
      const tasks = currentEvents.filter(e => e.task_id);
      
      console.log(`📝 Regulares: ${regular.length}`);
      console.log(`✅ Tarefas: ${tasks.length}\n`);
      
      currentEvents.forEach((event, index) => {
        const type = event.task_id ? '✅' : '📝';
        console.log(`${index + 1}. ${type} ${event.title}`);
        console.log(`   📅 ${event.date} | 🆔 ${event.id}`);
      });
    }
    
    console.log('\n✅ Verificação concluída!\n');
    
  } catch (error) {
    console.error('❌ Erro ao verificar eventos:', error);
    process.exit(1);
  }
}

checkEvents();
