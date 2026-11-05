import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Settings, ThemeMode } from '../types'
import { KEYS, read, write } from '../lib/storage'

const DEFAULTS: Settings = { theme: 'system', dailyGoal: 30 }

export const useSettingsStore = defineStore('settings', () => {
  const stored = read<Partial<Settings>>(KEYS.settings, {})
  const theme = ref<ThemeMode>(stored.theme ?? DEFAULTS.theme)
  const dailyGoal = ref<number>(
    typeof stored.dailyGoal === 'number' && stored.dailyGoal > 0 ? stored.dailyGoal : DEFAULTS.dailyGoal,
  )

  watch([theme, dailyGoal], () => write(KEYS.settings, { theme: theme.value, dailyGoal: dailyGoal.value }))

  function setTheme(v: ThemeMode): void {
    theme.value = v
  }

  function setDailyGoal(v: number): void {
    dailyGoal.value = Math.max(1, Math.min(500, Math.round(v) || DEFAULTS.dailyGoal))
  }

  return { theme, dailyGoal, setTheme, setDailyGoal }
})
