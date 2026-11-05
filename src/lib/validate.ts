import type { Difficulty, Question, QuestionType, Subject } from '../types'

const TYPES: QuestionType[] = ['single', 'multi', 'judge', 'short', 'code']
const SUBJECT_SET: Subject[] = ['js', 'css', 'vue', 'browser', 'network', 'os', 'db', 'algo']

export interface ValidateResult {
  ok: boolean
  errors: string[]
  question?: Question
}

/** 导入 / 手动加题统一按需求规格第四节 Schema 校验 */
export function validateQuestion(raw: unknown): ValidateResult {
  const errors: string[] = []
  const q = raw as Record<string, unknown>
  if (!q || typeof q !== 'object') return { ok: false, errors: ['不是合法的对象'] }

  const id = typeof q.id === 'string' ? q.id.trim() : ''
  if (!id) errors.push('id 缺失')

  const type = q.type as QuestionType
  if (!TYPES.includes(type)) errors.push(`type 必须是 ${TYPES.join(' / ')}`)

  const subject = q.subject as Subject
  if (!SUBJECT_SET.includes(subject)) errors.push(`subject 必须是 ${SUBJECT_SET.join(' / ')}`)

  const difficulty = Number(q.difficulty) as Difficulty
  if (![1, 2, 3].includes(difficulty)) errors.push('difficulty 必须是 1 / 2 / 3')

  const title = typeof q.title === 'string' ? q.title.trim() : ''
  if (!title) errors.push('title 不能为空')

  const analysis = typeof q.analysis === 'string' ? q.analysis.trim() : ''
  if (!analysis) errors.push('analysis 不能为空')

  const tags = Array.isArray(q.tags)
    ? q.tags.filter((t): t is string => typeof t === 'string')
    : []

  let options = Array.isArray(q.options)
    ? q.options.filter((o): o is string => typeof o === 'string')
    : []
  if (type === 'judge' && options.length === 0) options = ['正确', '错误']

  let answer: number[] | boolean | undefined
  if (type === 'judge') {
    if (typeof q.answer !== 'boolean') errors.push('判断题的 answer 必须是 true / false')
    else answer = q.answer
  } else if (type === 'single' || type === 'multi') {
    if (options.length < 2) errors.push('选择题至少需要 2 个 options')
    if (!Array.isArray(q.answer)) {
      errors.push('选择题的 answer 必须是数组，如 [0]')
    } else {
      const idx = q.answer.filter((n): n is number => typeof n === 'number')
      const unique = [...new Set(idx)]
      if (unique.length !== idx.length) errors.push('answer 存在重复选项')
      if (unique.some((n) => n < 0 || n >= options.length)) errors.push('answer 下标越界')
      if (type === 'single' && unique.length !== 1) errors.push('单选题 answer 只能有 1 项')
      if (type === 'multi' && unique.length < 1) errors.push('多选题 answer 至少 1 项')
      answer = unique.sort((a, b) => a - b)
    }
  }

  if (errors.length) return { ok: false, errors }

  const question: Question = {
    id,
    type,
    subject,
    difficulty,
    tags,
    title,
    analysis,
    ...(options.length ? { options } : {}),
    ...(answer !== undefined ? { answer } : {}),
  }
  if (typeof q.points !== 'undefined')
    question.points = toStringArray(q.points).filter((s) => s.length > 0)
  if (typeof q.followups !== 'undefined')
    question.followups = toStringArray(q.followups).filter((s) => s.length > 0)
  if (typeof q.approach === 'string' && q.approach.trim()) question.approach = q.approach.trim()
  if (typeof q.complexity === 'string' && q.complexity.trim())
    question.complexity = q.complexity.trim()
  if (typeof q.link === 'string' && q.link.trim()) question.link = q.link.trim()

  return { ok: true, errors: [], question }
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((s): s is string => typeof s === 'string')
  return []
}

/** 支持 `[...]` 或 `{ "questions": [...] }` 两种导入格式 */
export function validateQuestionList(raw: unknown): {
  ok: boolean
  questions: Question[]
  errors: string[]
} {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { questions?: unknown }).questions)
      ? ((raw as { questions: unknown[] }).questions)
      : null

  if (!list) return { ok: false, questions: [], errors: ['顶层必须是数组或 { questions: [...] }'] }

  const questions: Question[] = []
  const errors: string[] = []
  list.forEach((item, i) => {
    const r = validateQuestion(item)
    if (r.ok && r.question) questions.push(r.question)
    else errors.push(`第 ${i + 1} 题：${r.errors.join('；')}`)
  })
  return { ok: errors.length === 0, questions, errors }
}
