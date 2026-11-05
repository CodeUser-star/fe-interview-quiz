<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { LEVEL_NAME, analyzeStage, pickProgressive } from '../lib/pick'
import { useBankStore } from '../stores/bank'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const bank = useBankStore()
const progress = useProgressStore()
const settings = useSettingsStore()
const sessionStore = useSessionStore()

/** 当前应练的难度层与掌握情况 */
const stage = computed(() => analyzeStage(bank.questions, progress.isMastered))
const stageName = computed(() => LEVEL_NAME[stage.value.stage])

const goal = computed(() => settings.dailyGoal)
const remain = computed(() => Math.max(0, goal.value - progress.todayCount))
const goalPercent = computed(() =>
  Math.min(100, Math.round((progress.todayCount / goal.value) * 100)),
)

const activeSession = computed(() => {
  const s = sessionStore.session
  return s && !sessionStore.finished ? s : null
})

const doneSession = computed(() => {
  const s = sessionStore.session
  return s && sessionStore.finished ? s : null
})

const todayRate = computed(() =>
  progress.todayCount ? Math.round((progress.todayCorrect / progress.todayCount) * 100) : 0,
)
const totalRate = computed(() => Math.round(progress.accuracy * 100))

/** 已有未完成的一轮时，先确认再覆盖，避免误丢进度 */
function confirmOverwrite(): boolean {
  if (!activeSession.value) return true
  return window.confirm('当前有一轮没做完，开始新的会覆盖它。继续？')
}

function startAll(): void {
  if (!confirmOverwrite()) return
  const plan = pickProgressive({ questions: bank.questions, isMastered: progress.isMastered })
  if (!plan.qids.length) return
  sessionStore.start({
    mode: 'bank',
    label: `渐进 · ${LEVEL_NAME[plan.stage]}`,
    qids: plan.qids,
  })
  router.push('/quiz')
}

function startQuick(): void {
  if (!confirmOverwrite()) return
  const plan = pickProgressive({
    questions: bank.questions,
    isMastered: progress.isMastered,
    limit: 5,
  })
  if (!plan.qids.length) return
  sessionStore.start({
    mode: 'quick',
    label: `快速 5 题 · ${LEVEL_NAME[plan.stage]}`,
    qids: plan.qids,
  })
  router.push('/quiz')
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">今日</h1>
      <span class="page-sub">{{ progress.today }}</span>
    </div>

    <div class="card">
      <div class="hero">
        <div>
          <h2 class="hero-title">
            {{ progress.checkedInToday ? '今日已打卡' : '今日进度' }}
            <span v-if="!progress.checkedInToday" class="pill pill-brand">还差 {{ remain }} 题</span>
          </h2>
          <p class="hero-sub">
            已完成 <span class="hero-num">{{ progress.todayCount }}</span> / {{ goal }} 题
          </p>
        </div>
        <div class="streak">
          <b>{{ progress.streak }}<small style="font-size: 12px; font-weight: 500"> 天</small></b>
          <span>连续打卡</span>
        </div>
      </div>

      <div class="progress" style="margin-top: 16px">
        <i
          :style="{
            width: `${goalPercent}%`,
            background: progress.checkedInToday ? 'var(--ok)' : 'var(--brand)',
          }"
        />
      </div>
    </div>

    <div class="action-grid" style="margin-top: 12px">
      <button v-if="activeSession" class="action-card" @click="router.push('/quiz')">
        <span class="action-title">
          继续刷题
          <AppIcon name="chevron-right" :size="14" />
        </span>
        <span class="action-desc">
          {{ activeSession.label }} · 第
          {{ Math.min(activeSession.index + 1, activeSession.qids.length) }}/{{
            activeSession.qids.length
          }}
        </span>
      </button>
      <button v-else class="action-card" @click="startAll">
        <span class="action-title">
          开始刷题
          <AppIcon name="chevron-right" :size="14" />
        </span>
        <span class="action-desc">
          <template v-if="stage.allMastered">全部阶段已掌握 · 随机巩固</template>
          <template v-else>
            {{ stageName }}阶段 · 已掌握 {{ stage.mastered }}/{{ stage.total }}
          </template>
        </span>
      </button>

      <button class="action-card" @click="startQuick">
        <span class="action-title">
          快速 5 题
          <AppIcon name="target" :size="14" />
        </span>
        <span class="action-desc">{{ stageName }}难度 · 随机 5 题</span>
      </button>
    </div>

    <div class="stat-strip" style="margin-top: 12px">
      <div>
        <span class="stat-label">今日正确率</span>
        <b class="stat-value">
          {{ todayRate }}<small>%</small>
        </b>
      </div>
      <div>
        <span class="stat-label">已做过</span>
        <b class="stat-value">
          {{ progress.doneSet.size }}<small>/ {{ bank.questions.length }}</small>
        </b>
      </div>
      <div>
        <span class="stat-label">累计正确率</span>
        <b class="stat-value">
          {{ totalRate }}<small>%</small>
        </b>
      </div>
    </div>

    <div v-if="progress.dueCount > 0 || doneSession" class="section">
      <div class="section-head">
        <h3 class="section-title">待办</h3>
      </div>

      <div v-if="progress.dueCount > 0" class="todo">
        <span class="todo-icon warn"><AppIcon name="review" :size="17" /></span>
        <div class="todo-main">
          <b class="todo-title">今日复习队列 · {{ progress.dueCount }} 题</b>
          <p class="todo-desc">按遗忘曲线重现，逾期最久的排最前</p>
        </div>
        <button class="btn btn-sm" @click="router.push('/review')">去复习</button>
      </div>

      <div v-if="doneSession" class="todo">
        <span class="todo-icon"><AppIcon name="check" :size="17" /></span>
        <div class="todo-main">
          <b class="todo-title">上一轮已完成 · {{ doneSession.label }}</b>
          <p class="todo-desc">{{ doneSession.results.length }} 题</p>
        </div>
        <button class="btn btn-sm btn-ghost" @click="router.push('/result')">看结算</button>
      </div>
    </div>
  </div>
</template>
