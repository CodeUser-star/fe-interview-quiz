<script setup lang="ts">
import { DIFFICULTY_NAME, SUBJECT_NAME, TYPE_NAME, tagLabel } from '../types'
import type { Question } from '../types'

defineProps<{ question: Question; hideType?: boolean }>()
</script>

<template>
  <div class="q-meta">
    <span class="pill pill-diff" :class="`diff-${question.difficulty}`">
      {{ DIFFICULTY_NAME[question.difficulty] }}
    </span>
    <span>{{ SUBJECT_NAME[question.subject] }}</span>
    <span v-if="!hideType" class="tag">{{ TYPE_NAME[question.type] }}</span>
    <span v-for="t in question.tags" :key="t" class="tag">{{ tagLabel(t) }}</span>
  </div>
</template>
