const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const mapping = [
  { src: 'illustration (1).png', dest: 'crispy-clarity' },
  { src: 'illustration (2).png', dest: 'chill-out' },
  { src: 'illustration (3).png', dest: 'wet-lips' },
  { src: 'illustration (4).png', dest: 'open-mind' },
  { src: 'illustration (5).png', dest: 'feed-brain' },
  { src: 'illustration (6).png', dest: 'fresh-lungs' },
  { src: 'illustration (7).png', dest: 'step-it-up' },
  { src: 'illustration (8).png', dest: 'move-body' },
  { src: 'illustration (9).png', dest: 'fuel-right' },
];

const srcDir = 'C:\\Users\\bmurt\\Downloads';
const destDir = path.join(__dirname, '..', 'public', 'icons');

const THRESHOLD = 240; // Pure white = transparent
const FALLOFF = 40; // Pixels within this range of white get partial alpha

async function removeWhiteBackground(input, output) {
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
      data[i + 3] = 0; // Fully transparent
    } else if (minChannel >= THRESHOLD - FALLOFF) {
      // Partial transparency for anti-aliased edges
      const t = (THRESHOLD - minChannel) / FALLOFF;
      data[i + 3] = Math.round(t * 255);
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(output);
}

(async () => {
  for (const { src, dest } of mapping) {
    const srcPath = path.join(srcDir, src);
    const destPath = path.join(destDir, `${dest}.webp`);

    const beforeStat = fs.statSync(srcPath);
    await removeWhiteBackground(srcPath, destPath);

    const afterStat = fs.statSync(destPath);
    const savings = ((1 - afterStat.size / beforeStat.size) * 100).toFixed(1);
    console.log(`${src} → ${dest}.webp: ${(beforeStat.size / 1024).toFixed(1)}KB → ${(afterStat.size / 1024).toFixed(1)}KB (${savings}% smaller)`);
  }
  console.log('\nDone. White backgrounds removed.');
})();
