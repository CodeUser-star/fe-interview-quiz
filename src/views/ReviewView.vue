<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Question } from '../types'
import { SUBJECT_NAME } from '../types'
import { overdueDays } from '../lib/dates'
import { plain } from '../lib/text'
import { useBankStore } from '../stores/bank'
import { useProgressStore } from '../stores/progress'
import { useSessionStore } from '../stores/session'
import AppIcon from '../components/AppIcon.vue'
import QuestionDetailDialog from '../components/QuestionDetailDialog.vue'
import EditQuestionDialog from '../components/EditQuestionDialog.vue'

const router = useRouter()
const bank = useBankStore()
const progress = useProgressStore()
const sessionStore = useSessionStore()

const detail = ref<Question | null>(null)
const editing = ref<Question | null>(null)

const due = computed(() => progress.dueItems())

const rows = computed(() => {
  const out: { item: (typeof due.value)[number]; question: Question }[] = []
  for (const item of due.value) {
    const question = bank.byId[item.qid]
    if (question) out.push({ item, question })
  }
  return out
})

const overdueCount = computed(() => rows.value.filter((r) => overdueDays(r.item.dueAt) > 0).length)

const reasonText: Record<string, string> = { unknown: '不会', careless: '粗心' }

function start(): void {
  const ids = rows.value.map((r) => r.question.id)
  if (!ids.length) return
  sessionStore.start({ mode: 'review', label: '今日复习', qids: ids })
  router.push('/quiz')
}

/** 只查看详情，不启动练习——避免覆盖进行中的一轮 */
function openDetail(q: Question): void {
  detail.value = q
}

function openEdit(id: string): void {
  detail.value = null
  editing.value = bank.byId[id] ?? null
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">复习</h1>
      <span class="page-sub">今日待复习 {{ rows.length }} 题</span>
    </div>

    <div class="card">
      <div class="hero">
        <div>
          <h2 class="hero-title">
            今日队列
            <span v-if="overdueCount" class="pill" style="color: var(--bad); background: var(--bad-weak)">
              逾期 {{ overdueCount }}
            </span>
          </h2>
          <p class="hero-sub">按遗忘曲线 1 / 3 / 7 / 15 / 30 天重现，逾期最久的排最前</p>
        </div>
        <div class="streak">
          <b>{{ rows.length }}</b>
          <span>待复习</span>
        </div>
      </div>

      <button class="btn btn-primary btn-lg btn-block" style="margin-top: 16px" :disabled="!rows.length" @click="start">
        <AppIcon name="review" :size="15" />
        开始复习
      </button>
    </div>

    <div v-if="!rows.length" class="empty" style="margin-top: 14px">
      <div class="empty-title">今日复习已清零</div>
      <p class="empty-desc">答错或自判未掌握的题会自动进入队列</p>
    </div>

    <div v-else class="section">
      <div class="section-head">
        <h3 class="section-title">题目清单</h3>
      </div>

      <div v-for="(r, i) in rows" :key="r.question.id" class="review-item">
        <span class="review-index">{{ String(i + 1).padStart(2, '0') }}</span>
        <div class="q-body" style="cursor: pointer" @click="openDetail(r.question)">
          <div class="q-title">{{ plain(r.question.title, 68) }}</div>
          <div class="q-foot">
            <span>{{ SUBJECT_NAME[r.question.subject] }}</span>
            <span>{{ r.item.stage === 0 ? '首次复习' : `第 ${r.item.stage + 1} 次` }}</span>
            <span v-if="overdueDays(r.item.dueAt) > 0" class="overdue">
              逾期 {{ overdueDays(r.item.dueAt) }} 天
            </span>
            <span v-else class="muted">今天到期</span>
            <span v-if="r.item.wrongReason" class="tag">{{ reasonText[r.item.wrongReason] }}</span>
          </div>
        </div>
        <button class="icon-btn" title="移出队列" @click="progress.dequeue(r.question.id)">
          <AppIcon name="trash" :size="15" />
        </button>
      </div>
    </div>

    <QuestionDetailDialog :question="detail" @close="detail = null" @edit="openEdit" />
    <EditQuestionDialog :question="editing" @close="editing = null" />
  </div>
</template>
