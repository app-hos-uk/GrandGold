#!/usr/bin/env node
/**
 * Generates a 192x192 PNG for PWA/manifest (brand red #b82222).
 * Run: node scripts/generate-placeholder-icon.js
 * Requires: pnpm add -D sharp (in apps/web)
 */
const path = require('path');
const fs = require('fs');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Run: pnpm add -D sharp (in apps/web)');
    process.exit(1);
  }

  const outDir = path.join(__dirname, '..', 'public', 'icons');
  const outPath = path.join(outDir, 'icon-192x192.png');
  fs.mkdirSync(outDir, { recursive: true });

  // 192x192 solid red (#b82222) PNG for manifest
  const buffer = await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 3,
      background: { r: 184, g: 34, b: 34 },
    },
  })
    .png()
    .toBuffer();

  fs.writeFileSync(outPath, buffer);
  console.log('Written:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
