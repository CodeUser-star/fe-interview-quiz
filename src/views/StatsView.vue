<script setup lang="ts">
import { computed, ref } from 'vue'
import { SUBJECTS } from '../types'
import { ymd } from '../lib/dates'
import { useBankStore } from '../stores/bank'
import { useProgressStore } from '../stores/progress'
import AppIcon from '../components/AppIcon.vue'

const bank = useBankStore()
const progress = useProgressStore()

const totalRecords = computed(() => progress.records.length)
const accuracyPercent = computed(() => Math.round(progress.accuracy * 100))

const subjectRows = computed(() =>
  SUBJECTS.map((s) => {
    const qs = bank.questions.filter((q) => q.subject === s.key)
    const ids = new Set(qs.map((q) => q.id))
    const rs = progress.records.filter((r) => ids.has(r.qid))
    const done = new Set(rs.map((r) => r.qid)).size
    return {
      key: s.key,
      name: s.name,
      total: qs.length,
      done,
      rate: rs.length ? Math.round((rs.filter((r) => r.correct).length / rs.length) * 100) : 0,
    }
  }).filter((r) => r.total > 0),
)

const maxDaily = computed(() => Math.max(1, ...progress.last30Days.map((d) => d.total)))

// ---------- 打卡日历 ----------
const cursor = ref(startOfMonth(Date.now()))

function startOfMonth(ts: number): number {
  const d = new Date(ts)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const monthLabel = computed(() => {
  const d = new Date(cursor.value)
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
})

const monthCells = computed(() => {
  const d = new Date(cursor.value)
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const todayKey = ymd(Date.now())
  const cells: { day: number | null; checked: boolean; today: boolean }[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, checked: false, today: false })
  for (let day = 1; day <= days; day++) {
    const key = ymd(new Date(year, month, day).getTime())
    cells.push({ day, checked: Boolean(progress.checkins[key]), today: key === todayKey })
  }
  return cells
})

const monthCheckins = computed(() => monthCells.value.filter((c) => c.checked).length)

function shiftMonth(delta: number): void {
  const d = new Date(cursor.value)
  d.setMonth(d.getMonth() + delta)
  cursor.value = startOfMonth(d.getTime())
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">统计</h1>
      <span class="page-sub">近 30 天</span>
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <span class="kpi-label">总正确率</span>
        <b class="kpi-value">{{ accuracyPercent }}<small>%</small></b>
      </div>
      <div class="kpi">
        <span class="kpi-label">答题次数</span>
        <b class="kpi-value">{{ totalRecords }}</b>
      </div>
      <div class="kpi">
        <span class="kpi-label">待复习</span>
        <b class="kpi-value" :style="progress.dueCount ? 'color: var(--warn)' : ''">
          {{ progress.dueCount }}
        </b>
      </div>
    </div>

    <p class="muted" style="margin: 10px 2px 0">
      正确率 =（自动判对 + 自判掌握）÷ 总答题次数
    </p>

    <div class="card" style="margin-top: 14px">
      <div class="card-title-row">
        <p class="card-title">各科目进度</p>
        <span class="muted">已做 / 总题数</span>
      </div>
      <div v-if="!subjectRows.length" class="muted">暂无题目</div>
      <div v-for="(row, i) in subjectRows" :key="row.key" class="subject-line" :style="i === 0 ? 'border-top: 0' : ''">
        <span>{{ row.name }}</span>
        <div class="progress" :title="`正确率 ${row.rate}%`">
          <i :style="{ width: `${(row.done / row.total) * 100}%` }" />
        </div>
        <span class="num">{{ row.done }}/{{ row.total }} · {{ row.rate }}%</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <p class="card-title">最近 30 天做题量</p>
        <span class="muted">峰值 {{ maxDaily }}</span>
      </div>
      <div class="bars">
        <div
          v-for="d in progress.last30Days"
          :key="d.date"
          :class="{ zero: d.total === 0 }"
          :style="{ height: `${Math.max(3, (d.total / maxDaily) * 100)}%` }"
          :title="`${d.date} · ${d.total} 题`"
        />
      </div>
      <div class="bars-legend">
        <span>{{ progress.last30Days[0]?.date }}</span>
        <span>今天</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <p class="card-title">打卡日历 · {{ monthLabel }}</p>
        <div class="btn-row">
          <span class="muted">{{ monthCheckins }} 天</span>
          <button class="icon-btn" @click="shiftMonth(-1)"><AppIcon name="chevron-left" :size="16" /></button>
          <button class="icon-btn" @click="shiftMonth(1)"><AppIcon name="chevron-right" :size="16" /></button>
        </div>
      </div>
      <div class="calendar">
        <div v-for="w in ['日', '一', '二', '三', '四', '五', '六']" :key="w" class="cal-head">
          {{ w }}
        </div>
        <div
          v-for="(c, i) in monthCells"
          :key="i"
          class="cal-cell"
          :class="{ on: c.checked, today: c.today, empty: !c.day }"
        >
          {{ c.day ?? '' }}
        </div>
      </div>
      <p class="muted" style="margin: 14px 0 0">
        打卡条件：当日答题 ≥ 目标题数，且今日复习队列清零。不做补卡。
      </p>
    </div>
  </div>
</template>
