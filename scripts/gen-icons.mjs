import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const emblem = `
  <g transform="translate(256,256)">
    <path d="M0 -120c50 60 110 90 190 90-40 40-90 60-130 60 50 20 90 20 140 10-50 60-120 80-180 70l-20 30-20-30c-60 10-130-10-180-70 50 10 90 10 140-10-40 0-90-20-130-60 80 0 140-30 190-90z"
      fill="url(#g)"/>
    <path d="M-200 150l100 -120 80 70 60 -90 80 110 60 -60 100 90"
      stroke="url(#g)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85"/>
  </g>`

function svg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="512" y2="512">
        <stop offset="0%" stop-color="#ff5a4d"/>
        <stop offset="55%" stop-color="#e11d2a"/>
        <stop offset="100%" stop-color="#8b0c16"/>
      </linearGradient>
      <radialGradient id="bg" cx="50%" cy="38%" r="75%">
        <stop offset="0%" stop-color="#1a1015"/>
        <stop offset="100%" stop-color="#0a0a0b"/>
      </radialGradient>
    </defs>
    <rect width="512" height="512" rx="112" fill="url(#bg)"/>
    <circle cx="256" cy="220" r="180" fill="#e11d2a" opacity="0.12"/>
    ${emblem}
  </svg>`
}

try {
  const { default: sharp } = await import('sharp')

  for (const size of [192, 512]) {
    await sharp(Buffer.from(svg(512)))
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}.png`)
    console.log(`icon-${size}.png`)
  }

  await sharp(Buffer.from(svg(512))).resize(180, 180).png().toFile('public/apple-touch-icon.png')
  await sharp(Buffer.from(svg(512))).resize(48, 48).png().toFile('public/favicon.png')
  console.log('done')
} catch (e) {
  console.warn('Icon generation skipped:', e.message)
}
