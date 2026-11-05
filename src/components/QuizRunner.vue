<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Question } from '../types'
import { useBankStore } from '../stores/bank'
import { useProgressStore } from '../stores/progress'
import { useSessionStore } from '../stores/session'
import { toast } from '../lib/toast'
import AppIcon from './AppIcon.vue'
import MarkdownView from './MarkdownView.vue'
import QuestionMeta from './QuestionMeta.vue'
import EditQuestionDialog from './EditQuestionDialog.vue'

const props = defineProps<{ question: Question }>()

const router = useRouter()
const bank = useBankStore()
const progress = useProgressStore()
const sessionStore = useSessionStore()

const q = computed(() => props.question)
const isSelf = computed(() => q.value.type === 'short' || q.value.type === 'code')
const isMulti = computed(() => q.value.type === 'multi')

const phase = ref<'answer' | 'judged'>('answer')
const selected = ref<number[]>([])
const draft = ref('')
const revealed = ref(false)
const openFollowups = ref<number[]>([])
const judgedCorrect = ref(false)
const showApproach = ref(false)
const showSolution = ref(false)
const noteOpen = ref(false)
const noteDraft = ref(progress.meta.notes[q.value.id] ?? '')

const displayOptions = computed<string[]>(() => {
  if (q.value.type === 'judge' && !q.value.options?.length) return ['正确', '错误']
  return q.value.options ?? []
})

const correctIdx = computed<number[]>(() => {
  const a = q.value.answer
  if (typeof a === 'boolean') return [a ? 0 : 1]
  return Array.isArray(a) ? a : []
})

const answerLetter = computed(() =>
  correctIdx.value.map((i) => String.fromCharCode(65 + i)).join(' / '),
)

const index = computed(() => sessionStore.session?.index ?? 0)
const total = computed(() => sessionStore.session?.qids.length ?? 0)
const percent = computed(() =>
  total.value ? Math.round(((index.value + 1) / total.value) * 100) : 0,
)
const isLast = computed(() => index.value >= total.value - 1)
const inReview = computed(() => progress.isInReview(q.value.id))
const starred = computed(() => Boolean(progress.meta.stars[q.value.id]))
const isReviewMode = computed(() => sessionStore.session?.mode === 'review')
const wrongReason = computed(() => progress.review[q.value.id]?.wrongReason)

function markReason(reason: 'unknown' | 'careless'): void {
  progress.setWrongReason(q.value.id, reason)
}

// ---------- 判定 ----------
function matches(): boolean {
  const a = q.value.answer
  if (q.value.type === 'judge') {
    if (typeof a !== 'boolean') return false
    return selected.value.length === 1 && selected.value[0] === (a ? 0 : 1)
  }
  if (!Array.isArray(a)) return false
  if (q.value.type === 'single') {
    return selected.value.length === 1 && selected.value[0] === a[0]
  }
  if (selected.value.length !== a.length) return false
  const s = [...selected.value].sort((x, y) => x - y)
  return s.every((v, i) => v === a[i])
}

function submit(correct: boolean): void {
  if (phase.value === 'judged') return
  phase.value = 'judged'
  judgedCorrect.value = correct
  progress.addRecord(q.value.id, correct, isSelf.value)
  progress.applyReview(q.value.id, correct)
  sessionStore.recordResult(q.value.id, correct)
  if (q.value.type === 'code') showSolution.value = true
}

function pick(i: number): void {
  if (phase.value === 'judged') return
  if (isMulti.value) {
    selected.value = selected.value.includes(i)
      ? selected.value.filter((n) => n !== i)
      : [...selected.value, i].sort((a, b) => a - b)
    return
  }
  selected.value = [i]
  submit(matches())
}

function submitMulti(): void {
  if (!selected.value.length) return
  submit(matches())
}

function revealPoints(): void {
  revealed.value = true
}

function toggleFollowup(i: number): void {
  openFollowups.value = openFollowups.value.includes(i)
    ? openFollowups.value.filter((n) => n !== i)
    : [...openFollowups.value, i]
}

