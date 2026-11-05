<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Question } from '../types'
import { useBankStore } from '../stores/bank'
import { toast } from '../lib/toast'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ question: Question | null }>()
const emit = defineEmits<{ close: [] }>()

const bank = useBankStore()

const title = ref('')
const analysis = ref('')
const picked = ref<number[]>([])
const judgeValue = ref(true)
const error = ref('')

watch(
  () => props.question,
  (q) => {
    if (!q) return
    title.value = q.title
    analysis.value = q.analysis
    error.value = ''
    if (q.type === 'judge') {
      judgeValue.value = q.answer === true
      picked.value = []
    } else if (Array.isArray(q.answer)) {
      picked.value = [...q.answer]
    } else {
      picked.value = []
    }
  },
  { immediate: true },
)

const needsAnswer = computed(
  () => props.question?.type === 'single' || props.question?.type === 'multi',
)

function togglePick(i: number): void {
  if (!props.question) return
  if (props.question.type === 'single') {
    picked.value = [i]
    return
  }
  picked.value = picked.value.includes(i)
    ? picked.value.filter((n) => n !== i)
    : [...picked.value, i].sort((a, b) => a - b)
}

function save(): void {
  const q = props.question
  if (!q) return
  if (!title.value.trim()) {
    error.value = '题干不能为空'
    return
  }
  if (!analysis.value.trim()) {
    error.value = '解析不能为空'
    return
  }
  if (needsAnswer.value && picked.value.length === 0) {
    error.value = '请设置正确答案'
    return
  }

  const patch: Partial<Question> = {
    title: title.value.trim(),
    analysis: analysis.value.trim(),
  }
  if (q.type === 'judge') patch.answer = judgeValue.value
  else if (needsAnswer.value) patch.answer = [...picked.value].sort((a, b) => a - b)

  bank.updateQuestion(q.id, patch)
  toast('已保存修改')
  emit('close')
}

function restore(): void {
  const q = props.question
  if (!q) return
  bank.resetEdit(q.id)
  const fresh = bank.byId[q.id]
  if (fresh) {
    title.value = fresh.title
    analysis.value = fresh.analysis
    picked.value = Array.isArray(fresh.answer) ? [...fresh.answer] : []
    judgeValue.value = fresh.answer === true
    error.value = ''
  }
}

// Esc 关闭
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
  <div v-if="question" class="mask" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-head">
        <div>
          <h3 class="dialog-title">编辑题目</h3>
          <p class="dialog-sub">
            {{ question.id }} ·
            {{ bank.isBuiltin(question.id) ? '内置题（改动仅存本地）' : '自定义题' }}
          </p>
        </div>
        <button class="icon-btn" @click="emit('close')">
          <AppIcon name="close" :size="16" />
        </button>
      </div>

      <div class="dialog-body">
        <div class="field">
          <label>题干 · 支持 Markdown</label>
          <textarea v-model="title" rows="5" />
        </div>

        <div v-if="question.type === 'judge'" class="field">
          <label>正确答案</label>
          <div class="seg">
            <button :class="{ active: judgeValue === true }" @click="judgeValue = true">正确</button>
            <button :class="{ active: judgeValue === false }" @click="judgeValue = false">错误</button>
          </div>
        </div>

        <div v-else-if="needsAnswer" class="field">
          <label>正确答案{{ question.type === 'multi' ? '（可多选）' : '' }}</label>
          <div class="check-list">
            <label
              v-for="(opt, i) in question.options"
              :key="i"
              class="check"
              :class="{ on: picked.includes(i) }"
            >
              <input
                :type="question.type === 'multi' ? 'checkbox' : 'radio'"
                :checked="picked.includes(i)"
                @change="togglePick(i)"
              />
              <span>{{ String.fromCharCode(65 + i) }}. {{ opt }}</span>
            </label>
          </div>
        </div>

        <div v-else class="field">
          <label>答案</label>
          <p class="hint" style="margin: 0">简答 / 手撕为自判题型，无需设置答案。</p>
        </div>

        <div class="field" style="margin-bottom: 0">
          <label>解析 · 支持 Markdown</label>
          <textarea v-model="analysis" rows="6" />
        </div>

        <div v-if="error" class="banner" style="margin: 12px 0 0">{{ error }}</div>
      </div>

      <div class="dialog-foot">
        <button
          v-if="bank.isBuiltin(question.id)"
          class="btn btn-sm btn-ghost"
          @click="restore"
        >
          还原内置原题
        </button>
        <span v-else />
        <div class="btn-row">
          <button class="btn" @click="emit('close')">取消</button>
          <button class="btn btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
