<template>
  <div class="app-tabbar">
    <el-tabs
      :model-value="modelValue"
      @tab-change="$emit('update:modelValue', $event as any)"
      type="card"
      class="maintenance-tabs"
    >
      <el-tab-pane label="MaintenanceTest" name="MaintenanceTest" />
      <el-tab-pane label="Calibration" name="Calibration" />
      <el-tab-pane label="EQM" name="EQM" />
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: 'MaintenanceTest' | 'Calibration' | 'EQM'
}>()

defineEmits<{
  (e: 'update:modelValue', tab: 'MaintenanceTest' | 'Calibration' | 'EQM'): void
}>()
</script>

<style scoped>
.app-tabbar {
  background-color: #cbd5e1;
  border-bottom: 1px solid #94a3b8;
  padding: 4px 14px 0 14px;
  flex-shrink: 0;
  user-select: none;
}

:deep(.el-tabs--card > .el-tabs__header) {
  border-bottom: none;
  margin: 0;
}

:deep(.el-tabs--card > .el-tabs__header .el-tabs__nav) {
  border: none;
  gap: 4px;
}

:deep(.el-tabs--card > .el-tabs__header .el-tabs__item) {
  border: none;
  border-top: 2px solid transparent;
  background-color: #cbd5e1;
  color: #475569;
  font-weight: 500;
  font-size: 13px;
  padding: 0 20px;
  height: 34px;
  line-height: 34px;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  transition: none !important;
}

:deep(.el-tabs--card > .el-tabs__header .el-tabs__item:hover) {
  background-color: #e2e8f0;
  color: #1e293b;
}

:deep(.el-tabs--card > .el-tabs__header .el-tabs__item.is-active) {
  background-color: #ffffff;
  color: #1d4ed8;
  font-weight: 700;
  border-top: 2px solid #2563eb;
}
</style>
