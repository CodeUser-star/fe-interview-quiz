<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import type { Question } from '../types'
import { useProgressStore } from '../stores/progress'
import AppIcon from './AppIcon.vue'
import MarkdownView from './MarkdownView.vue'
import QuestionMeta from './QuestionMeta.vue'

const props = defineProps<{ question: Question | null }>()
const emit = defineEmits<{ close: []; edit: [id: string] }>()

const progress = useProgressStore()

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.question) {
    e.stopPropagation()
    emit('close')
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const correctIndexes = computed<number[]>(() => {
  const a = props.question?.answer
  return Array.isArray(a) ? a : []
})

const judgeText = computed(() => {
  const a = props.question?.answer
  if (typeof a !== 'boolean') return ''
  return a ? '正确' : '错误'
})

const note = computed(() => (props.question ? (progress.meta.notes[props.question.id] ?? '') : ''))
</script>

<template>
  <div v-if="question" class="mask" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-head">
        <div style="min-width: 0">
          <QuestionMeta :question="question" />
          <p class="dialog-sub">{{ question.id }}</p>
        </div>
        <button class="icon-btn" @click="emit('close')">
          <AppIcon name="close" :size="16" />
        </button>
      </div>

      <div class="dialog-body">
        <div class="q-headline" style="font-size: 15.5px; margin: 0 0 16px">
          <MarkdownView :source="question.title" />
        </div>

        <div v-if="question.options?.length" class="options">
          <div
            v-for="(opt, i) in question.options"
            :key="i"
            class="option"
            :class="{ correct: correctIndexes.includes(i) }"
          >
            <span class="option-key">{{ String.fromCharCode(65 + i) }}</span>
            <span class="option-text">{{ opt }}</span>
            <span v-if="correctIndexes.includes(i)" class="option-mark">
              <AppIcon name="check" :size="15" :stroke="2.2" />
            </span>
          </div>
        </div>

        <p v-if="judgeText" class="muted" style="margin: 12px 0 0">
          正确答案 <b style="color: var(--ok)">{{ judgeText }}</b>
        </p>

        <div class="panel open" style="margin-top: 16px">
          <div class="panel-head">解析</div>
          <div class="panel-body">
            <MarkdownView :source="question.analysis" />
          </div>
        </div>

        <div v-if="note" class="panel open" style="margin-top: 10px">
          <div class="panel-head">我的笔记</div>
          <div class="panel-body">
            <MarkdownView :source="note" />
          </div>
        </div>
      </div>

      <div class="dialog-foot">
        <span class="muted">
          {{ progress.isInReview(question.id) ? '在复习队列中' : '' }}
        </span>
        <div class="btn-row">
          <button class="btn btn-ghost" @click="emit('close')">关闭</button>
          <button class="btn btn-primary" @click="emit('edit', question.id)">编辑此题</button>
        </div>
      </div>
    </div>
  </div>
</template>
