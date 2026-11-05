import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Question } from '../types'
import { SEED_QUESTIONS } from '../data/questions'
import { KEYS, read, write } from '../lib/storage'
import { validateQuestion, validateQuestionList } from '../lib/validate'

/**
 * 题库：内置题 + 用户改动（overrides）+ 自定义题
 * 不改内置数据本身，改动以 patch 形式存 localStorage，后续批量补题不会覆盖用户修正
 */
export const useBankStore = defineStore('bank', () => {
  const edits = ref<Record<string, Partial<Question>>>(read(KEYS.edits, {}))
  const custom = ref<Question[]>(read(KEYS.custom, []))

  watch(edits, (v) => write(KEYS.edits, v), { deep: true })
  watch(custom, (v) => write(KEYS.custom, v), { deep: true })

  const questions = computed<Question[]>(() => {
    const builtin = SEED_QUESTIONS.map((q) => ({ ...q, ...edits.value[q.id] }))
    return [...builtin, ...custom.value]
  })

  const byId = computed<Record<string, Question>>(() => {
    const map: Record<string, Question> = {}
    for (const q of questions.value) map[q.id] = q
    return map
  })

  const tagStats = computed(() => {
    const counts = new Map<string, number>()
    for (const q of questions.value) {
      for (const t of q.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  })

  function isBuiltin(id: string): boolean {
    return SEED_QUESTIONS.some((q) => q.id === id)
  }

  /** 编辑题干 / 答案 / 解析（以及其它字段） */
  function updateQuestion(id: string, patch: Partial<Question>): void {
    if (isBuiltin(id)) {
      edits.value = { ...edits.value, [id]: { ...edits.value[id], ...patch } }
      return
    }
    custom.value = custom.value.map((q) => (q.id === id ? { ...q, ...patch } : q))
  }

  function addQuestion(q: Question): { ok: boolean; error?: string } {
    const r = validateQuestion(q)
    if (!r.ok || !r.question) return { ok: false, error: r.errors.join('；') }
    if (byId.value[r.question.id]) return { ok: false, error: `题目 id 已存在：${r.question.id}` }
    custom.value = [...custom.value, r.question]
    return { ok: true }
  }

  function removeCustom(id: string): void {
    if (isBuiltin(id)) return
    custom.value = custom.value.filter((q) => q.id !== id)
  }

  /** 重置某一题的改动，回到内置原始内容 */
  function resetEdit(id: string): void {
    const next = { ...edits.value }
    delete next[id]
    edits.value = next
  }

  function importQuestions(raw: unknown): { ok: boolean; added: number; errors: string[] } {
    const r = validateQuestionList(raw)
    const added: Question[] = []
    const errors = [...r.errors]
    for (const q of r.questions) {
      if (byId.value[q.id]) {
        // 同 id 的按覆盖处理，便于用 JSON 批量修正
        updateQuestion(q.id, q)
        continue
      }
      added.push(q)
    }
    if (added.length) custom.value = [...custom.value, ...added]
    return { ok: errors.length === 0, added: added.length, errors }
  }

  return {
    edits,
    custom,
    questions,
    byId,
    tagStats,
    isBuiltin,
    updateQuestion,
    resetEdit,
    addQuestion,
    removeCustom,
    importQuestions,
  }
})
