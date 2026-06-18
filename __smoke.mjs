import { chromium } from 'playwright'

const URL = process.argv[2] || 'http://localhost:4173/Personal-Website/'
const pageErrors = []
const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)))

await page.goto(URL, { waitUntil: 'load', timeout: 30000 })
await page.waitForSelector('canvas', { timeout: 15000 })
await page.waitForFunction(() => !document.querySelector('.loader'), { timeout: 25000 })
await page.waitForTimeout(800)

// Open the Resume panel and keep it open while we screenshot.
await page.getByRole('button', { name: 'Resume' }).first().click()
await page.waitForTimeout(600)
const panelOpenAfterClick = await page.locator('.panel').count()
const panelTitle = panelOpenAfterClick ? await page.locator('.panel__title').first().textContent() : null
await page.screenshot({ path: '__smoke-panel.png' })

// Close with Escape, confirm it closes.
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
const panelOpenAfterEsc = await page.locator('.panel').count()

console.log(JSON.stringify({ panelOpenAfterClick, panelTitle, panelOpenAfterEsc, pageErrors }, null, 2))
await browser.close()
