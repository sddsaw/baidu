<template>
  <div class="window-titlebar">
    <div class="titlebar-left">
      <div class="app-logo">P</div>
      <span class="app-title-text">Proxima</span>
      <el-tag size="small" effect="dark" type="info" class="app-badge">
        Factory Test - Full (Online)
      </el-tag>
    </div>
    <div class="titlebar-right">
      <el-tag size="small" type="success" effect="plain" class="hw-mutex-tag">
        MUTEX: STRICT [LOCKED]
      </el-tag>
      <el-tooltip :content="isFullscreen ? '还原窗口' : '最大化窗口'" placement="bottom">
        <el-button
          class="titlebar-btn"
          size="small"
          text
          @click="$emit('toggle-fullscreen')"
        >
          <el-icon :size="14">
            <CopyDocument v-if="isFullscreen" />
            <FullScreen v-else />
          </el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CopyDocument, FullScreen } from '@element-plus/icons-vue'

defineProps<{
  isFullscreen: boolean
}>()

defineEmits<{
  (e: 'toggle-fullscreen'): void
}>()
</script>

<style scoped>
.window-titlebar {
  background: linear-gradient(to right, #1e293b, #0f172a);
  color: #f1f5f9;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
  user-select: none;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-logo {
  width: 18px;
  height: 18px;
  background-color: #2563eb;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #ffffff;
  font-size: 11px;
}

.app-title-text {
  font-weight: 600;
  letter-spacing: 0.5px;
  font-size: 14px;
  color: #f8fafc;
}

.app-badge {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #cbd5e1 !important;
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hw-mutex-tag {
  font-family: ui-monospace, Menlo, Consolas, monospace;
}

.titlebar-btn {
  color: #94a3b8;
  padding: 4px 8px;
}

.titlebar-btn:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.12);
}
</style>
