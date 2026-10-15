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
  display: flex;
  justify-content: center;
}

.instrument-view-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-bottom: 24px;
}
</style>
