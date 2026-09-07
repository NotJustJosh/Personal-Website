import { chromium } from 'playwright-core'
const OUT = process.argv[2]
const b = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu'] })
const page = await b.newPage({ viewport: { width: 1280, height: 850 } })
const errs = []
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 250)))
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 250)) })
await page.goto('http://localhost:5173/Personal-Website/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(9000)
await page.keyboard.press('Escape'); await page.waitForTimeout(900)
await page.mouse.move(640, 430)
for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -180); await page.waitForTimeout(70) }
await page.keyboard.down('KeyD'); await page.waitForTimeout(1600)
await page.screenshot({ path: `${OUT}/t-moving.png` })
await page.keyboard.up('KeyD')
await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/t-settle.png` })
console.log('ERRORS:', errs.length ? errs.slice(0, 3) : 'none')
await b.close()
