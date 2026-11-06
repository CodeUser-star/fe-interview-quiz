<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Question, ThemeMode } from '../types'
import { SUBJECT_NAME, TYPE_NAME } from '../types'
import { plain } from '../lib/text'
import { useBankStore } from '../stores/bank'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { validateQuestionList } from '../lib/validate'
import { lastError, lastSyncAt, setupSync, syncNow, syncStatus } from '../lib/sync'
import { toast } from '../lib/toast'
import AppIcon from '../components/AppIcon.vue'
import EditQuestionDialog from '../components/EditQuestionDialog.vue'
import AddQuestionDialog from '../components/AddQuestionDialog.vue'

const bank = useBankStore()
const settings = useSettingsStore()
const progress = useProgressStore()

const editing = ref<Question | null>(null)
const adding = ref(false)
const message = ref('')
const messageKind = ref<'ok' | 'bad'>('ok')

const backupInput = ref<HTMLInputElement | null>(null)
const bankInput = ref<HTMLInputElement | null>(null)

const themes: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: '跟随系统' },
  { key: 'dark', label: '深色' },
  { key: 'light', label: '浅色' },
]

function notify(text: string, kind: 'ok' | 'bad' = 'ok'): void {
  message.value = text
  messageKind.value = kind
  window.setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 4000)
}

