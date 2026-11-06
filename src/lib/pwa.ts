import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/** 新版本就绪标记：SW 已下载完，等用户确认后刷新生效 */
export const needRefresh = ref(false)

export const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    needRefresh.value = true
  },
})
