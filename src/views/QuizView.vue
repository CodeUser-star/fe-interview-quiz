<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBankStore } from '../stores/bank'
import { useSessionStore } from '../stores/session'
import QuizRunner from '../components/QuizRunner.vue'

const router = useRouter()
const bank = useBankStore()
const sessionStore = useSessionStore()

const question = computed(() =>
  sessionStore.currentQid ? (bank.byId[sessionStore.currentQid] ?? null) : null,
)
</script>

<template>
  <QuizRunner v-if="question" :key="question.id" :question="question" />

  <div v-else class="page">
    <div class="empty">
      <div class="empty-title">
        <template v-if="sessionStore.session && sessionStore.finished">这一轮已经做完了</template>
        <template v-else-if="sessionStore.session">题目已不存在（可能被删除）</template>
        <template v-else>还没有进行中的练习</template>
      </div>

      <div class="btn-row" style="justify-content: center; margin-top: 14px">
        <button
          v-if="sessionStore.session && sessionStore.finished"
          class="btn btn-primary"
          @click="router.push('/result')"
        >
          查看结算
        </button>
        <button class="btn" @click="router.push('/')">回到今日</button>
        <button class="btn btn-ghost" @click="router.push('/bank')">去题库</button>
      </div>
    </div>
  </div>
</template>
