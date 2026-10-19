<template>
  <div class="app-toolbar">
    <div class="toolbar-left">
      <!-- 运行/暂停/停止按钮组 (Element Plus) -->
      <el-button-group>
        <el-tooltip content="运行测试 (F5)" placement="bottom">
          <el-button
            type="success"
            size="small"
            :disabled="isRunning"
            @click="$emit('start-execution')"
          >
            <el-icon class="el-icon--left"><CaretRight /></el-icon>
            Run Test
          </el-button>
        </el-tooltip>
        <el-tooltip content="暂停测试 (F6)" placement="bottom">
          <el-button
            size="small"
            :disabled="!isRunning"
            @click="$emit('pause-execution')"
          >
            <el-icon><VideoPause /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="终止测试 (F7 / Esc)" placement="bottom">
          <el-button
            type="danger"
            size="small"
            :disabled="!isRunning"
            @click="$emit('stop-execution')"
          >
            <el-icon><SwitchButton /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" class="toolbar-el-divider" />

      <!-- 参数选项 (Element Plus) -->
      <div class="toolbar-params">
        <div class="param-item">
          <span class="param-label">Test Coverage:</span>
          <el-select
            :model-value="testCoverage"
            @update:model-value="$emit('update:testCoverage', $event)"
            size="small"
            style="width: 170px"
          >
            <el-option label="Full" value="Full" />
            <el-option label="Quick Diagnostic" value="Quick Diagnostic" />
            <el-option label="Calibration Only" value="Calibration Only" />
          </el-select>
        </div>
        <div class="param-item">
          <span class="param-label">Loop (Quantity):</span>
          <el-input-number
            :model-value="loopQuantity"
            @update:model-value="$emit('update:loopQuantity', $event || 1)"
            :min="1"
            :max="100"
            size="small"
            controls-position="right"
            style="width: 95px"
          />
        </div>
      </div>
    </div>

    <!-- 右侧操作按钮组 (Element Plus) -->
    <div class="toolbar-right">
      <el-button-group size="small">
        <el-button @click="$emit('expand-all', true)" title="全部展开左右树形层级">
          <el-icon class="el-icon--left"><FolderOpened /></el-icon>
          展开所有
        </el-button>
        <el-button @click="$emit('expand-all', false)" title="全部折叠左右树形层级">
          <el-icon class="el-icon--left"><Folder /></el-icon>
          折叠所有
        </el-button>
        <el-button @click="$emit('toggle-all-checkboxes', true)" title="勾选所有待测项">
          <el-icon class="el-icon--left"><Check /></el-icon>
          全选
        </el-button>
        <el-button @click="$emit('toggle-all-checkboxes', false)" title="清空勾选">
          <el-icon class="el-icon--left"><Close /></el-icon>
          清空
        </el-button>
      </el-button-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CaretRight,
  VideoPause,
  SwitchButton,
  FolderOpened,
  Folder,
  Check,
  Close
} from '@element-plus/icons-vue'

defineProps<{
  isRunning: boolean
  testCoverage: string
  loopQuantity: number
}>()

defineEmits<{
  (e: 'update:testCoverage', val: string): void
  (e: 'update:loopQuantity', val: number): void
  (e: 'start-execution'): void
  (e: 'pause-execution'): void
  (e: 'stop-execution'): void
  (e: 'expand-all', expand: boolean): void
  (e: 'toggle-all-checkboxes', checked: boolean): void
}>()
</script>

<style scoped>
.app-toolbar {
  background-color: #f1f5f9;
  border-bottom: 1px solid #cbd5e1;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  user-select: none;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-el-divider {
  height: 20px;
  margin: 0 4px;
  border-color: #cbd5e1;
}

.toolbar-params {
  display: flex;
  align-items: center;
  gap: 16px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-label {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
}
</style>
