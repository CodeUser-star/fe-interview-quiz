import { ref, watch } from 'vue'
import type { AnswerRecord, Checkins, Meta, Question, ReviewItem } from '../types'
import { useBankStore } from '../stores/bank'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'

/**
 * WebDAV 同步（坚果云）
 * - 打开应用时拉取一次，本地变动后防抖推送
 * - 记录级 last-write-wins 合并：作答记录按 (qid, ts) 求并集，复习项/星标/打卡按各自时间戳取新
 * - 统计全部由合并后的 records 重算，不做数值合并
 * - 失败静默重试，绝不影响本地数据
 */

export interface SyncProgressPayload {
  records?: AnswerRecord[]
  review?: Record<string, ReviewItem>
  meta?: Meta
  checkins?: Checkins
}

export interface SyncPayload {
  app: 'fe-interview-quiz'
  version: 1
  updatedAt: number
  bank: { edits: Record<string, Partial<Question>>; custom: Question[] }
  progress: SyncProgressPayload
}

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'ok' | 'error'

export const syncStatus = ref<SyncStatus>('off')
export const lastSyncAt = ref(0)
export const lastError = ref('')

const FILE_DIR = 'fe-interview-quiz'
const FILE_NAME = 'backup.json'
const PUSH_DEBOUNCE = 3000
const RETRY_DELAY = 30_000

let applying = false // 正在写入合并结果，避免触发推送循环
let skipPushOnce = false // 合并写回引发的 watcher，跳过一次推送
let inFlight = false // 同步互斥，避免防抖推送与手动同步交错 PUT
let pushTimer: ReturnType<typeof setTimeout> | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null

// ---------- 合并（纯函数，可测试） ----------

function recordKey(r: AnswerRecord): string {
  return `${r.qid}|${r.ts}|${r.correct ? 1 : 0}`
}

function reviewActivity(item: ReviewItem): number {
  // 优先用显式 updatedAt；旧数据退化为 addedAt / dueAt 的较大值
  return item.updatedAt ?? Math.max(item.dueAt, item.addedAt)
}

/** 记录级 LWW 合并本地与远端的进度数据 */
export function mergeProgress(
  local: SyncProgressPayload,
  remote: SyncProgressPayload,
): Required<SyncProgressPayload> {
  // 作答记录：按 (qid, ts, correct) 去重求并集，按时间排序
  const seen = new Set<string>()
  const records: AnswerRecord[] = []
  for (const r of [...(remote.records ?? []), ...(local.records ?? [])]) {
    const k = recordKey(r)
    if (seen.has(k)) continue
    seen.add(k)
    records.push(r)
  }
  records.sort((a, b) => a.ts - b.ts)

  // 复习队列：同 qid 取活动时间较新的一项
  const review: Record<string, ReviewItem> = { ...(remote.review ?? {}) }
  for (const [qid, item] of Object.entries(local.review ?? {})) {
    const old = review[qid]
    if (!old || reviewActivity(item) >= reviewActivity(old)) review[qid] = item
  }

  // 星标 / 打卡：值即时间戳，逐键取大者
  const stars: Record<string, number> = { ...(remote.meta?.stars ?? {}) }
  for (const [qid, ts] of Object.entries(local.meta?.stars ?? {})) {
    if (!stars[qid] || ts > stars[qid]) stars[qid] = ts
  }
  const checkins: Checkins = { ...(remote.checkins ?? {}) }
  for (const [day, ts] of Object.entries(local.checkins ?? {})) {
    if (!checkins[day] || ts > checkins[day]) checkins[day] = ts
  }

  // 笔记按 noteTs 逐键 LWW；旧数据无时间戳时本地优先（视为刚编辑过）
  const localTs = local.meta?.noteTs ?? {}
  const remoteTs = remote.meta?.noteTs ?? {}
  const notes: Record<string, string> = { ...(remote.meta?.notes ?? {}) }
  const noteTs: Record<string, number> = { ...remoteTs }
  for (const [qid, text] of Object.entries(local.meta?.notes ?? {})) {
    const lt = localTs[qid] ?? Number.MAX_SAFE_INTEGER // 本地无 ts 视为最新（兼容旧数据）
    const rt = remoteTs[qid] ?? 0
    if (lt >= rt) {
      notes[qid] = text
      if (localTs[qid]) noteTs[qid] = localTs[qid]
    }
  }

  return { records, review, meta: { stars, notes, noteTs }, checkins }
}

/** 自定义题按 id 求并集，冲突时本地优先（本地是最近编辑方） */
export function mergeCustom(local: Question[], remote: Question[]): Question[] {
  const map = new Map<string, Question>()
  for (const q of remote) map.set(q.id, q)
  for (const q of local) map.set(q.id, q)
  return [...map.values()]
}

// ---------- WebDAV 传输 ----------

function endpoint(url: string): { fileUrl: string; dirUrl: string } {
  return { fileUrl: `${url}/${FILE_DIR}/${FILE_NAME}`, dirUrl: `${url}/${FILE_DIR}` }
}

function authHeader(user: string, pass: string): string {
  return `Basic ${btoa(`${user}:${pass}`)}`
}

let dirReady = false // 目录建过一次就不再请求，省坚果云配额

async function ensureDir(dirUrl: string, auth: string): Promise<void> {
  if (dirReady) return
  // 201 新建 / 405 已存在都算成功；部分服务端要求集合路径带末尾斜杠，失败再用斜杠形式试一次
  const okStatus = (r: Response | null) =>
    !!r && (r.status === 201 || r.status === 200 || r.status === 204 || r.status === 405)
  const mkcol = (u: string) =>
    fetch(u, { method: 'MKCOL', headers: { Authorization: auth } }).catch(() => null)

  if (okStatus(await mkcol(dirUrl))) dirReady = true
  else if (okStatus(await mkcol(`${dirUrl}/`))) dirReady = true
}