// ---------- 操作 ----------
function toggleStar(): void {
  progress.toggleStar(q.value.id)
}

function toggleReview(): void {
  if (inReview.value) progress.dequeue(q.value.id)
  else progress.enqueue(q.value.id)
}

function saveNote(): void {
  progress.setNote(q.value.id, noteDraft.value)
}

function next(): void {
  const last = isLast.value
  sessionStore.next()
  if (last) router.push('/result')
}

function exit(): void {
  toast('进度已保存，可随时继续', 'info')
  router.push('/')
}

/** 判分后一键跳到解析，省去手动滑动 */
const pointsRef = ref<HTMLElement | null>(null)
const analysisRef = ref<HTMLElement | null>(null)

function scrollToReview(): void {
  const target =
    q.value.type === 'short' && revealed.value ? pointsRef.value : analysisRef.value
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const editingId = ref<string | null>(null)

function openEdit(): void {
  editingId.value = q.value.id
}

// ---------- 手撕计时器 ----------
const TIMER_TOTAL = 20 * 60
const timerOn = ref(false)
const remain = ref(TIMER_TOTAL)
let timerId: number | undefined

const timerText = computed(() => {
  const m = Math.floor(remain.value / 60)
  const s = remain.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function stopTimer(): void {
  if (timerId !== undefined) window.clearInterval(timerId)
  timerId = undefined
  timerOn.value = false
}

function toggleTimer(): void {
  if (timerOn.value) {
    stopTimer()
    return
  }
  if (remain.value <= 0) remain.value = TIMER_TOTAL
  timerOn.value = true
  timerId = window.setInterval(() => {
    remain.value -= 1
    if (remain.value <= 0) {
      remain.value = 0
      stopTimer()
    }
  }, 1000)
}

// ---------- 键盘 ----------
function primaryAction(): void {
  if (phase.value === 'judged') {
    next()
    return
  }
  if (isMulti.value) submitMulti()
  else if (q.value.type === 'short' && !revealed.value) revealPoints()
}

function onKey(e: KeyboardEvent): void {
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (editingId.value) return
  if (e.key === 'Enter') {
    e.preventDefault()
    primaryAction()
    return
  }
  if (phase.value === 'answer' && /^[1-4]$/.test(e.key)) {
    const i = Number(e.key) - 1
    if (i < displayOptions.value.length) pick(i)
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  stopTimer()
})

const showBar = computed(
  () =>
    phase.value === 'judged' ||
    isMulti.value ||
    (q.value.type === 'short' && !revealed.value) ||
    (isSelf.value && (q.value.type === 'code' || revealed.value)),
)
</script>

<template>
  <div class="quiz">
    <div class="quiz-top">
      <button class="icon-btn" title="退出本轮" @click="exit">
        <AppIcon name="close" :size="17" />
      </button>
      <div class="quiz-progress"><i :style="{ width: `${percent}%` }" /></div>
      <span class="quiz-count">{{ index + 1 }} / {{ total }}</span>
      <button
        class="icon-btn"
        :class="{ on: starred }"
        :title="starred ? '取消星标' : '星标'"
        @click="toggleStar"
      >
        <AppIcon :name="starred ? 'star-fill' : 'star'" :size="17" />
      </button>
      <button class="icon-btn" title="编辑此题" @click="openEdit">
        <AppIcon name="edit" :size="16" />
      </button>
    </div>

    <QuestionMeta :question="q" />

    <div class="q-headline">
      <MarkdownView :source="q.title" />
    </div>

    <!-- 客观题 -->
    <div v-if="displayOptions.length" class="options">
      <button
        v-for="(opt, i) in displayOptions"
        :key="i"
        class="option"
        :class="{
          selected: phase === 'answer' && selected.includes(i),
          correct: phase === 'judged' && correctIdx.includes(i),
          wrong: phase === 'judged' && !correctIdx.includes(i) && selected.includes(i),
        }"
        :disabled="phase === 'judged'"
        @click="pick(i)"
      >
        <span class="option-key">{{ String.fromCharCode(65 + i) }}</span>
        <span class="option-text">{{ opt }}</span>
        <span v-if="phase === 'judged' && correctIdx.includes(i)" class="option-mark">
          <AppIcon name="check" :size="16" :stroke="2.2" />
        </span>
        <span
          v-else-if="phase === 'judged' && selected.includes(i)"
          class="option-mark"
        >
          <AppIcon name="x" :size="16" :stroke="2.2" />
        </span>
      </button>
    </div>

    <!-- 简答：先自答 -->
    <textarea
      v-else-if="q.type === 'short' && phase === 'answer' && (!revealed || draft.trim())"
      v-model="draft"
      rows="6"
      :readonly="revealed"
      placeholder="先用自己的话写下回答，再对照答题要点（仅本地留存，不参与判分）"
    />

    <p
      v-if="phase === 'answer' && !isMulti && q.type !== 'short' && q.type !== 'code'"
      class="muted"
      style="margin: 12px 0 0"
    >
      点击选项即时判定 · 键盘 <span class="kbd">1</span>–<span class="kbd">4</span> 也可选择
    </p>

    <!-- 判分反馈 -->
    <div
      v-if="phase === 'judged'"
      class="verdict-card"
      :class="judgedCorrect ? 'ok' : 'bad'"
    >
      <span class="verdict-icon">
        <AppIcon :name="judgedCorrect ? 'check' : 'x'" :size="16" :stroke="2.4" />
      </span>
      <div class="verdict-text">
        <b>
          {{ isSelf ? (judgedCorrect ? '已标记为掌握' : '已标记为未掌握') : judgedCorrect ? '回答正确' : '回答错误' }}
        </b>
        <span>
          {{
            isSelf
              ? '已计入本次练习'
              : judgedCorrect
                ? '继续保持节奏'
                : '加入复习队列，按遗忘曲线重现'
          }}
        </span>
      </div>
      <span v-if="!judgedCorrect && !isSelf" class="verdict-answer">答案 {{ answerLetter }}</span>
    </div>

    <!-- 判分后同屏操作 -->
    <div v-if="phase === 'judged'" class="mark-row">
      <button class="btn btn-sm" @click="toggleReview">
        <AppIcon name="review" :size="13" />
        {{ inReview ? '移出复习队列' : '加入复习' }}
      </button>
      <button class="btn btn-sm" @click="noteOpen = !noteOpen">
        <AppIcon name="note" :size="13" />
        {{ noteDraft ? '编辑笔记' : '写笔记' }}
      </button>
      <template v-if="isReviewMode && !judgedCorrect">
        <span class="muted" style="margin-left: 4px">错因</span>
        <button
          class="btn btn-sm"
          :style="wrongReason === 'unknown' ? 'border-color: var(--bad); color: var(--bad)' : ''"
          @click="markReason('unknown')"
        >
          不会
        </button>
        <button
          class="btn btn-sm"
          :style="wrongReason === 'careless' ? 'border-color: var(--warn); color: var(--warn)' : ''"
          @click="markReason('careless')"
        >
          粗心
        </button>
      </template>
    </div>

    <div v-if="phase === 'judged' && noteOpen" class="note-box">
      <textarea
        v-model="noteDraft"
        rows="4"
        placeholder="记下这题的坑点、记忆线索…"
        @blur="saveNote"
      />
      <div class="btn-row" style="margin-top: 8px; justify-content: flex-end">
        <button class="btn btn-sm btn-primary" @click="saveNote(); noteOpen = false">
          保存笔记
        </button>
      </div>
    </div>

    <!-- 简答：要点与追问 -->
    <div
      v-if="q.type === 'short' && revealed"
      ref="pointsRef"
      class="panel open"
      style="margin-top: 16px"
    >
      <div class="panel-head">
        <span class="panel-title emph">答题要点</span>
      </div>
      <div class="panel-body">
        <ul class="point-list">
          <li v-for="(p, i) in q.points" :key="i">{{ p }}</li>
        </ul>

        <template v-if="q.followups?.length">
          <div class="divider" />
          <div class="filter-label">常见追问 · 点击揭晓</div>
          <button
            v-for="(f, i) in q.followups"
            :key="i"
            class="followup"
            @click="toggleFollowup(i)"
          >
            <span class="followup-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="followup-text" :class="{ muted: !openFollowups.includes(i) }">
              {{ openFollowups.includes(i) ? f : '点击查看追问' }}
            </span>
            <AppIcon :name="openFollowups.includes(i) ? 'chevron-down' : 'chevron-right'" :size="14" />
          </button>
        </template>
      </div>
    </div>

    <!-- 手撕：计时 / 思路 / 参考实现 / 复杂度 -->
    <template v-if="q.type === 'code'">
      <div class="timer-row">
        <span class="timer" :class="{ warn: timerOn && remain <= 60 }">
          <AppIcon name="clock" :size="13" />
          {{ timerOn ? timerText : '20:00' }}
        </span>
        <button class="btn btn-sm" @click="toggleTimer">
          {{ timerOn ? '停止计时' : '开启计时' }}
        </button>
        <span class="spacer" />
        <a v-if="q.link" :href="q.link" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-ghost">
          LeetCode 原题
          <AppIcon name="link" :size="13" />
        </a>
      </div>

      <div
        v-if="q.approach"
        class="panel"
        :class="{ open: showApproach }"
        style="margin-top: 12px"
      >
        <button class="panel-head" @click="showApproach = !showApproach">
          <span class="panel-title">思路提示</span>
          <span class="panel-chevron"><AppIcon name="chevron-down" :size="15" /></span>
        </button>
        <div v-if="showApproach" class="panel-body">
          <MarkdownView :source="q.approach" />
        </div>
      </div>

      <div
        ref="analysisRef"
        class="panel"
        :class="{ open: showSolution }"
        style="margin-top: 10px"
      >
        <button class="panel-head" @click="showSolution = !showSolution">
          <span class="panel-title emph">参考实现 · JavaScript</span>
          <span class="panel-chevron"><AppIcon name="chevron-down" :size="15" /></span>
        </button>
        <div v-if="showSolution" class="panel-body">
          <MarkdownView :source="q.analysis" />
        </div>
      </div>

      <p v-if="q.complexity" class="muted" style="margin: 12px 0 0">
        复杂度 <span class="mono" style="color: var(--fg-2)">{{ q.complexity }}</span>
      </p>
    </template>

    <!-- 客观题 / 简答 解析 -->
    <div
      v-if="phase === 'judged' && q.type !== 'code'"
      ref="analysisRef"
      class="panel open"
      style="margin-top: 16px"
    >
      <div class="panel-head">
        <span class="panel-title emph">{{ q.type === 'short' ? '补充解析' : '解析' }}</span>
      </div>
      <div class="panel-body">
        <MarkdownView :source="q.analysis" />
      </div>
    </div>

    <div v-if="showBar" class="quiz-actions">
      <template v-if="phase === 'judged'">
        <button class="btn btn-lg btn-ghost" @click="scrollToReview">看解析</button>
        <span class="spacer" />
        <button class="btn btn-primary btn-lg" @click="next">
          {{ isLast ? '完成本轮' : '下一题' }}
        </button>
      </template>
      <template v-else>
        <span class="spacer" />
        <button
          v-if="isMulti"
          class="btn btn-primary btn-lg"
          :disabled="!selected.length"
          @click="submitMulti"
        >
          提交答案
        </button>
        <button
          v-else-if="q.type === 'short' && !revealed"
          class="btn btn-primary btn-lg"
          @click="revealPoints"
        >
          看答题要点
        </button>
        <template v-else-if="isSelf">
          <button class="btn btn-lg" @click="submit(false)">未掌握</button>
          <button class="btn btn-primary btn-lg" @click="submit(true)">掌握</button>
        </template>
      </template>
    </div>

    <EditQuestionDialog
      :question="editingId ? (bank.byId[editingId] ?? null) : null"
      @close="editingId = null"
    />
  </div>
</template>
