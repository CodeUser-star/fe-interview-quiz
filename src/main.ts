import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { setupSync } from './lib/sync'
import './lib/pwa'
import './style.css'

const app = createApp(App).use(createPinia()).use(router)
app.mount('#app')

// 配置了 WebDAV 才启动同步；失败静默重试，不影响本地
setupSync()
