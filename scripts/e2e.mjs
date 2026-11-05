/**
 * 端到端冒烟：用 Chrome DevTools Protocol 真机点击一遍刷题闭环
 * 只用于本地验证，不参与构建
 */
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:4173'
const DEVTOOLS = 'http://127.0.0.1:9222'
const SHOTS = '.tmp/shots'
mkdirSync(SHOTS, { recursive: true })

const tabs = await (await fetch(`${DEVTOOLS}/json`)).json()
const target = tabs.find((t) => t.type === 'page')
if (!target) throw new Error('没有可用的页面 target')

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
  const r = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + expression)
  return r.result.value
}

async function clickText(text) {
  const ok = await evaluate(`(() => {
    const els = [...document.querySelectorAll('button, a')]
    const exact = els.find(e => e.textContent.trim() === ${JSON.stringify(text)})
    const el = exact || els.find(e => e.textContent.trim().includes(${JSON.stringify(text)}))
    if (!el) return 'MISS'
    el.click()
    return exact ? 'OK' : 'FUZZY:' + el.textContent.trim()
  })()`)
  console.log(`  click「${text}」→ ${ok}`)
  if (ok === 'MISS') throw new Error(`找不到可点击元素：${text}`)
  await sleep(320)
}

async function clickStar() {
  const ok = await evaluate(`(() => {
    const btn = document.querySelector('.quiz-top .icon-btn[title="星标"], .quiz-top .icon-btn[title="取消星标"]')
    if (!btn) return 'MISS'
    btn.click(); return 'OK'
  })()`)
  console.log(`  click 星标 → ${ok}`)
  if (ok === 'MISS') throw new Error('找不到星标按钮')
  await sleep(280)
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(r.data, 'base64'))
}

const errors = []
await send('Runtime.enable')
await send('Page.enable')
await send('Log.enable')
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text)
  if (m.method === 'Runtime.exceptionThrown')
    errors.push(m.params.exceptionDetails.exception?.description ?? 'exception')
})

await send('Emulation.setDeviceMetricsOverride', {
  width: 412,
  height: 880,
  deviceScaleFactor: 2,
  mobile: true,
})

console.log('\n[准备] 种入 3 题会话（单选 / 手撕 / 简答）')
await send('Page.navigate', { url: `${BASE}/` })
await sleep(1200)
await evaluate(`(() => {
  localStorage.clear()
  const session = {
    id: 'e2e', mode: 'bank', label: 'E2E 测试',
    qids: ['q-js-001', 'q-code-007', 'q-short-001'],
    index: 0, results: [], startedAt: Date.now(),
  }
  localStorage.setItem('feq.session', JSON.stringify(session))
  return 'seeded'
})()`)
await send('Page.navigate', { url: `${BASE}/#/quiz` })
await sleep(400)
await send('Page.reload')
await sleep(1500)
await shot('01-question-single')

console.log('\n[1] 单选题：点选即判分')
await evaluate(`document.querySelectorAll('.option')[1].click()`)
await sleep(300)
const judged = await evaluate(
  `document.querySelector('.verdict-text b')?.textContent.trim() ?? 'NO-VERDICT'`,
)
console.log(`  verdict: ${judged}`)
await shot('02-single-judged')

console.log('\n[2] 判分后：加入复习 + 星标 + 笔记')
await clickText('加入复习')
await clickStar()
await clickText('写笔记')
await evaluate(`(() => {
  const t = document.querySelector('.note-box textarea')
  t.value = 'typeof null 是历史遗留 bug'
  t.dispatchEvent(new Event('input', { bubbles: true }))
  t.dispatchEvent(new Event('blur'))
  return 'typed'
})()`)
await sleep(200)
const marks = await evaluate(`(() => {
  const review = JSON.parse(localStorage.getItem('feq.review') || '{}')
  const meta = JSON.parse(localStorage.getItem('feq.meta') || '{}')
  return { inReview: Object.keys(review), stars: Object.keys(meta.stars || {}), notes: Object.keys(meta.notes || {}) }
})()`)
console.log('  ', JSON.stringify(marks))

