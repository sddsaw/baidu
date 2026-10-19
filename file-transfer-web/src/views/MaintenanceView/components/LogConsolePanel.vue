<template>
  <div class="console-wrapper">
    <!-- 上下拉伸分割条 (拖拽调节控制台高度，边界约束保护) -->
    <div
      class="console-splitter"
      @mousedown="startConsoleResize"
      title="按住可向上或向下拉伸日志控制台高度"
    >
      <div class="splitter-grip"></div>
    </div>

    <!-- 输出日志控制台主体 -->
    <div
      class="console-panel"
      :style="{ height: `${consoleHeight}px` }"
    >
      <div class="console-header">
        <div class="console-title-box">
          <span class="console-title">Output Log Console</span>
          <el-tag v-if="isRunning" type="primary" size="small" effect="dark" class="running-indicator">
            Running test program...
          </el-tag>
        </div>
        <div class="console-actions">
          <el-checkbox
            :model-value="autoScroll"
            @update:model-value="emit('update:autoScroll', Boolean($event))"
            size="small"
            label="自动滚屏"
            class="autoscroll-chk"
          />
          <el-button
            size="small"
            type="info"
            plain
            @click="emit('clearLogs')"
          >
            <el-icon class="el-icon--left"><Delete /></el-icon>
            清空日志
          </el-button>
        </div>
      </div>

      <!-- 实际日志输出文本区 -->
      <div class="console-body" ref="consoleLogBoxRef">
        <div
          v-for="log in logList"
          :key="log.id"
          class="log-line"
          :class="log.colorClass || 'text-slate-300'"
        >
          {{ log.text }}
        </div>
      </div>

      <!-- 控制台状态细栏 -->
      <div class="console-footer">
        <div class="footer-sys-info">
          <span>Status: <span :class="sysStatusClass">{{ sysStatusText }}</span></span>
          <span>TDI: <span class="text-blue">OK</span></span>
          <span>PWR: <span class="text-success">ON</span></span>
        </div>
        <div class="footer-prog-name">Program: generic_test_runner.so</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import type { LogEntry } from '../types'

const props = defineProps<{
  logList: LogEntry[]
  isRunning: boolean
  sysStatusText: string
  sysStatusClass: string
  consoleHeight: number
  autoScroll: boolean
}>()

const emit = defineEmits<{
  (e: 'update:consoleHeight', val: number): void
  (e: 'update:autoScroll', val: boolean): void
  (e: 'clearLogs'): void
}>()

const consoleLogBoxRef = ref<HTMLElement | null>(null)
let isDraggingConsole = false
let startDragY = 0
let startHeight = 0

// 自动滚动监听
watch(
  () => props.logList.length,
  () => {
    if (props.autoScroll) {
      nextTick(() => {
        if (consoleLogBoxRef.value) {
          consoleLogBoxRef.value.scrollTop = consoleLogBoxRef.value.scrollHeight
        }
      })
    }
  }
)

// 控制台上下拖拽调节高度
function startConsoleResize(e: MouseEvent) {
  isDraggingConsole = true
  startDragY = e.clientY
  startHeight = props.consoleHeight
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'

  window.addEventListener('mousemove', onConsoleMouseMove)
  window.addEventListener('mouseup', onConsoleMouseUp)
  e.preventDefault()
}

function onConsoleMouseMove(e: MouseEvent) {
  if (!isDraggingConsole) return
  const deltaY = startDragY - e.clientY
  const targetHeight = startHeight + deltaY

  const minH = 90
  const maxH = Math.max(minH + 60, window.innerHeight - 300)

  emit('update:consoleHeight', Math.min(Math.max(targetHeight, minH), maxH))
}

function onConsoleMouseUp() {
  if (isDraggingConsole) {
    isDraggingConsole = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', onConsoleMouseMove)
    window.removeEventListener('mouseup', onConsoleMouseUp)
  }
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onConsoleMouseMove)
  window.removeEventListener('mouseup', onConsoleMouseUp)
})
</script>

<style scoped>
.console-wrapper {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* 分割条 */
.console-splitter {
  height: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: row-resize;
  flex-shrink: 0;
  margin: 2px 0;
}

.console-splitter:hover {
  background-color: #cbd5e1;
}

.splitter-grip {
  width: 48px;
  height: 3px;
  background-color: #94a3b8;
  border-radius: 2px;
}

.console-splitter:hover .splitter-grip {
  background-color: #2563eb;
}

/* 控制台面板 */
.console-panel {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.console-header {
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.console-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.console-title {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}

.running-indicator {
  font-size: 11px;
}

.console-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.autoscroll-chk {
  color: #94a3b8;
}

:deep(.autoscroll-chk .el-checkbox__label) {
  color: #94a3b8;
  font-size: 12px;
}

.console-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 14px;
  font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Consolas", Menlo, Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
  background-color: #0b1120;
}

.log-line {
  margin-bottom: 2px;
  word-break: break-all;
}

.console-footer {
  background-color: #020617;
  border-top: 1px solid #1e293b;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Consolas", Menlo, Courier, monospace;
  font-size: 11px;
  color: #94a3b8;
  flex-shrink: 0;
}

.footer-sys-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* 颜色工具类 */
.text-success { color: #10b981 !important; }
.text-danger { color: #ef4444 !important; }
.text-amber { color: #f59e0b !important; }
.text-blue { color: #3b82f6 !important; }
.text-slate-300 { color: #cbd5e1 !important; }
.text-slate-400 { color: #94a3b8 !important; }
.text-slate-500 { color: #64748b !important; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
</style>
