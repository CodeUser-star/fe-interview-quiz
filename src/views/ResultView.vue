<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Question } from '../types'
import { SUBJECT_NAME } from '../types'
import { plain } from '../lib/text'
import { useBankStore } from '../stores/bank'
import { useSessionStore } from '../stores/session'
import AppIcon from '../components/AppIcon.vue'
import QuestionDetailDialog from '../components/QuestionDetailDialog.vue'
import EditQuestionDialog from '../components/EditQuestionDialog.vue'

const router = useRouter()
const bank = useBankStore()
const sessionStore = useSessionStore()

const detail = ref<Question | null>(null)
const editing = ref<Question | null>(null)

const session = computed(() => sessionStore.session)
const total = computed(() => session.value?.results.length ?? 0)
const correct = computed(() => sessionStore.correctCount)
const rate = computed(() => (total.value ? Math.round((correct.value / total.value) * 100) : 0))

const R = 54
const CIRC = 2 * Math.PI * R
const dash = computed(() => `${(rate.value / 100) * CIRC} ${CIRC}`)
const ringColor = computed(() =>
  rate.value >= 80 ? 'var(--ok)' : rate.value >= 60 ? 'var(--brand)' : 'var(--warn)',
)

const wrongList = computed(() => {
  if (!session.value) return []
  return session.value.results
    .filter((r) => !r.correct)
    .map((r) => bank.byId[r.qid])
    .filter((q): q is Question => Boolean(q))
})

function retry(): void {
  sessionStore.retry()
  router.push('/quiz')
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">本轮结算</h1>
      <span class="page-sub">{{ session?.label ?? '练习' }}</span>
    </div>

    <div v-if="!session || !total" class="empty">
      <div class="empty-title">没有可结算的记录</div>
      <p class="empty-desc">先做一轮题吧</p>
      <button class="btn" style="margin-top: 12px" @click="router.push('/')">回到今日</button>
    </div>

    <template v-else>
      <div class="card result-card">
        <div class="ring">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle class="ring-track" cx="64" cy="64" :r="R" />
            <circle
              class="ring-fill"
              cx="64"
              cy="64"
              :r="R"
              :style="{ strokeDasharray: dash, stroke: ringColor }"
            />
          </svg>
          <div class="ring-inner">
            <div>
              <b>{{ rate }}<i>%</i></b>
              <span>正确率</span>
            </div>
          </div>
        </div>

        <div class="result-info">
          <h2>{{ rate >= 80 ? '这轮很稳' : rate >= 60 ? '基本过关' : '还有提升空间' }}</h2>
          <p>{{ session.label }}</p>
          <div class="result-stats">
            <div>
              <b>{{ total }}</b>
              总题数
            </div>
            <div>
              <b style="color: var(--ok)">{{ correct }}</b>
              答对
            </div>
            <div>
              <b style="color: var(--bad)">{{ total - correct }}</b>
              答错
            </div>
          </div>
        </div>
      </div>

      <div class="btn-row" style="margin-top: 14px">
        <button class="btn btn-primary btn-lg" style="flex: 1" @click="retry">
          <AppIcon name="review" :size="15" />
          再来一轮
        </button>
        <button class="btn btn-lg" style="flex: 1" @click="router.push('/')">回到今日</button>
      </div>

      <div class="section">
        <div class="section-head">
          <h3 class="section-title">错题 · {{ wrongList.length }}</h3>
          <span v-if="wrongList.length" class="muted">已自动进入复习队列</span>
        </div>

        <div v-if="!wrongList.length" class="empty" style="padding: 32px 20px">
          <div class="empty-title">本轮全对</div>
          <p class="empty-desc">没有需要复盘的题</p>
        </div>

        <div v-else class="q-list">
          <div v-for="q in wrongList" :key="q.id" class="q-row" @click="detail = q">
            <i class="q-status bad" />
            <div class="q-body">
              <div class="q-title">{{ plain(q.title, 84) }}</div>
              <div class="q-foot">
                <span>{{ SUBJECT_NAME[q.subject] }}</span>
                <span class="q-id">{{ q.id }}</span>
              </div>
            </div>
            <span class="q-chevron"><AppIcon name="chevron-right" :size="16" /></span>
          </div>
        </div>
      </div>
    </template>

    <QuestionDetailDialog
      :question="detail"
      @close="detail = null"
      @edit="(id) => { detail = null; editing = bank.byId[id] ?? null }"
    />
    <EditQuestionDialog :question="editing" @close="editing = null" />
  </div>
</template>
