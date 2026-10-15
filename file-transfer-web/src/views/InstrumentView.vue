<template>
  <div class="instrument-page">
    <div class="instrument-view-wrapper">
      <DcViInstrument />
    </div>
  </div>
</template>

<script setup lang="ts">
import DcViInstrument from '@/components/DcViInstrument.vue'
</script>

<style scoped>
.instrument-page {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 120px);
  display: flex;
  justify-content: center;
}

.instrument-view-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
}
</style>
