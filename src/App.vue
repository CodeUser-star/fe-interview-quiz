<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AppIcon from './components/AppIcon.vue'
import type { IconName } from './components/AppIcon.vue'
import ToastHost from './components/ToastHost.vue'
import { useSettingsStore } from './stores/settings'
import { useProgressStore } from './stores/progress'
import { storageError } from './lib/storage'
import { toast } from './lib/toast'

const route = useRoute()
const settings = useSettingsStore()
const progress = useProgressStore()

const focusMode = computed(() => route.meta.focus === true)

const navs: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: '今日', icon: 'today' },
  { to: '/bank', label: '题库', icon: 'bank' },
  { to: '/review', label: '复习', icon: 'review' },
  { to: '/stats', label: '统计', icon: 'stats' },
  { to: '/settings', label: '设置', icon: 'settings' },
]

function isActive(to: string): boolean {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

// ---------- 主题：深色 / 浅色 / 跟随系统 ----------
const mq = window.matchMedia('(prefers-color-scheme: light)')
const systemLight = ref(mq.matches)
const onSystemChange = (e: MediaQueryListEvent) => (systemLight.value = e.matches)
mq.addEventListener('change', onSystemChange)
onBeforeUnmount(() => mq.removeEventListener('change', onSystemChange))

const resolvedTheme = computed(() => {
  if (settings.theme === 'system') return systemLight.value ? 'light' : 'dark'
  return settings.theme
})

watch(
  resolvedTheme,
  (v) => {
    document.documentElement.dataset.theme = v
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', v === 'light' ? '#f4f6f9' : '#0a0c11')
  },
  { immediate: true },
)

// ---------- 打卡判定 ----------
const wasChecked = ref(progress.checkedInToday)

watch(
  [() => progress.todayCount, () => progress.dueCount, () => settings.dailyGoal],
  () => {
    const done = progress.markCheckinIfDone(settings.dailyGoal)
    if (done && !wasChecked.value) {
      wasChecked.value = true
      toast('今日打卡成功')
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="shell" :class="{ focus: focusMode }">
    <nav v-if="!focusMode" class="nav">
      <div class="brand">
        <span class="brand-mark">刷</span>
        <span class="brand-text">
          前端面试刷题
          <span class="brand-sub">校招 · 离线可用</span>
        </span>
      </div>

      <div class="nav-list">
        <RouterLink
          v-for="item in navs"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <span class="nav-icon"><AppIcon :name="item.icon" :size="18" /></span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.to === '/review' && progress.dueCount > 0" class="nav-badge">
            {{ progress.dueCount > 99 ? '99+' : progress.dueCount }}
          </span>
        </RouterLink>
      </div>
    </nav>

    <main class="main">
      <div v-if="storageError" class="page" style="padding-bottom: 0">
        <div class="banner">{{ storageError }}</div>
      </div>
      <RouterView />
    </main>

    <ToastHost />
  </div>
</template>
