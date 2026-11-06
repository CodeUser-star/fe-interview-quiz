<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Difficulty, Question, QuestionType, Subject } from '../types'
import { SUBJECTS, TYPE_NAME } from '../types'
import { useBankStore } from '../stores/bank'
import { toast } from '../lib/toast'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const bank = useBankStore()

const type = ref<QuestionType>('single')
const subject = ref<Subject>('js')
const difficulty = ref<Difficulty>(1)
const tagsText = ref('')
const title = ref('')
const optionsText = ref('')
const judgeValue = ref(true)
const answerText = ref('')
const analysis = ref('')
const pointsText = ref('')
const error = ref('')

watch(
  () => props.open,
  (v) => {
    if (!v) return
    type.value = 'single'
    subject.value = 'js'
    difficulty.value = 1
    tagsText.value = ''
    title.value = ''
    optionsText.value = ''
    judgeValue.value = true
    answerText.value = ''
    analysis.value = ''
    pointsText.value = ''
    error.value = ''
  },
)

const types: QuestionType[] = ['single', 'multi', 'judge', 'short', 'code']

function save(): void {
  const isChoice = type.value === 'single' || type.value === 'multi'
  const options = optionsText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  let answer: number[] | boolean | undefined
  if (type.value === 'judge') {
    answer = judgeValue.value
  } else if (isChoice) {
    // 答案填选项字母或序号：A / AC / 1 / 1,3（字母从 A 起，序号从 1 起）
    answer = answerText.value
      .split(/[\s,，]+/)
      .filter(Boolean)
      .map((s) => (/^[A-Za-z]$/.test(s) ? s.toUpperCase().charCodeAt(0) - 65 : Number(s) - 1))
  }
  const q: Question = {
    id: `q-custom-${Date.now().toString(36)}`,
    type: type.value,
    subject: subject.value,
    difficulty: difficulty.value,
    tags: tagsText.value
      .split(/[\s,，]+/)
      .map((s) => s.trim())
      .filter(Boolean),
    title: title.value.trim(),
    analysis: analysis.value.trim(),
    ...(isChoice ? { options, answer } : {}),
    ...(type.value === 'judge' ? { answer } : {}),
  }
  const points = pointsText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  if (points.length) q.points = points

  const r = bank.addQuestion(q)
  if (!r.ok) {
    error.value = r.error ?? '校验失败'
    return
  }
  toast('已添加题目')
  emit('close')
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="open" class="mask" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-head">
        <div>
          <h3 class="dialog-title">手动加题</h3>
          <p class="dialog-sub">加入自定义题库，与内置题一样可刷可复习</p>
        </div>
        <button class="icon-btn" @click="emit('close')">
          <AppIcon name="close" :size="16" />
        </button>
      </div>

      <div class="dialog-body">
        <div class="field">
          <label>题型 / 科目 / 难度</label>
          <div class="btn-row" style="flex-wrap: wrap; gap: 8px">
            <div class="seg">
              <button
                v-for="t in types"
                :key="t"
                :class="{ active: type === t }"
                @click="type = t"
              >
                {{ TYPE_NAME[t] }}
              </button>
            </div>
            <select v-model="subject" class="num-input" style="width: auto">
              <option v-for="s in SUBJECTS" :key="s.key" :value="s.key">{{ s.name }}</option>
            </select>
            <div class="seg">
              <button :class="{ active: difficulty === 1 }" @click="difficulty = 1">简单</button>
              <button :class="{ active: difficulty === 2 }" @click="difficulty = 2">中等</button>
              <button :class="{ active: difficulty === 3 }" @click="difficulty = 3">困难</button>
            </div>
          </div>
        </div>

        <div class="field">
          <label>标签（空格或逗号分隔，可留空）</label>
          <input v-model="tagsText" class="num-input" style="width: 100%" placeholder="如 nowcoder-hot must-know" />
        </div>

        <div class="field">
          <label>题干 · 支持 Markdown</label>
          <textarea v-model="title" rows="4" />
        </div>

        <template v-if="type === 'single' || type === 'multi'">
          <div class="field">
            <label>选项（一行一个）</label>
            <textarea v-model="optionsText" rows="4" />
          </div>
          <div class="field">
            <label>正确答案（字母如 A 或 AC，或序号如 1 / 1,3）</label>
            <input v-model="answerText" class="num-input" style="width: 160px" placeholder="A" />
          </div>
        </template>

        <div v-else-if="type === 'judge'" class="field">
          <label>正确答案</label>
          <div class="seg">
            <button :class="{ active: judgeValue === true }" @click="judgeValue = true">正确</button>
            <button :class="{ active: judgeValue === false }" @click="judgeValue = false">错误</button>
          </div>
        </div>

        <div v-if="type === 'short' || type === 'code'" class="field">
          <label>答题要点（一行一个，可留空）</label>
          <textarea v-model="pointsText" rows="4" />
        </div>

        <div class="field" style="margin-bottom: 0">
          <label>解析 · 支持 Markdown</label>
          <textarea v-model="analysis" rows="5" />
        </div>

        <div v-if="error" class="banner" style="margin: 12px 0 0">{{ error }}</div>
      </div>

      <div class="dialog-foot">
        <span />
        <div class="btn-row">
          <button class="btn" @click="emit('close')">取消</button>
          <button class="btn btn-primary" @click="save">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>
