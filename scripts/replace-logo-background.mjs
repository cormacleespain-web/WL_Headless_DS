import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, '../public/wizeline-logo.png');
const outputPath = inputPath;

const { data, info } = await sharp(inputPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const threshold = 40; // treat as black if r,g,b all below this

for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r <= threshold && g <= threshold && b <= threshold) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    // keep alpha as-is (or set to 255 for opaque white)
    if (channels === 4) data[i + 3] = 255;
  }
}

await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(outputPath);

console.log('Logo background replaced with white.');