async function remoteGet(fileUrl: string, auth: string): Promise<SyncPayload | null> {
  const res = await fetch(fileUrl, { headers: { Authorization: auth } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET ${res.status}`)
  return (await res.json()) as SyncPayload
}

async function remotePut(fileUrl: string, auth: string, payload: SyncPayload): Promise<void> {
  const res = await fetch(fileUrl, {
    method: 'PUT',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`PUT ${res.status}`)
}

// ---------- 编排 ----------

function localPayload(): SyncPayload {
  const bank = useBankStore()
  const progress = useProgressStore()
  return {
    app: 'fe-interview-quiz',
    version: 1,
    updatedAt: Date.now(),
    bank: { edits: bank.edits, custom: bank.custom },
    progress: progress.exportPayload(),
  }
}

function configured(): { url: string; auth: string } | null {
  const settings = useSettingsStore()
  if (!settings.syncUrl) return null
  return { url: settings.syncUrl, auth: authHeader(settings.syncUser, settings.syncPass) }
}

/** 连接测试：区分鉴权失败与浏览器跨域拦截，便于排查配置 */
export async function testConnection(
  url: string,
  user: string,
  pass: string,
): Promise<{ ok: boolean; message: string }> {
  const target = url.trim().replace(/\/+$/, '')
  if (!target) return { ok: false, message: '请先填写服务器地址' }
  const { fileUrl, dirUrl } = endpoint(target)
  const auth = authHeader(user, pass)
  try {
    const dir = await fetch(dirUrl, { method: 'MKCOL', headers: { Authorization: auth } })
    if (dir.status === 401 || dir.status === 403) {
      return { ok: false, message: '账号或应用密码不正确（坚果云需用「应用密码」而非登录密码）' }
    }
    const probe = await fetch(fileUrl, { headers: { Authorization: auth } })
    if (probe.status === 401 || probe.status === 403) {
      return { ok: false, message: '鉴权失败：账号或应用密码不正确' }
    }
    if (!probe.ok && probe.status !== 404) {
      return { ok: false, message: `服务器返回 ${probe.status}，请检查地址是否指向 WebDAV 根目录` }
    }
    return {
      ok: true,
      message: probe.status === 404 ? '连接成功，云端暂无备份（首次同步会上传）' : '连接成功，已找到云端备份',
    }
  } catch {
    return {
      ok: false,
      message:
        '浏览器被跨域（CORS）拦截：目标服务未开放 Access-Control-Allow-Origin。坚果云官方 DAV 不支持浏览器直连，请改填代理地址。',
    }
  }
}

/** 完整同步：拉远端 → 合并写回本地 → 把合并结果推回远端 */
export async function syncNow(): Promise<boolean> {
  const cfg = configured()
  if (!cfg) {
    syncStatus.value = 'off'
    return false
  }
  if (inFlight) return false // 已有同步在进行，直接跳过，由本轮结果覆盖
  inFlight = true
  const { fileUrl, dirUrl } = endpoint(cfg.url)
  syncStatus.value = 'syncing'
  try {
    await ensureDir(dirUrl, cfg.auth)
    const remote = await remoteGet(fileUrl, cfg.auth)
    if (remote && remote.app === 'fe-interview-quiz') {
      const bank = useBankStore()
      const progress = useProgressStore()
      const merged = mergeProgress(progress.exportPayload(), remote.progress ?? {})
      applying = true
      try {
        progress.importPayload(merged)
        bank.custom = mergeCustom(bank.custom, remote.bank?.custom ?? [])
        // 内置题改动：远端有而本地没有的改动补进来，冲突保留本地
        for (const [id, patch] of Object.entries(remote.bank?.edits ?? {})) {
          if (!bank.edits[id]) bank.edits = { ...bank.edits, [id]: patch }
        }
      } finally {
        applying = false
        skipPushOnce = true // 合并写回本身就是同步结果，不再回推一次
      }
    }
    await remotePut(fileUrl, cfg.auth, localPayload())
    syncStatus.value = 'ok'
    lastSyncAt.value = Date.now()
    lastError.value = ''
    return true
  } catch (e) {
    syncStatus.value = 'error'
    const raw = e instanceof Error ? e.message : String(e)
    lastError.value =
      raw === 'Failed to fetch' || e instanceof TypeError
        ? '跨域被拦截（CORS）：坚果云官方 DAV 不支持浏览器直连，请填写代理地址'
        : raw
    console.warn('[sync]', e)
    scheduleRetry()
    return false
  } finally {
    inFlight = false
  }
}

/** 防抖推送：本地变动后 3 秒同步一次 */
export function schedulePush(): void {
  if (!configured()) return
  if (skipPushOnce) {
    skipPushOnce = false
    return
  }
  if (applying) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void syncNow()
  }, PUSH_DEBOUNCE)
}

function scheduleRetry(): void {
  if (retryTimer) return
  retryTimer = setTimeout(() => {
    retryTimer = null
    void syncNow()
  }, RETRY_DELAY)
}

/** 启动同步：拉取一次 + 监听所有数据变动自动推送。可重复调用（幂等） */
let started = false
export function setupSync(): void {
  const settings = useSettingsStore()
  if (!settings.syncUrl || started) return
  started = true
  const bank = useBankStore()
  const progress = useProgressStore()
  watch(
    [
      () => progress.records,
      () => progress.review,
      () => progress.meta,
      () => progress.checkins,
      () => bank.edits,
      () => bank.custom,
    ],
    () => schedulePush(),
    { deep: true },
  )
  void syncNow()
}
