import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Session, SessionMode } from '../types'
import { KEYS, read, write } from '../lib/storage'

export { shuffle } from '../lib/array'

export const useSessionStore = defineStore('session', () => {
  /** 持久化的一轮练习，中途退出可继续 */
  const session = ref<Session | null>(read<Session | null>(KEYS.session, null))
  watch(session, (v) => write(KEYS.session, v), { deep: true })

  function start(opts: {
    mode: SessionMode
    label: string
    qids: string[]
    tag?: string
  }): void {
    session.value = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      mode: opts.mode,
      label: opts.label,
      tag: opts.tag,
      qids: opts.qids,
      index: 0,
      results: [],
      startedAt: Date.now(),
    }
  }

  function recordResult(qid: string, correct: boolean): void {
    if (!session.value) return
    session.value.results.push({ qid, correct })
  }

  function next(): void {
    if (!session.value) return
    if (session.value.index < session.value.qids.length) session.value.index += 1
  }

  /** 重新开始同一套题 */
  function retry(): void {
    if (!session.value) return
    session.value.index = 0
    session.value.results = []
    session.value.startedAt = Date.now()
  }

  function clear(): void {
    session.value = null
  }

  const finished = computed(
    () => Boolean(session.value) && session.value!.index >= session.value!.qids.length,
  )

  const currentQid = computed(() => session.value?.qids[session.value.index] ?? null)

  const correctCount = computed(
    () => session.value?.results.filter((r) => r.correct).length ?? 0,
  )

  return {
    session,
    finished,
    currentQid,
    correctCount,
    start,
    recordResult,
    next,
    retry,
    clear,
  }
})