function exportBackup(): void {
  const data = {
    app: 'fe-interview-quiz',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: { theme: settings.theme, dailyGoal: settings.dailyGoal },
    bank: { edits: bank.edits, custom: bank.custom },
    progress: progress.exportPayload(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `前端刷题备份-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  notify('已导出备份 JSON')
}

async function pickFile(kind: 'backup' | 'bank', event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    notify('JSON 解析失败，请检查文件格式', 'bad')
    return
  }

  if (kind === 'bank') {
    const r = validateQuestionList(raw)
    if (!r.questions.length) {
      notify(`题库导入失败：${r.errors.slice(0, 3).join('；')}`, 'bad')
      return
    }
    const res = bank.importQuestions(r.questions)
    notify(`题库导入完成，新增 ${res.added} 题${res.errors.length ? '，部分题目被跳过' : ''}`)
    return
  }

  const data = raw as Record<string, unknown>
  if (data.app !== 'fe-interview-quiz') {
    notify('这不是本应用的备份文件', 'bad')
    return
  }
  const s = data.settings as { theme?: ThemeMode; dailyGoal?: number } | undefined
  if (s?.theme) settings.setTheme(s.theme)
  if (typeof s?.dailyGoal === 'number') settings.setDailyGoal(s.dailyGoal)

  const b = data.bank as
    | { edits?: Record<string, Partial<Question>>; custom?: Question[] }
    | undefined
  if (b?.edits) bank.edits = b.edits
  if (b?.custom) bank.custom = b.custom

  const p = data.progress as Parameters<typeof progress.importPayload>[0] | undefined
  if (p) progress.importPayload(p)

  notify('备份已恢复')
}

function downloadTemplate(): void {
  const sample = [
    {
      id: 'q-custom-001',
      type: 'single',
      subject: 'js',
      difficulty: 1,
      tags: ['must-know'],
      title: '题干（支持 Markdown）',
      options: ['选项 A', '选项 B'],
      answer: [0],
      analysis: '解析',
    },
  ]
  const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '题库模板.json'
  a.click()
  URL.revokeObjectURL(url)
}

function remove(q: Question): void {
  if (!window.confirm(`删除自定义题「${q.id}」？`)) return
  bank.removeCustom(q.id)
}

// ---------- WebDAV 同步 ----------
const syncUrlInput = ref(settings.syncUrl)
const syncUserInput = ref(settings.syncUser)
const syncPassInput = ref(settings.syncPass)

const syncStatusText = computed(() => {
  if (!settings.syncUrl) return '未配置'
  return { off: '未配置', idle: '待同步', syncing: '同步中…', ok: '已同步', error: '同步失败，稍后自动重试' }[
    syncStatus.value
  ]
})

const syncPillStyle = computed(() => ({
  color:
    syncStatus.value === 'error'
      ? 'var(--bad)'
      : syncStatus.value === 'ok'
        ? 'var(--ok)'
        : 'var(--fg-3)',
  background: 'var(--surface-3)',
}))

const lastSyncText = computed(() =>
  lastSyncAt.value ? `上次同步 ${new Date(lastSyncAt.value).toLocaleString()}` : '尚未同步过',
)

function saveSync(): void {
  settings.setSync(syncUrlInput.value, syncUserInput.value, syncPassInput.value)
  setupSync() // 首次配置后立即启动自动同步
  toast('同步配置已保存')
}

async function runSync(): Promise<void> {
  saveSync()
  const ok = await syncNow()
  toast(ok ? '同步完成' : '同步失败，将自动重试', ok ? 'ok' : 'bad')
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">设置</h1>
      <span class="page-sub">v1.2 · 全功能</span>
    </div>

    <div v-if="message" class="banner" :class="messageKind === 'ok' ? 'ok' : ''">
      {{ message }}
    </div>

    <div class="setting-group">
      <h3 class="section-title" style="margin-bottom: 10px">外观</h3>
      <div class="card">
        <div class="setting-row">
          <div class="setting-label">
            <b>主题</b>
            <span>深色 / 浅色，或跟随系统</span>
          </div>
          <div class="seg">
            <button
              v-for="t in themes"
              :key="t.key"
              :class="{ active: settings.theme === t.key }"
              @click="settings.setTheme(t.key)"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <h3 class="section-title" style="margin-bottom: 10px">学习</h3>
      <div class="card">
        <div class="setting-row">
          <div class="setting-label">
            <b>打卡目标</b>
            <span>当日答题数（含复习）达标且复习清零即打卡</span>
          </div>
          <input
            class="num-input"
            type="number"
            min="1"
            max="500"
            :value="settings.dailyGoal"
            @change="settings.setDailyGoal(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
    </div>

    <div class="setting-group">
      <h3 class="section-title" style="margin-bottom: 10px">数据</h3>
      <div class="card">
        <div class="setting-row">
          <div class="setting-label">
            <b>导出备份</b>
            <span>做题记录 / 笔记 / 自定义题 / 设置</span>
          </div>
          <button class="btn btn-sm" @click="exportBackup">
            <AppIcon name="layers" :size="13" />
            导出
          </button>
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <b>导入备份</b>
            <span>覆盖当前做题记录与题库改动</span>
          </div>
          <button class="btn btn-sm" @click="backupInput?.click()">选择文件</button>
          <input
            ref="backupInput"
            type="file"
            accept="application/json,.json"
            hidden
            @change="pickFile('backup', $event)"
          />
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <b>导入题库</b>
            <span>按模板追加题目，格式不合法的条目会被跳过</span>
          </div>
          <div class="btn-row">
            <button class="btn btn-sm btn-ghost" @click="downloadTemplate">模板</button>
            <button class="btn btn-sm" @click="bankInput?.click()">选择文件</button>
          </div>
          <input
            ref="bankInput"
            type="file"
            accept="application/json,.json"
            hidden
            @change="pickFile('bank', $event)"
          />
        </div>
      </div>
    </div>

    <div class="setting-group">
      <h3 class="section-title" style="margin-bottom: 10px">题库管理</h3>
      <div class="card">
        <div class="setting-row" style="border-bottom: 0; padding-bottom: 0">
          <div class="setting-label">
            <b>题库总量</b>
            <span>
              内置 {{ bank.questions.length - bank.custom.length }} 题 · 自定义
              {{ bank.custom.length }} 题
            </span>
          </div>
          <div class="btn-row">
            <span class="muted">共 {{ bank.questions.length }}</span>
            <button class="btn btn-sm" @click="adding = true">
              <AppIcon name="edit" :size="13" />
              手动加题
            </button>
          </div>
        </div>
      </div>

      <div v-if="bank.custom.length" class="q-list" style="margin-top: 10px">
        <div v-for="q in bank.custom" :key="q.id" class="q-row" style="cursor: default">
          <div class="q-body">
            <div class="q-title">{{ plain(q.title, 64) }}</div>
            <div class="q-foot">
              <span class="q-id">{{ q.id }}</span>
              <span>{{ SUBJECT_NAME[q.subject] }}</span>
              <span>{{ TYPE_NAME[q.type] }}</span>
            </div>
          </div>
          <button class="icon-btn" title="编辑" @click="editing = q">
            <AppIcon name="edit" :size="15" />
          </button>
          <button class="icon-btn" title="删除" @click="remove(q)">
            <AppIcon name="trash" :size="15" />
          </button>
        </div>
      </div>

      <p class="muted" style="margin: 10px 0 0">
        任何题目（含内置题）都可以在题库页点开编辑，修改题干 / 答案 / 解析。
      </p>
    </div>

    <div class="setting-group">
      <h3 class="section-title" style="margin-bottom: 10px">同步</h3>
      <div class="card">
        <div class="setting-row">
          <div class="setting-label">
            <b>坚果云 WebDAV</b>
            <span>打开应用自动拉取，本地变动后自动推送；失败静默重试</span>
          </div>
          <span class="pill" :style="syncPillStyle">{{ syncStatusText }}</span>
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <b>服务器地址</b>
            <span>坚果云为 https://dav.jianguoyun.com/dav</span>
          </div>
          <input
            v-model="syncUrlInput"
            class="num-input"
            style="width: 240px"
            placeholder="https://dav.jianguoyun.com/dav"
          />
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <b>账号 / 应用密码</b>
            <span>坚果云「安全选项 → 第三方应用管理」生成应用密码；明文存本机，仅自用</span>
          </div>
          <div class="btn-row">
            <input v-model="syncUserInput" class="num-input" style="width: 140px" placeholder="邮箱" />
            <input
              v-model="syncPassInput"
              class="num-input"
              style="width: 140px"
              type="password"
              placeholder="应用密码"
            />
          </div>
        </div>
        <div class="setting-row" style="border-bottom: 0; padding-bottom: 0">
          <div class="setting-label">
            <b>{{ lastSyncText }}</b>
            <span v-if="lastError" style="color: var(--bad)">{{ lastError }}</span>
          </div>
          <div class="btn-row">
            <button class="btn btn-sm btn-ghost" @click="saveSync">保存配置</button>
            <button class="btn btn-sm" :disabled="syncStatus === 'syncing'" @click="runSync">
              立即同步
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <h3 class="section-title" style="margin-bottom: 10px">关于</h3>
      <div class="card">
        <div class="setting-row" style="border-bottom: 0; padding-bottom: 0">
          <div class="setting-label">
            <b>前端面试刷题 v1.2</b>
            <span>纯本地 PWA · 正确率 =（自动判对 + 自判掌握）÷ 总答题次数</span>
          </div>
        </div>
      </div>
    </div>

    <EditQuestionDialog :question="editing" @close="editing = null" />
    <AddQuestionDialog :open="adding" @close="adding = false" />
  </div>
</template>
