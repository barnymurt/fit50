const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'C:\\Users\\bmurt\\Downloads\\illustration (13).png';
const APP_DIR = path.join(__dirname, '..', 'src', 'app');

const THRESHOLD = 240;
const FALLOFF = 40;

async function removeWhiteBackground(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const minChannel = Math.min(r, g, b);

    if (minChannel >= THRESHOLD) {
      data[i + 3] = 0;
    } else if (minChannel >= THRESHOLD - FALLOFF) {
      const t = (THRESHOLD - minChannel) / FALLOFF;
      data[i + 3] = Math.round(t * 255);
    }
  }

  return { data, info };
}

async function generateFavicon() {
  console.log('Processing FIT50 badge → favicon...\n');

  const { data, info } = await removeWhiteBackground(SRC);
  const { width, height } = info;

  // app/icon.png — Next.js will auto-generate all sizes from this
  // Use a large size for best quality across all generated icons
  const icon512 = await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // app/apple-icon.png — iOS touch icon
  const apple180 = await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // favicon.ico — traditional favicon (32x32 is the standard)
  const favicon32 = await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Remove any existing files first
  const existingFiles = ['icon.png', 'apple-icon.png', 'favicon.ico'];
  for (const file of existingFiles) {
    const p = path.join(APP_DIR, file);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  Removed existing ${file}`);
    }
  }

  // Write the new files
  fs.writeFileSync(path.join(APP_DIR, 'icon.png'), icon512);
  console.log(`  ✓ app/icon.png (512x512, Next.js auto-generates smaller sizes)`);

  fs.writeFileSync(path.join(APP_DIR, 'apple-icon.png'), apple180);
  console.log(`  ✓ app/apple-icon.png (180x180, iOS touch icon)`);

  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), favicon32);
  console.log(`  ✓ app/favicon.ico (32x32, traditional favicon)`);

  console.log('\nDone. Favicon ready.');
}

generateFavicon().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
