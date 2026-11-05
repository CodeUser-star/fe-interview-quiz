/**
 * 阶段一自检：题库配比 + 复习队列规则 + 判分/统计口径
 * 用 esbuild 打包后以 Node 运行（脚本不参与生产构建）
 */
const mem = new Map<string, string>()
;(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
}

import { createPinia, setActivePinia } from 'pinia'
import { SEED_QUESTIONS } from '../src/data/questions'
import { validateQuestionList } from '../src/lib/validate'
import { analyzeStage, pickProgressive } from '../src/lib/pick'
import { renderMarkdown } from '../src/lib/md'
import { useBankStore } from '../src/stores/bank'
import { useProgressStore } from '../src/stores/progress'
import { DAY } from '../src/lib/dates'

let failed = 0
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) {
    console.log(`  ok   ${name}`)
  } else {
    failed += 1
    console.log(`  FAIL ${name} ${extra}`)
  }
}

setActivePinia(createPinia())

// ---------- 1. 题库配比 ----------
console.log('\n[1] 样张题库配比')
const bank = useBankStore()
const qs = bank.questions
check('总题量 40', qs.length === 40, `实际 ${qs.length}`)

const bySubject: Record<string, number> = {}
const byType: Record<string, number> = {}
for (const q of qs) {
  bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1
  byType[q.type] = (byType[q.type] ?? 0) + 1
}
const basic = qs.filter((q) => ['single', 'multi', 'judge'].includes(q.type))
check('基础题 20', basic.length === 20, `实际 ${basic.length}`)
check('简答 10', (byType.short ?? 0) === 10, `实际 ${byType.short ?? 0}`)
check('手撕 10', (byType.code ?? 0) === 10, `实际 ${byType.code ?? 0}`)

for (const [s, n] of Object.entries({ js: 6, css: 4, vue: 4, browser: 3, network: 3 })) {
  const actual = basic.filter((q) => q.subject === s).length
  check(`基础 · ${s} ${n} 题`, actual === n, `实际 ${actual}`)
}
const algoCode = qs.filter((q) => q.type === 'code' && q.subject === 'algo').length
const jsCode = qs.filter((q) => q.type === 'code' && q.subject === 'js').length
check('手撕 · 算法 6', algoCode === 6, `实际 ${algoCode}`)
check('手撕 · JS 手写 4', jsCode === 4, `实际 ${jsCode}`)

const ids = new Set(qs.map((q) => q.id))
check('题目 id 唯一', ids.size === qs.length)
check('全部题目通过 Schema 校验', validateQuestionList(qs).ok)

// ---------- 2. 判分与复习队列 ----------
console.log('\n[2] 复习队列规则')
const progress = useProgressStore()
const NOW = Date.now()
const near = (a: number, b: number) => Math.abs(a - b) < 5000

const qid = 'q-js-001'
check('初始不在队列', !progress.isInReview(qid))
progress.enqueue(qid)
check('手动入队后当天到期', progress.dueCount === 1)

// 答对一次：stage0 -> 1，下次 3 天后
progress.applyReview(qid, true)
check('答对推进到第 2 间隔（3 天）', near(progress.review[qid].dueAt, NOW + 3 * DAY), `实际 ${progress.review[qid].dueAt - NOW}`)
check('当天不再待复习', progress.dueCount === 0)

// 答错重置
progress.applyReview(qid, false)
check('答错重置 stage=0', progress.review[qid].stage === 0)
check('答错后 1 天重现', near(progress.review[qid].dueAt, NOW + DAY))

// 连续答对走完 5 个间隔出队（1/3/7/15/30 全部通过）
for (let i = 0; i < 5; i++) progress.applyReview(qid, true)
check('连续答对 5 次后出队', !progress.isInReview(qid), `stage=${progress.review[qid]?.stage}`)

// 自动入队：答错题
progress.applyReview('q-css-001', false)
check('答错自动入队', progress.isInReview('q-css-001'))

// 错因
progress.setWrongReason('q-css-001', 'careless')
check('错因可标记', progress.review['q-css-001'].wrongReason === 'careless')

// ---------- 3. 统计口径 ----------
console.log('\n[3] 统计与打卡')
progress.addRecord('q-js-001', true, false)
progress.addRecord('q-js-002', false, false)
progress.addRecord('q-short-001', true, true)
check('总答题 3 次', progress.records.length === 3)
check('正确率 2/3', Math.abs(progress.accuracy - 2 / 3) < 1e-9, `实际 ${progress.accuracy}`)
check('今日答题数 3', progress.todayCount === 3)

progress.enqueue('q-js-003')
check('队列未清时不能打卡', progress.markCheckinIfDone(3) === false)
progress.dequeue('q-js-003')
check('队列清零且达标后可打卡', progress.markCheckinIfDone(3) === true)
check('打卡记录已写入', Boolean(progress.checkins[progress.today]))

