<script setup lang="ts">
import { computed } from 'vue'

export type IconName =
  | 'today'
  | 'bank'
  | 'review'
  | 'stats'
  | 'settings'
  | 'star'
  | 'star-fill'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-left'
  | 'close'
  | 'edit'
  | 'check'
  | 'x'
  | 'clock'
  | 'link'
  | 'search'
  | 'note'
  | 'layers'
  | 'target'
  | 'trash'

const ICONS: Record<IconName, string> = {
  today:
    '<rect x="3.2" y="4.8" width="17.6" height="15.4" rx="2.6"/><path d="M8 3.2v3.2M16 3.2v3.2M3.2 9.6h17.6"/><path d="M9 14.2l2.1 2.1 4-4.1"/>',
  bank: '<path d="M12 3.3l8.4 4.5-8.4 4.5-8.4-4.5L12 3.3z"/><path d="M3.6 12.2l8.4 4.5 8.4-4.5"/><path d="M3.6 16.6l8.4 4.5 8.4-4.5"/>',
  review:
    '<path d="M20 11.4a8.2 8.2 0 0 0-14.1-4.9L3.6 8.8"/><path d="M3.6 4.2v4.6h4.6"/><path d="M4 12.6a8.2 8.2 0 0 0 14.1 4.9l2.3-2.3"/><path d="M20.4 19.8v-4.6h-4.6"/>',
  stats: '<path d="M5.5 20.2v-5.6M12 20.2V7.4M18.5 20.2v-8.6"/><path d="M3.2 20.2h17.6"/>',
  settings:
    '<path d="M4 7.4h8.2M17.4 7.4H20M4 16.6h3.4M12.6 16.6H20"/><circle cx="14.8" cy="7.4" r="2.4"/><circle cx="9.8" cy="16.6" r="2.4"/>',
  star: '<path d="M12 3.8l2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.82l-5.1 2.68.97-5.68L3.75 9.8l5.7-.83L12 3.8z"/>',
  'star-fill':
    '<path fill="currentColor" d="M12 3.8l2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.82l-5.1 2.68.97-5.68L3.75 9.8l5.7-.83L12 3.8z"/>',
  'chevron-right': '<path d="M9.5 5.5l6.5 6.5-6.5 6.5"/>',
  'chevron-down': '<path d="M5.5 9.5l6.5 6.5 6.5-6.5"/>',
  'chevron-left': '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  close: '<path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8"/>',
  edit: '<path d="M4.2 19.8h3.4L19 8.4a2.4 2.4 0 0 0-3.4-3.4L4.4 16.4l-.2 3.4z"/><path d="M14.4 6.4l3.2 3.2"/>',
  check: '<path d="M4.8 12.4l4.8 4.8 9.6-10.4"/>',
  x: '<path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6"/>',
  clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.4V12l3.1 2"/>',
  link: '<path d="M13.6 4.2h6.2v6.2"/><path d="M19.8 4.2L10.6 13.4"/><path d="M18.2 13.6v4.4a1.8 1.8 0 0 1-1.8 1.8H5.6a1.8 1.8 0 0 1-1.8-1.8V7.2a1.8 1.8 0 0 1 1.8-1.8h4.4"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.4"/><path d="M15.6 15.6L20.4 20.4"/>',
  note: '<path d="M5.4 4.6h8.2l5 5v9.8a1.6 1.6 0 0 1-1.6 1.6H5.4a1.6 1.6 0 0 1-1.6-1.6V6.2a1.6 1.6 0 0 1 1.6-1.6z"/><path d="M13.4 4.6v5.2h5.2"/><path d="M8 13.4h6M8 16.8h4"/>',
  layers: '<path d="M4 8.4l8-3.6 8 3.6-8 3.6-8-3.6z"/><path d="M4 12.6l8 3.6 8-3.6"/><path d="M4 16.8l8 3.6 8-3.6"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
  trash:
    '<path d="M4.4 7h15.2"/><path d="M9.4 7V4.8h5.2V7"/><path d="M6.4 7l.9 12.2h9.4L17.6 7"/>',
}

const props = withDefaults(defineProps<{ name: IconName; size?: number; stroke?: number }>(), {
  size: 18,
  stroke: 1.7,
})

const inner = computed(() => ICONS[props.name])
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="inner"
  />
</template>
