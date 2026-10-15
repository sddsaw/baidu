<template>
  <div class="ic-surface-page">
    <div class="surface-view-wrapper">
      <ICSurfacePlot />
    </div>
  </div>
</template>

<script setup lang="ts">
import ICSurfacePlot from '@/components/ICSurfacePlot.vue'
</script>

<style scoped>
.ic-surface-page {
  width: 100%;
}

.surface-view-wrapper {
  width: 100%;
  height: calc(100vh - 116px);
  min-height: 680px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}
</style>
