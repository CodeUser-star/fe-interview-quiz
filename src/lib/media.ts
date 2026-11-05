import { onBeforeUnmount, ref } from 'vue'

/** 响应式媒体查询，用于「同一份模板、两种端形态」的布局 */
export function useMediaQuery(query: string) {
  const mq = window.matchMedia(query)
  const matches = ref(mq.matches)
  const onChange = (e: MediaQueryListEvent) => (matches.value = e.matches)
  mq.addEventListener('change', onChange)
  onBeforeUnmount(() => mq.removeEventListener('change', onChange))
  return matches
}
