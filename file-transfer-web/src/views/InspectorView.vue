<template>
  <div class="inspector-view-container">
    <div class="inspector-wrapper">
      <AteInspector />
    </div>
  </div>
</template>

<script setup lang="ts">
import AteInspector from '@/components/AteInspector.vue';
</script>

<style scoped>
.inspector-view-container {
  width: 100%;
  min-height: 100vh;
  background-color: #121212;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
}

.inspector-wrapper {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
