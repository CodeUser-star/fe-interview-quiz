export const DAY = 86_400_000

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** YYYY-MM-DD（本地时区） */
export function ymd(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDays(ts: number, days: number): number {
  const d = new Date(ts)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

/** 逾期天数：0 表示今天到期，1 表示逾期 1 天 */
export function overdueDays(dueAt: number, now = Date.now()): number {
  return Math.floor((startOfDay(now) - startOfDay(dueAt)) / DAY)
}

export function formatShort(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
