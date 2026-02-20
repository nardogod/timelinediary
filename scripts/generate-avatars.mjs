/**
 * Script para gerar e salvar avatares do DiceBear localmente
 * Uso: node scripts/generate-avatars.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const avatarsDir = join(root, 'public', 'avatars');

// Estilos disponíveis
const AVATAR_STYLES = [
  'avataaars',
  'adventurer',
  'adventurer-neutral',
  'big-smile',
  'bottts',
  'croodles',
  'fun-emoji',
  'icons',
  'identicon',
  'lorelei',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art',
  'rings',
  'shapes',
  'thumbs',
];

// Seeds para gerar avatares variados
const AVATAR_SEEDS = [
  'alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry',
  'iris', 'jack', 'kate', 'liam', 'mia', 'noah', 'olivia', 'paul',
  'quinn', 'ruby', 'sam', 'tina', 'uma', 'victor', 'willa', 'xavier',
  'yara', 'zoe', 'alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot',
];

async function generateAvatars() {
  console.log('🎨 Gerando avatares localmente...\n');

  // Cria diretório se não existir
  if (!existsSync(avatarsDir)) {
    mkdirSync(avatarsDir, { recursive: true });
  }

  let totalGenerated = 0;
  let totalFailed = 0;

  for (const style of AVATAR_STYLES) {
    const styleDir = join(avatarsDir, style);
    if (!existsSync(styleDir)) {
      mkdirSync(styleDir, { recursive: true });
    }

    console.log(`📁 Processando estilo: ${style}...`);

    for (const seed of AVATAR_SEEDS) {
      const fileName = `${seed}.svg`;
      const filePath = join(styleDir, fileName);
      
      // Pula se já existe
      if (existsSync(filePath)) {
        continue;
      }

      try {
        const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const svgContent = await response.text();
        writeFileSync(filePath, svgContent, 'utf-8');
        totalGenerated++;
        
        // Pequeno delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`  ❌ Erro ao gerar ${style}/${seed}:`, error.message);
        totalFailed++;
      }
    }

    console.log(`  ✅ Estilo ${style} concluído\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ✅ Gerados: ${totalGenerated}`);
  console.log(`   ❌ Falhas: ${totalFailed}`);
  console.log(`   📁 Diretório: ${avatarsDir}`);
  console.log('');
  console.log('✅ Geração concluída!\n');
}

generateAvatars().catch(console.error);
