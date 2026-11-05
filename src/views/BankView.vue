<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Difficulty, Question, Subject } from '../types'
import {
  DIFFICULTY_NAME,
  SUBJECTS,
  SUBJECT_NAME,
  SUBJECT_SHORT,
  TYPE_NAME,
  tagLabel,
} from '../types'
import { plain } from '../lib/text'
import { useMediaQuery } from '../lib/media'
import { LEVEL_NAME, analyzeStage, pickProgressive } from '../lib/pick'
import { useBankStore } from '../stores/bank'
import { useProgressStore } from '../stores/progress'
import { useSessionStore, shuffle } from '../stores/session'
import AppIcon from '../components/AppIcon.vue'
import QuestionDetailDialog from '../components/QuestionDetailDialog.vue'
import EditQuestionDialog from '../components/EditQuestionDialog.vue'

const router = useRouter()
const bank = useBankStore()
const progress = useProgressStore()
const sessionStore = useSessionStore()

const isDesktop = useMediaQuery('(min-width: 861px)')
const filtersOpen = ref(false)

const keyword = ref('')
const subject = ref<'all' | Subject>('all')
const difficulty = ref<0 | Difficulty>(0)
const tag = ref('all')
const order = ref<'seq' | 'random'>('seq')

const detail = ref<Question | null>(null)
const editing = ref<Question | null>(null)

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return bank.questions.filter((q) => {
    if (subject.value !== 'all' && q.subject !== subject.value) return false
    if (difficulty.value !== 0 && q.difficulty !== difficulty.value) return false
    if (tag.value !== 'all' && !q.tags.includes(tag.value)) return false
    if (!kw) return true
    const note = progress.meta.notes[q.id] ?? ''
    return [q.title, q.analysis, note, q.tags.map(tagLabel).join(' '), SUBJECT_NAME[q.subject]]
      .join('\n')
      .toLowerCase()
      .includes(kw)
  })
})

const statusMap = computed(() => {
  const map: Record<string, boolean> = {}
  for (const r of progress.records) map[r.qid] = r.correct
  return map
})

const quickTags = computed(() => bank.tagStats.slice(0, 3))

/** 「随机」= 渐进式抽题；选中标签时仍按标签全量组卷 */
const progressive = computed(() => order.value === 'random' && tag.value === 'all')

/** 当前抽题会落在哪一层（只做统计，不洗牌，可安全放进 computed） */
const stage = computed(() => analyzeStage(filtered.value, progress.isMastered))

/** 难度 / 标签里已生效的条数，用于折叠态提示 */
const panelFilterCount = computed(
  () => (difficulty.value !== 0 ? 1 : 0) + (tag.value !== 'all' ? 1 : 0),
)

const activeFilterCount = computed(
  () => panelFilterCount.value + (subject.value !== 'all' ? 1 : 0) + (keyword.value.trim() ? 1 : 0),
)

const showFilters = computed(() => isDesktop.value || filtersOpen.value)

const filterLabel = computed(() => {
  const parts: string[] = []
  if (subject.value !== 'all') parts.push(SUBJECT_NAME[subject.value])
  if (difficulty.value !== 0) parts.push(DIFFICULTY_NAME[difficulty.value])
  if (tag.value !== 'all') parts.push(tagLabel(tag.value))
  return parts.length ? parts.join(' · ') : '全部题目'
})

function statusClass(id: string): string {
  const v = statusMap.value[id]
  if (v === undefined) return ''
  return v ? 'ok' : 'bad'
}

function startFiltered(): void {
  if (!filtered.value.length) return

  if (progressive.value) {
    const plan = pickProgressive({ questions: filtered.value, isMastered: progress.isMastered })
    if (!plan.qids.length) return
    sessionStore.start({
      mode: tag.value !== 'all' ? 'tag' : 'bank',
      label: `${filterLabel.value === '全部题目' ? '渐进' : filterLabel.value} · ${LEVEL_NAME[plan.stage]}`,
      qids: plan.qids,
    })
    router.push('/quiz')
    return
  }

  const ids =
    order.value === 'random'
      ? shuffle(filtered.value.map((q) => q.id))
      : filtered.value.map((q) => q.id)

  sessionStore.start({
    mode: tag.value !== 'all' ? 'tag' : 'bank',
    label: tag.value !== 'all' ? `专项 · ${tagLabel(tag.value)}` : filterLabel.value,
    tag: tag.value !== 'all' ? tag.value : undefined,
    qids: ids,
  })
  router.push('/quiz')
}

function startTag(t: string): void {
  const ids = shuffle(bank.questions.filter((q) => q.tags.includes(t)).map((q) => q.id))
  if (!ids.length) return
  sessionStore.start({ mode: 'tag', label: `专项 · ${tagLabel(t)}`, tag: t, qids: ids })
  router.push('/quiz')
}

function openEdit(id: string): void {
  detail.value = null
  editing.value = bank.byId[id] ?? null
}

