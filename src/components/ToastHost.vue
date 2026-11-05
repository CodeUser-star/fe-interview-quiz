<script setup lang="ts">
import { toasts } from '../lib/toast'
import AppIcon from './AppIcon.vue'
</script>

<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="t.kind">
          <AppIcon :name="t.kind === 'bad' ? 'x' : 'check'" :size="14" :stroke="2.2" />
          <span>{{ t.text }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
