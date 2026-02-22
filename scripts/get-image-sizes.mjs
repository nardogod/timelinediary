import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  return { w: 0, h: 0 };
}

for (const folder of ['escritorio', 'quartos']) {
  const dir = path.join(root, 'public', 'game', 'casa', folder);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f)).sort();
  console.log('\n' + folder + ':');
  for (const f of files) {
    const { w, h } = readPngSize(path.join(dir, f));
    console.log('  ' + f + ': ' + w + ' x ' + h);
  }
}
