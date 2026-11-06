import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Settings, ThemeMode } from '../types'
import { KEYS, read, write } from '../lib/storage'

const DEFAULTS: Settings = { theme: 'system', dailyGoal: 30, syncUrl: '', syncUser: '', syncPass: '' }

export const useSettingsStore = defineStore('settings', () => {
  const stored = read<Partial<Settings>>(KEYS.settings, {})
  const theme = ref<ThemeMode>(stored.theme ?? DEFAULTS.theme)
  const dailyGoal = ref<number>(
    typeof stored.dailyGoal === 'number' && stored.dailyGoal > 0 ? stored.dailyGoal : DEFAULTS.dailyGoal,
  )
  const syncUrl = ref(stored.syncUrl ?? DEFAULTS.syncUrl)
  const syncUser = ref(stored.syncUser ?? DEFAULTS.syncUser)
  const syncPass = ref(stored.syncPass ?? DEFAULTS.syncPass)

  watch([theme, dailyGoal, syncUrl, syncUser, syncPass], () =>
    write(KEYS.settings, {
      theme: theme.value,
      dailyGoal: dailyGoal.value,
      syncUrl: syncUrl.value,
      syncUser: syncUser.value,
      syncPass: syncPass.value,
    }),
  )

  function setTheme(v: ThemeMode): void {
    theme.value = v
  }

  function setDailyGoal(v: number): void {
    dailyGoal.value = Math.max(1, Math.min(500, Math.round(v) || DEFAULTS.dailyGoal))
  }

  function setSync(url: string, user: string, pass: string): void {
    syncUrl.value = url.trim().replace(/\/+$/, '')
    syncUser.value = user.trim()
    syncPass.value = pass
  }

  return { theme, dailyGoal, syncUrl, syncUser, syncPass, setTheme, setDailyGoal, setSync }
})
