import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * hash 模式：GitHub Pages 子路径部署无需额外 fallback 配置
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'today', component: () => import('./views/TodayView.vue') },
    { path: '/bank', name: 'bank', component: () => import('./views/BankView.vue') },
    {
      path: '/quiz',
      name: 'quiz',
      component: () => import('./views/QuizView.vue'),
      meta: { focus: true },
    },
    { path: '/result', name: 'result', component: () => import('./views/ResultView.vue') },
    { path: '/review', name: 'review', component: () => import('./views/ReviewView.vue') },
    { path: '/stats', name: 'stats', component: () => import('./views/StatsView.vue') },
    { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
