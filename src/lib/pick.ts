import type { Difficulty, Question } from '../types'
import { shuffle } from './array'

export const LEVELS: Difficulty[] = [1, 2, 3]

export const LEVEL_NAME: Record<Difficulty, string> = {
  1: '简单',
  2: '中等',
  3: '困难',
}

/** 某难度层掌握率达到该比例，即视为「基本掌握」，可进入下一层 */
export const DEFAULT_MASTERY_THRESHOLD = 0.8

export interface StageInfo {
  /** 当前练习所处的难度层 */
  stage: Difficulty
  /** 该层题目总数 */
  total: number
  /** 该层已掌握数 */
  mastered: number
  /** 该层还没掌握的题数 */
  remaining: number
  /** 三层是否都基本掌握 */
  allMastered: boolean
}

export interface ProgressiveInput {
  questions: Question[]
  isMastered: (id: string) => boolean
  /** 不传表示取该阶段全部题目 */
  limit?: number
  masteryThreshold?: number
}

export interface ProgressivePlan extends StageInfo {
  qids: string[]
}

function groupByLevel(questions: Question[]): { level: Difficulty; list: Question[] }[] {
  return LEVELS.map((level) => ({
    level,
    list: questions.filter((q) => q.difficulty === level),
  })).filter((g) => g.list.length > 0)
}

/**
 * 判断当前应练哪一层：从简单开始，掌握率不足阈值就停在这一层；
 * 三层都达标则停在最高层（继续巩固难题）。
 */
export function analyzeStage(
  questions: Question[],
  isMastered: (id: string) => boolean,
  masteryThreshold = DEFAULT_MASTERY_THRESHOLD,
): StageInfo {
  const groups = groupByLevel(questions)
  if (!groups.length) {
    return { stage: 1, total: 0, mastered: 0, remaining: 0, allMastered: false }
  }

  let index = 0
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]
    const mastered = g.list.filter((q) => isMastered(q.id)).length
    index = i
    if (mastered / g.list.length < masteryThreshold) break
  }

  const current = groups[index]
  const mastered = current.list.filter((q) => isMastered(q.id)).length
  return {
    stage: current.level,
    total: current.list.length,
    mastered,
    remaining: current.list.length - mastered,
    allMastered: index === groups.length - 1 && mastered / current.list.length >= masteryThreshold,
  }
}

/**
 * 渐进式抽题：
 * 1. 只抽当前难度层，未掌握的排在前面、已掌握的补在后面；
 * 2. 该层不够 `limit` 时，才用更高一层的题补齐，保证一轮长度；
 * 3. 全程保持难度升序，不出现「先难后易」。
 */
export function pickProgressive(input: ProgressiveInput): ProgressivePlan {
  const { questions, isMastered, limit, masteryThreshold } = input
  const info = analyzeStage(questions, isMastered, masteryThreshold)
  const groups = groupByLevel(questions)

  const currentIndex = groups.findIndex((g) => g.level === info.stage)
  if (currentIndex < 0) return { ...info, qids: [] }

  const current = groups[currentIndex].list
  const unmastered = shuffle(current.filter((q) => !isMastered(q.id)))
  const mastered = shuffle(current.filter((q) => isMastered(q.id)))

  let picked: Question[] = [...unmastered, ...mastered]

  if (typeof limit === 'number' && picked.length < limit) {
    for (let i = currentIndex + 1; i < groups.length && picked.length < limit; i++) {
      const extra = shuffle(groups[i].list.filter((q) => !isMastered(q.id)))
      picked = [...picked, ...extra]
    }
  }

  const finalList = typeof limit === 'number' ? picked.slice(0, limit) : picked
  return { ...info, qids: finalList.map((q) => q.id) }
}
