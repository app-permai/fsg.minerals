// Copies the preserved corporate-site pages (legacy/) into the Vite
// build output so a single `dist/` folder contains BOTH the new
// marketplace SPA and the original corporate pages
// (corporate.html, minerals.html, market-tool.html, contact.html,
// admin.html + their assets). Run automatically by `npm run build`.
import { cpSync } from 'node:fs'

cpSync('legacy', 'dist', { recursive: true })
console.log('legacy/ corporate pages copied into dist/')
