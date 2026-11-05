import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { AnswerRecord, Meta, ReviewItem, WrongReason } from '../types'
import { DAY, startOfDay, ymd } from '../lib/dates'
import { KEYS, read, write } from '../lib/storage'

/** 遗忘曲线间隔（天）：1 / 3 / 7 / 15 / 30 */
export const INTERVALS = [1, 3, 7, 15, 30]

export const useProgressStore = defineStore('progress', () => {
  const records = ref<AnswerRecord[]>(read(KEYS.records, []))
  const review = ref<Record<string, ReviewItem>>(read(KEYS.review, {}))
  const meta = ref<Meta>(read(KEYS.meta, { stars: {}, notes: {} }))
  const checkins = ref<Record<string, number>>(read(KEYS.checkins, {}))

  watch(records, (v) => write(KEYS.records, v), { deep: true })
  watch(review, (v) => write(KEYS.review, v), { deep: true })
  watch(meta, (v) => write(KEYS.meta, v), { deep: true })
  watch(checkins, (v) => write(KEYS.checkins, v), { deep: true })

  // ---------- 作答 ----------
  function addRecord(qid: string, correct: boolean, self: boolean): void {
    records.value = [...records.value, { qid, ts: Date.now(), correct, self }]
  }

  /** 答对推进一个间隔，答错重置并重新入队；走完 5 个间隔出队 */
  function applyReview(qid: string, correct: boolean): void {
    const now = Date.now()
    const item = review.value[qid]
    if (!correct) {
      review.value = {
        ...review.value,
        [qid]: {
          qid,
          stage: 0,
          dueAt: now + INTERVALS[0] * DAY,
          addedAt: item?.addedAt ?? now,
        },
      }
      return
    }
    if (!item) return
    const stage = item.stage + 1
    if (stage >= INTERVALS.length) {
      const next = { ...review.value }
      delete next[qid]
      review.value = next
      return
    }
    review.value = {
      ...review.value,
      [qid]: { ...item, stage, dueAt: now + INTERVALS[stage] * DAY },
    }
  }

  /** 答题页手动入队（覆盖「答对了但没把握」），当天即可复习 */
  function enqueue(qid: string): void {
    if (review.value[qid]) return
    const now = Date.now()
    review.value = { ...review.value, [qid]: { qid, stage: 0, dueAt: now, addedAt: now } }
  }

  function dequeue(qid: string): void {
    const next = { ...review.value }
    delete next[qid]
    review.value = next
  }

  function setWrongReason(qid: string, reason: WrongReason): void {
    const item = review.value[qid]
    if (!item) return
    review.value = { ...review.value, [qid]: { ...item, wrongReason: reason } }
  }

  function isInReview(qid: string): boolean {
    return Boolean(review.value[qid])
  }

  // ---------- 星标 / 笔记 ----------
  function toggleStar(qid: string): void {
    const next = { ...meta.value, stars: { ...meta.value.stars } }
    if (next.stars[qid]) delete next.stars[qid]
    else next.stars[qid] = Date.now()
    meta.value = next
  }

  function setNote(qid: string, text: string): void {
    const next = { ...meta.value, notes: { ...meta.value.notes } }
    if (text.trim()) next.notes[qid] = text
    else delete next.notes[qid]
    meta.value = next
  }

  // ---------- 复习队列 ----------
  const reviewItems = computed(() => Object.values(review.value))

  function dueItems(now = Date.now()): ReviewItem[] {
    const tomorrow = startOfDay(now) + DAY
    return reviewItems.value
      .filter((i) => i.dueAt < tomorrow)
      .sort((a, b) => a.dueAt - b.dueAt)
  }

  const dueCount = computed(() => dueItems().length)

  // ---------- 今日统计 ----------
  const today = computed(() => ymd(Date.now()))

  const todayCount = computed(
    () => records.value.filter((r) => ymd(r.ts) === today.value).length,
  )

  const todayCorrect = computed(() => {
    const list = records.value.filter((r) => ymd(r.ts) === today.value)
    return list.filter((r) => r.correct).length
  })

  const checkedInToday = computed(() => Boolean(checkins.value[today.value]))

  /** 连续打卡天数（不补卡，断一天即归零） */
  const streak = computed(() => {
    let n = 0
    let cursor = Date.now()
    if (!checkins.value[ymd(cursor)]) cursor -= DAY
    while (checkins.value[ymd(cursor)]) {
      n += 1
      cursor -= DAY
    }
    return n
  })

  function markCheckinIfDone(goal: number): boolean {
    if (checkedInToday.value) return true
    if (todayCount.value < goal) return false
    if (dueCount.value > 0) return false
    checkins.value = { ...checkins.value, [today.value]: Date.now() }
    return true
  }

  // ---------- 累计统计 ----------
  /** 正确率 =（自动判对 + 自判掌握）÷ 总答题次数 */
  const accuracy = computed(() => {
    if (!records.value.length) return 0
    return records.value.filter((r) => r.correct).length / records.value.length
  })

  const dailyStats = computed(() => {
    const map = new Map<string, { total: number; correct: number }>()
    for (const r of records.value) {
      const key = ymd(r.ts)
      const cur = map.get(key) ?? { total: 0, correct: 0 }
      cur.total += 1
      if (r.correct) cur.correct += 1
      map.set(key, cur)
    }
    return map
  })

  /** 最近 30 天每日做题量（含今天，按时间正序） */
  const last30Days = computed(() => {
    const out: { date: string; total: number; correct: number }[] = []
    const base = startOfDay(Date.now())
    for (let i = 29; i >= 0; i--) {
      const ts = base - i * DAY
      const key = ymd(ts)
      const s = dailyStats.value.get(key) ?? { total: 0, correct: 0 }
      out.push({ date: key, total: s.total, correct: s.correct })
    }
    return out
  })

  const doneSet = computed(() => new Set(records.value.map((r) => r.qid)))

  /** 每题最近一次作答结果（records 按时间追加，后者覆盖前者） */
  const lastResult = computed(() => {
    const map: Record<string, boolean> = {}
    for (const r of records.value) map[r.qid] = r.correct
    return map
  })

  /**
   * 「掌握」判据：最近一次答对，且当前不在复习队列。
   * 答错会自动入队、手动入队代表「没把握」，两种情况都不算掌握。
   */
  function isMastered(qid: string): boolean {
    if (lastResult.value[qid] !== true) return false
    const item = review.value[qid]
    return !item || item.stage > 0
  }

  function reset(): void {
    records.value = []
    review.value = {}
    meta.value = { stars: {}, notes: {} }
    checkins.value = {}
  }

  function exportPayload() {
    return {
      records: records.value,
      review: review.value,
      meta: meta.value,
      checkins: checkins.value,
    }
  }

  function importPayload(p: {
    records?: AnswerRecord[]
    review?: Record<string, ReviewItem>
    meta?: Meta
    checkins?: Record<string, number>
  }): void {
    if (Array.isArray(p.records)) records.value = p.records
    if (p.review && typeof p.review === 'object') review.value = p.review
    if (p.meta && typeof p.meta === 'object')
      meta.value = { stars: p.meta.stars ?? {}, notes: p.meta.notes ?? {} }
    if (p.checkins && typeof p.checkins === 'object') checkins.value = p.checkins
  }

  return {
    records,
    review,
    meta,
    checkins,
    reviewItems,
    dueItems,
    dueCount,
    today,
    todayCount,
    todayCorrect,
    checkedInToday,
    streak,
    accuracy,
    dailyStats,
    last30Days,
    doneSet,
    lastResult,
    isMastered,
    addRecord,
    applyReview,
    enqueue,
    dequeue,
    setWrongReason,
    isInReview,
    toggleStar,
    setNote,
    markCheckinIfDone,
    reset,
    exportPayload,
    importPayload,
  }
})