// ---------- 4. 题库编辑 ----------
console.log('\n[4] 题目编辑与导入校验')
const original = bank.byId['q-js-001'].title
bank.updateQuestion('q-js-001', { title: '改写后的题干' })
check('内置题可编辑', bank.byId['q-js-001'].title === '改写后的题干')
check('内置原始数据未被污染', SEED_QUESTIONS[0].title === original)
bank.resetEdit('q-js-001')
check('可还原内置原题', bank.byId['q-js-001'].title === original)

const bad = validateQuestionList([{ id: '', type: 'single', subject: 'js' }])
check('非法题目被拒绝', bad.ok === false && bad.errors.length > 0)

const good = validateQuestionList([
  {
    id: 'q-test-1',
    type: 'single',
    subject: 'js',
    difficulty: 1,
    tags: [],
    title: 'x',
    options: ['a', 'b'],
    answer: [9],
    analysis: 'y',
  },
])
check('越界答案被拒绝', good.ok === false)

// ---------- 5. 渐进式抽题 ----------
console.log('\n[5] 渐进式抽题')
const all = bank.questions
const diffOf = (id: string) => bank.byId[id].difficulty
const easyIds = all.filter((q) => q.difficulty === 1).map((q) => q.id)
const mediumIds = all.filter((q) => q.difficulty === 2).map((q) => q.id)

const noneMastered = () => false
const p1 = pickProgressive({ questions: all, isMastered: noneMastered })
check('全新用户从简单开始', p1.stage === 1, `stage=${p1.stage}`)
check('首轮只抽简单题', p1.qids.every((id) => diffOf(id) === 1))
check('首轮覆盖该层全部', p1.qids.length === p1.total, `${p1.qids.length}/${p1.total}`)

// 简单层掌握 80% 以上 → 进入中等
const masteredEasy = new Set(easyIds.slice(0, Math.ceil(easyIds.length * 0.8)))
const easyMostlyMastered = (id: string) => masteredEasy.has(id)
const stageAfterEasy = analyzeStage(all, easyMostlyMastered)
check('简单基本掌握后进入中等', stageAfterEasy.stage === 2, `stage=${stageAfterEasy.stage}`)
const p2 = pickProgressive({ questions: all, isMastered: easyMostlyMastered })
check('中等阶段不再抽简单题', p2.qids.every((id) => diffOf(id) === 2))

// 简单未达标（只掌握 50%）→ 仍在简单层
const halfEasy = new Set(easyIds.slice(0, Math.floor(easyIds.length / 2)))
const easyHalf = (id: string) => halfEasy.has(id)
check('简单未达标时不越级', analyzeStage(all, easyHalf).stage === 1)

// limit 生效，且优先给未掌握的题（该层未达标，仍留在简单层）
const p3 = pickProgressive({ questions: all, isMastered: easyHalf, limit: 5 })
check('limit 生效', p3.qids.length === 5, `实际 ${p3.qids.length}`)
check('limit 内仍为当前层', p3.qids.every((id) => diffOf(id) === 1), p3.qids.map(diffOf).join(''))
// 未掌握的题必须排在前面，掌握过的只用来补足数量
const unmasteredEasy = easyIds.filter((id) => !halfEasy.has(id))
check(
  '未掌握的题排在前面',
  p3.qids.slice(0, unmasteredEasy.length).every((id) => !halfEasy.has(id)),
)

// 该层全掌握后，跨层补题仍保持难度升序
const allEasyMastered = (id: string) => easyIds.includes(id)
const p4 = pickProgressive({ questions: all, isMastered: allEasyMastered, limit: 999 })
const levels = p4.qids.map(diffOf)
check(
  '跨层补题保持难度升序',
  levels.every((v, i) => i === 0 || v >= levels[i - 1]),
  levels.join(''),
)

// 三层全掌握 → 停在困难层
check('全部掌握后停在困难层', analyzeStage(all, () => true).stage === 3)
check('中等题池统计正确', mediumIds.length > 0)

// ---------- 6. 手撕参考答案的注释 ----------
console.log('\n[6] 手撕参考答案注释')
const codeQs = all.filter((q) => q.type === 'code')
check('手撕题共 10 道', codeQs.length === 10, `实际 ${codeQs.length}`)
for (const q of codeQs) {
  const comments = (q.analysis.match(/\/\/ /g) ?? []).length
  check(`${q.id} 含关键注释`, comments >= 3, `注释 ${comments} 处`)
}
check(
  '注释能被高亮成 hljs-comment',
  renderMarkdown(codeQs[0].analysis).includes('hljs-comment'),
)
const levelCount = { 1: 0, 2: 0, 3: 0 }
for (const q of all) levelCount[q.difficulty] += 1
check('简单题够撑起第一阶段', levelCount[1] >= 8, `简单 ${levelCount[1]} 题`)

console.log(failed === 0 ? '\n全部通过\n' : `\n${failed} 项失败\n`)
process.exit(failed === 0 ? 0 : 1)