console.log('\n[3] 下一题 → 手撕题')
await clickText('下一题')
await shot('03-code-question')
await evaluate(`document.querySelectorAll('.panel-head')[0].click()`)
await shot('04-code-solution')
await clickText('掌握')

console.log('\n[4] 下一题 → 简答题')
await clickText('下一题')
await evaluate(`document.querySelector('textarea').value = '我的自答内容'`)
await clickText('看答题要点')
await shot('05-short-points')
await clickText('掌握')

console.log('\n[5] 完成本轮 → 结算页')
await clickText('完成本轮')
await sleep(400)
const result = await evaluate(`(() => ({
  path: location.hash,
  rate: document.querySelector('.ring-inner b')?.textContent ?? '',
  body: document.body.innerText.slice(0, 120),
}))()`)
console.log('  ', JSON.stringify(result))
await shot('06-result')

console.log('\n[6] 数据落盘检查')
const stored = await evaluate(`(() => {
  const records = JSON.parse(localStorage.getItem('feq.records') || '[]')
  const review = JSON.parse(localStorage.getItem('feq.review') || '{}')
  return {
    records: records.length,
    correct: records.filter(r => r.correct).length,
    review: Object.entries(review).map(([k, v]) => k + ':stage' + v.stage),
  }
})()`)
console.log('  ', JSON.stringify(stored))

console.log('\n[7] 刷新后数据保持')
await send('Page.reload')
await sleep(1500)
const afterReload = await evaluate(`(() => ({
  hash: location.hash,
  records: JSON.parse(localStorage.getItem('feq.records') || '[]').length,
  hasNav: Boolean(document.querySelector('.nav')),
}))()`)
console.log('  ', JSON.stringify(afterReload))

console.log('\n[8] 题库页：编辑题目')
await send('Page.navigate', { url: `${BASE}/#/bank` })
await sleep(900)
await evaluate(`document.querySelectorAll('.q-row')[0].click()`)
await sleep(400)
await clickText('编辑此题')
await sleep(300)
await sleep(400)
const dialogOpen = await evaluate(`Boolean(document.querySelector('.dialog'))`)
console.log('  编辑弹层打开：', dialogOpen)
await evaluate(`(() => {
  const area = document.querySelector('.dialog textarea')
  area.value = 'E2E 改写后的题干'
  area.dispatchEvent(new Event('input', { bubbles: true }))
  return 'typed'
})()`)
await clickText('保存')
const edited = await evaluate(`(() => {
  const edits = JSON.parse(localStorage.getItem('feq.edits') || '{}')
  const first = document.querySelector('.q-title')?.textContent
  return { keys: Object.keys(edits), firstRow: first }
})()`)
console.log('  ', JSON.stringify(edited))

console.log('\n[9] 快速 5 题')
await send('Page.navigate', { url: `${BASE}/#/` })
await sleep(800)
await clickText('快速 5 题')
await sleep(500)
const quick = await evaluate(`(() => {
  const s = JSON.parse(localStorage.getItem('feq.session') || 'null')
  return { hash: location.hash, label: s?.label, count: s?.qids.length, mode: s?.mode }
})()`)
console.log('  ', JSON.stringify(quick))

console.log('\n[10] 专项训练按钮')
await send('Page.navigate', { url: `${BASE}/#/bank` })
await sleep(800)
const tagBtn = await evaluate(`(() => {
  const btn = document.querySelector('.quick-row .chip')
  if (!btn) return 'MISS'
  const label = btn.textContent.trim()
  btn.click()
  return label
})()`)
await sleep(500)
const tagSession = await evaluate(`(() => {
  const s = JSON.parse(localStorage.getItem('feq.session') || 'null')
  return { clicked: ${JSON.stringify('')}, hash: location.hash, label: s?.label, mode: s?.mode, count: s?.qids.length }
})()`)
console.log('  点击：', tagBtn, JSON.stringify(tagSession))

console.log('\n控制台错误：', errors.length ? errors : '无')
ws.close()
process.exit(0)
