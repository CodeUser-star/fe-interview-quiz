/** 视觉核对截图：手机 / 桌面 × 浅色 / 深色 + 做题页关键状态 */
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:4173'
const DEVTOOLS = process.env.DEVTOOLS || 'http://127.0.0.1:9222'
const SHOTS = '.tmp/shots'
mkdirSync(SHOTS, { recursive: true })

const tabs = await (await fetch(`${DEVTOOLS}/json`)).json()
const target = tabs.find((t) => t.type === 'page')
const ws = new WebSocket(target.webSocketDebuggerUrl)
let seq = 0
const pending = new Map()

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))

function send(method, params = {}) {
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expression)
  return r.result.value
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(r.data, 'base64'))
}

async function clickText(text) {
  const ok = await evaluate(`(() => {
    const els = [...document.querySelectorAll('button, a')]
    const el = els.find(e => e.textContent.trim() === ${JSON.stringify(text)}) || els.find(e => e.textContent.trim().includes(${JSON.stringify(text)}))
    if (!el) return 'MISS'
    el.click(); return 'OK'
  })()`)
  if (ok === 'MISS') throw new Error('找不到按钮：' + text)
  await sleep(280)
}

async function goto(route) {
  await send('Page.navigate', { url: `${BASE}/#${route}` })
  await sleep(750)
}

/** 需要让 pinia 重新读 localStorage 时用：整页重载 */
async function hardGoto(route) {
  await send('Page.navigate', { url: `${BASE}/#${route}` })
  await sleep(300)
  await send('Page.reload')
  await sleep(900)
}

async function viewport(w, h, mobile) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile,
  })
}

async function theme(value) {
  await send('Emulation.setEmulatedMedia', {
    features: value ? [{ name: 'prefers-color-scheme', value }] : [],
  })
}

// ---------- 准备：清 SW 缓存 + 种入真实感数据 ----------
await send('Network.enable')
await send('Network.setCacheDisabled', { cacheDisabled: true })
await send('Page.navigate', { url: `${BASE}/` })
await sleep(700)
await evaluate(`(async () => {
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister()
  for (const k of await caches.keys()) await caches.delete(k)
  return 'ok'
})()`)

const seed = await evaluate(`(() => {
  const DAY = 86400000
  const now = Date.now()
  localStorage.clear()

  const reviews = ['q-js-003', 'q-css-001', 'q-vue-001', 'q-network-002', 'q-short-001']
  const pool = ['q-js-001','q-js-002','q-js-004','q-js-005','q-js-006','q-css-002','q-css-003','q-css-004','q-vue-002','q-vue-003','q-vue-004','q-browser-001','q-browser-002','q-browser-003','q-network-001','q-network-003','q-short-002','q-short-003']
  const records = []
  for (let d = 0; d < 6; d++) {
    const n = [14, 22, 9, 31, 18, 12][d]
    for (let i = 0; i < n; i++) {
      const qid = pool[(d * 7 + i) % pool.length]
      records.push({ qid, ts: now - d * DAY - i * 60000, correct: (i + d) % 5 !== 0, self: qid.startsWith('q-short') })
    }
  }
  localStorage.setItem('feq.records', JSON.stringify(records))

  const review = {}
  reviews.forEach((qid, i) => {
    review[qid] = { qid, stage: i % 3, dueAt: now - i * 3600000 - (i === 0 ? DAY : 0), addedAt: now - 3 * DAY }
  })
  review['q-vue-001'].wrongReason = 'careless'
  localStorage.setItem('feq.review', JSON.stringify(review))

  localStorage.setItem('feq.meta', JSON.stringify({
    stars: { 'q-js-002': now, 'q-code-009': now, 'q-short-003': now },
    notes: {
      'q-js-002': '微任务在每个宏任务结束后清空，注意 Promise 与 await 的先后。',
      'q-css-001': 'flex:1 的 basis 是 0%，不是 auto。',
    },
  }))

  const checkins = {}
  for (let d = 1; d <= 5; d++) checkins[new Date(now - d * DAY).toISOString().slice(0, 10)] = now - d * DAY
  checkins[new Date(now - 7 * DAY).toISOString().slice(0, 10)] = now - 7 * DAY
  localStorage.setItem('feq.checkins', JSON.stringify(checkins))

  localStorage.setItem('feq.settings', JSON.stringify({ theme: 'system', dailyGoal: 30 }))
  return { records: records.length, review: Object.keys(review).length }
})()`)
console.log('seed', JSON.stringify(seed))

// 种子数据写入后必须整页重载，否则 pinia 仍持有旧状态
await send('Page.reload')
await sleep(900)

// ---------- 浅色 · 手机 ----------
await theme('light')
await viewport(412, 880, true)
for (const [route, name] of [
  ['/', 'today'],
  ['/bank', 'bank'],
  ['/review', 'review'],
  ['/stats', 'stats'],
  ['/settings', 'settings'],
]) {
  await goto(route)
  await shot(`m-light-${name}`)
}

// ---------- 做题页关键状态（浅色手机） ----------
await evaluate(`(() => {
  localStorage.setItem('feq.session', JSON.stringify({
    id: 'shot', mode: 'bank', label: '专项 · 字节一面',
    qids: ['q-js-002','q-code-001','q-short-003'], index: 0, results: [], startedAt: Date.now(),
  }))
  return 'ok'
})()`)
await hardGoto('/quiz')
await shot('m-light-quiz-answer')
await evaluate(`document.querySelectorAll('.option')[0].click()`)
await sleep(380)
await shot('m-light-quiz-judged')

await clickText('下一题')
await shot('m-light-quiz-code')
await clickText('掌握')
await clickText('下一题')
await clickText('看答题要点')
await shot('m-light-quiz-short')
await clickText('掌握')
await clickText('完成本轮')
await sleep(500)
await shot('m-light-result')

// ---------- 深色 · 手机 ----------
await theme('dark')
await goto('/')
await send('Page.reload')
await sleep(800)
await shot('m-dark-today')
await goto('/bank')
await shot('m-dark-bank')
await goto('/stats')
await shot('m-dark-stats')

// 重新种一轮会话（上一轮已结算）
await evaluate(`(() => {
  localStorage.setItem('feq.session', JSON.stringify({
    id: 'shot2', mode: 'bank', label: '专项 · 字节一面',
    qids: ['q-js-002','q-code-001','q-short-003'], index: 0, results: [], startedAt: Date.now(),
  }))
  return 'ok'
})()`)
await hardGoto('/quiz')
await shot('m-dark-quiz-answer')
await evaluate(`document.querySelectorAll('.option')[0].click()`)
await sleep(380)
await shot('m-dark-quiz-judged')

// ---------- 浅色 · 桌面 ----------
await theme('light')
await viewport(1280, 900, false)
for (const [route, name] of [
  ['/', 'today'],
  ['/bank', 'bank'],
  ['/stats', 'stats'],
]) {
  await goto(route)
  await shot(`d-light-${name}`)
}
await hardGoto('/quiz')
await shot('d-light-quiz')

// ---------- 深色 · 桌面 ----------
await theme('dark')
await goto('/quiz')
await send('Page.reload')
await sleep(900)
await shot('d-dark-quiz')

console.log('shots done')
ws.close()
process.exit(0)
