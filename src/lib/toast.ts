import { ref } from 'vue'

export interface ToastItem {
  id: number
  text: string
  kind: 'ok' | 'info' | 'bad'
}

export const toasts = ref<ToastItem[]>([])

let seq = 0

/** 轻量全局提示：只用于「操作已被系统接收」这类需要立即确认的反馈 */
export function toast(text: string, kind: ToastItem['kind'] = 'ok'): void {
  const id = ++seq
  toasts.value = [...toasts.value, { id, text, kind }]
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 2200)
}
