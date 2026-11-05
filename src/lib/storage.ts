import { ref } from 'vue'

/** 持久化异常强提示（存储写满 / JSON 损坏） */
export const storageError = ref('')

export const KEYS = {
  settings: 'feq.settings',
  edits: 'feq.edits',
  custom: 'feq.custom',
  records: 'feq.records',
  review: 'feq.review',
  meta: 'feq.meta',
  session: 'feq.session',
  checkins: 'feq.checkins',
} as const

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch (e) {
    storageError.value = `本地数据读取失败（${key}），已使用默认值。原始数据未被覆盖。`
    console.error('[storage:read]', key, e)
    return fallback
  }
}

export function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    if (storageError.value.startsWith('本地存储写入失败')) storageError.value = ''
  } catch (e) {
    storageError.value = '本地存储写入失败，可能是空间已满。请到「设置 → 数据」导出 JSON 备份。'
    console.error('[storage:write]', key, e)
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error('[storage:remove]', key, e)
  }
}