function resetFilters(): void {
  keyword.value = ''
  subject.value = 'all'
  difficulty.value = 0
  tag.value = 'all'
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">题库</h1>
      <span class="page-sub">共 {{ bank.questions.length }} 题</span>
    </div>

    <div class="search">
      <span class="search-icon"><AppIcon name="search" :size="16" /></span>
      <input v-model="keyword" placeholder="搜索题干、解析、笔记或标签" />
    </div>

    <div class="chip-scroll" style="margin-top: 10px">
      <button class="chip sm" :class="{ active: subject === 'all' }" @click="subject = 'all'">
        全部
      </button>
      <button
        v-for="s in SUBJECTS"
        :key="s.key"
        class="chip sm"
        :class="{ active: subject === s.key }"
        @click="subject = s.key"
      >
        {{ isDesktop ? s.name : SUBJECT_SHORT[s.key] }}
      </button>
    </div>

    <div v-show="showFilters" class="card" style="margin-top: 10px">
      <div class="filter-block">
        <div class="filter-label">难度</div>
        <div class="chip-row">
          <button class="chip sm" :class="{ active: difficulty === 0 }" @click="difficulty = 0">
            全部
          </button>
          <button
            v-for="d in [1, 2, 3]"
            :key="d"
            class="chip sm"
            :class="{ active: difficulty === d }"
            @click="difficulty = d as Difficulty"
          >
            {{ DIFFICULTY_NAME[d as Difficulty] }}
          </button>
        </div>
      </div>

      <div class="filter-block">
        <div class="filter-label">标签</div>
        <div class="chip-row">
          <button class="chip sm" :class="{ active: tag === 'all' }" @click="tag = 'all'">
            全部
          </button>
          <button
            v-for="t in bank.tagStats"
            :key="t.tag"
            class="chip sm"
            :class="{ active: tag === t.tag }"
            @click="tag = t.tag"
          >
            {{ tagLabel(t.tag) }}<span class="chip-count">{{ t.count }}</span>
          </button>
        </div>
      </div>

      <div v-if="activeFilterCount" class="btn-row" style="margin-top: 12px; justify-content: flex-end">
        <span class="muted" style="margin-right: auto">{{ filterLabel }}</span>
        <button class="btn btn-sm btn-ghost" @click="resetFilters">清空筛选</button>
      </div>
    </div>

    <div class="startbar" style="margin-top: 10px">
      <button
        v-if="!isDesktop"
        class="btn btn-sm filter-toggle"
        :class="{ on: filtersOpen || panelFilterCount > 0 }"
        @click="filtersOpen = !filtersOpen"
      >
        <AppIcon name="settings" :size="14" />
        筛选
        <span v-if="panelFilterCount" class="filter-dot">{{ panelFilterCount }}</span>
      </button>
      <div class="seg">
        <button :class="{ active: order === 'seq' }" @click="order = 'seq'">顺序</button>
        <button :class="{ active: order === 'random' }" @click="order = 'random'">随机</button>
      </div>
      <span v-if="isDesktop" class="spacer" />
      <button class="btn btn-primary" :disabled="!filtered.length" @click="startFiltered">
        {{ tag !== 'all' ? '开始专项' : '开始刷题' }}
      </button>
    </div>

    <p v-if="progressive" class="stage-hint">
      由易到难 · 当前 {{ LEVEL_NAME[stage.stage] }}阶段，已掌握
      {{ stage.mastered }}/{{ stage.total }}
    </p>

    <div class="quick-row">
      <span class="filter-label">专项</span>
      <div class="chip-row">
        <button v-for="t in quickTags" :key="t.tag" class="chip sm" @click="startTag(t.tag)">
          <AppIcon name="layers" :size="12" />
          {{ tagLabel(t.tag) }}<span class="chip-count">{{ t.count }}</span>
        </button>
      </div>
    </div>

    <div v-if="!filtered.length" class="empty" style="margin-top: 12px">
      <div class="empty-title">没有命中的题目</div>
      <p class="empty-desc">换个关键词，或清空筛选条件</p>
      <button class="btn btn-sm" style="margin-top: 12px" @click="resetFilters">清空筛选</button>
    </div>

    <template v-else>
      <div class="list-head">
        <span>{{ activeFilterCount ? '筛选结果' : '全部题目' }}</span>
        <span class="muted">{{ filtered.length }} 题</span>
      </div>

      <div class="q-list">
        <div v-for="q in filtered" :key="q.id" class="q-row" @click="detail = q">
          <i class="q-status" :class="statusClass(q.id)" />
          <div class="q-body">
            <div class="q-title">{{ plain(q.title, 96) }}</div>
            <div class="q-foot">
              <span class="pill pill-diff" :class="`diff-${q.difficulty}`">
                {{ DIFFICULTY_NAME[q.difficulty] }}
              </span>
              <span>{{ SUBJECT_NAME[q.subject] }}</span>
              <span>{{ TYPE_NAME[q.type] }}</span>
              <span class="q-id">{{ q.id }}</span>
              <span v-if="progress.meta.stars[q.id]" style="color: var(--warn); display: inline-flex">
                <AppIcon name="star-fill" :size="12" />
              </span>
              <span v-if="progress.meta.notes[q.id]" class="tag">有笔记</span>
              <span v-if="progress.isInReview(q.id)" class="tag">复习中</span>
            </div>
          </div>
          <span class="q-chevron"><AppIcon name="chevron-right" :size="16" /></span>
        </div>
      </div>
    </template>

    <QuestionDetailDialog :question="detail" @close="detail = null" @edit="openEdit" />
    <EditQuestionDialog :question="editing" @close="editing = null" />
  </div>
</template>
