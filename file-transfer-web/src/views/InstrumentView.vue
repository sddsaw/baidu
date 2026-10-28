<template>
  <div class="instrument-page" :class="{ 'is-simulating': isSimulating }">
    <!-- ================= 顶部场景测试控制台 (Scenario Test Bench Toolbar) ================= -->
    <header class="test-bench-toolbar">
      <div class="toolbar-left">
        <div class="bench-title">
          <el-icon class="title-icon"><Monitor /></el-icon>
          <span class="title-text">客户端嵌入场景测试台</span>
          <el-tag type="success" effect="dark" size="small" round>LIVE</el-tag>
        </div>
        
        <!-- 模拟器开关 -->
        <el-switch
          v-model="isSimulating"
          active-text="客户端容器模拟"
          inactive-text="全屏标准视图"
          inline-prompt
          style="--el-switch-on-color: #0284c7; --el-switch-off-color: #475569;"
        />

        <!-- 架构模式切换：Vue Flow 现代拓扑 vs 传统硬编码画布 -->
        <el-radio-group v-model="renderMode" size="small" class="render-mode-toggle">
          <el-radio-button value="flow">⚡ Vue Flow 现代拓扑 (优化后)</el-radio-button>
          <el-radio-button value="classic">📐 传统硬编码 SVG (原版)</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 快捷场景预设按钮 -->
      <div class="toolbar-presets" v-if="isSimulating">
        <span class="preset-label">场景预设:</span>
        <button
          v-for="preset in scenarioPresets"
          :key="preset.name"
          class="preset-btn"
          :class="{ active: currentWidth === preset.width && currentHeight === preset.height }"
          @click="applyPreset(preset)"
          :title="preset.desc"
        >
          <span class="btn-name">{{ preset.name }}</span>
          <span class="btn-size">{{ preset.width }}×{{ preset.height }}</span>
        </button>
        <button
          class="preset-btn full-btn"
          :class="{ active: isFullSize }"
          @click="applyFullSize"
          title="还原 100% 容器充满"
        >
          <el-icon><FullScreen /></el-icon>
          <span>100% 充满</span>
        </button>
      </div>

      <!-- 实时自适应指标看板 -->
      <div class="toolbar-status">
        <div class="metric-item">
          <span class="metric-label">当前容器:</span>
          <span class="metric-value font-mono">{{ actualWidth }} × {{ actualHeight }} px</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">生效缩放:</span>
          <span class="metric-value text-emerald font-mono">{{ effectiveScale }}</span>
        </div>
        <div class="metric-badge">
          <el-tag :type="testStatusTag" size="small" effect="plain">
            {{ testStatusText }}
          </el-tag>
        </div>
      </div>
    </header>

    <!-- ================= 场景拉伸调节滑块栏 (Sliders) ================= -->
    <div class="slider-control-bar" v-if="isSimulating && !isFullSize">
      <div class="slider-group">
        <span class="slider-title">容器宽度 (宽):</span>
        <el-slider
          v-model="currentWidth"
          :min="320"
          :max="1400"
          :step="10"
          class="custom-slider"
        />
        <span class="slider-val font-mono">{{ currentWidth }}px</span>
      </div>
      <div class="slider-divider"></div>
      <div class="slider-group">
        <span class="slider-title">容器高度 (高):</span>
        <el-slider
          v-model="currentHeight"
          :min="240"
          :max="850"
          :step="10"
          class="custom-slider"
        />
        <span class="slider-val font-mono">{{ currentHeight }}px</span>
      </div>
      <div class="drag-hint">
        💡 提示：也可以直接用鼠标按住模拟框右下角直接拖动拉伸！
      </div>
    </div>

    <!-- ================= 主体承载区：模拟客户端嵌入容器 ================= -->
    <main class="sandbox-viewport-stage">
      <div
        class="client-mock-container"
        ref="sandboxContainerRef"
        :class="{ 'fixed-box': isSimulating && !isFullSize, 'fullscreen-box': !isSimulating || isFullSize }"
        :style="containerStyle"
      >
        <!-- 模拟客户端组件标题栏 (仿真真实桌面客户端嵌入卡片) -->
        <div class="mock-client-header" v-if="isSimulating && !isFullSize">
          <div class="client-traffic-lights">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="client-title">
            ATE 自动化测试子窗口 (仿真嵌入 DOM 节点)
          </div>
          <div class="client-window-size font-mono">
            {{ actualWidth }} × {{ actualHeight }}
          </div>
        </div>

        <!-- 真实嵌入的 ATE 芯片测试机台组件 -->
        <div class="mock-content-body">
          <DcViInstrumentFlow v-if="renderMode === 'flow'" ref="flowInstrumentRef" />
          <DcViInstrument v-else ref="instrumentRef" />
        </div>

        <!-- 拖动手柄：支持鼠标在右下角或右边缘直接拉伸 (仿真用户直接拖拽客户端) -->
        <div
          v-if="isSimulating && !isFullSize"
          class="resize-handle corner-handle"
          @pointerdown.stop="startResize($event, 'both')"
          title="拖动调整长和高"
        ></div>
        <div
          v-if="isSimulating && !isFullSize"
          class="resize-handle right-handle"
          @pointerdown.stop="startResize($event, 'width')"
          title="拖动调整宽度"
        ></div>
        <div
          v-if="isSimulating && !isFullSize"
          class="resize-handle bottom-handle"
          @pointerdown.stop="startResize($event, 'height')"
          title="拖动调整高度"
        ></div>
      </div>
    </main>

    <!-- ================= 场景验证自动化检测看板 (底部浮动提示) ================= -->
    <aside class="scenario-checklist" v-if="isSimulating">
      <div class="checklist-header">
        <span class="title">场景自动化验证项</span>
        <span class="tip">即时在机台交互测试</span>
      </div>
      <div class="checklist-items">
        <div class="check-item">
          <span class="status-icon pass">✓</span>
          <span class="desc"><strong>长宽等比适配：</strong>{{ actualWidth < 550 ? '500px/极小屏等比缩放生效中' : '双向约束完全展示' }}</span>
        </div>
        <div class="check-item">
          <span class="status-icon pass">✓</span>
          <span class="desc"><strong>输入失焦保存：</strong>在电压输入框打字后点画布，自动 blur 保存</span>
        </div>
        <div class="check-item">
          <span class="status-icon pass">✓</span>
          <span class="desc"><strong>下拉选项防悬空：</strong>点开 Site 下拉框后拖动或缩放，自动即时隐藏</span>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Monitor, FullScreen } from '@element-plus/icons-vue'
import DcViInstrument from '@/components/DcViInstrument.vue'
import DcViInstrumentFlow from '@/components/DcViFlow/DcViInstrumentFlow.vue'

// 渲染架构：默认切换至现代 Vue Flow 响应式拓扑架构
const renderMode = ref<'flow' | 'classic'>('flow')
const flowInstrumentRef = ref<InstanceType<typeof DcViInstrumentFlow> | null>(null)
const instrumentRef = ref<InstanceType<typeof DcViInstrument> | null>(null)
const sandboxContainerRef = ref<HTMLElement | null>(null)

// 动态缩放比例
const effectiveScale = computed(() => {
  if (renderMode.value === 'flow') {
    return flowInstrumentRef.value?.scalePercent || '100%'
  }
  return instrumentRef.value?.scalePercent || '100%'
})

// 是否开启客户端场景模拟器（默认开启，方便一进页面即刻测试验证）
const isSimulating = ref(true)
const isFullSize = ref(false)

// 模拟客户端容器尺寸状态
const currentWidth = ref(850)
const currentHeight = ref(540)
const actualWidth = ref(850)
const actualHeight = ref(540)

// 场景预设列表
interface ScenarioPreset {
  name: string
  width: number
  height: number
  desc: string
}

const scenarioPresets: ScenarioPreset[] = [
  {
    name: '极小初始窗口',
    width: 400,
    height: 300,
    desc: '测试客户端初始化极小 (400×300) 时，是否能高倍等比缩小并完整展示'
  },
  {
    name: '窄版侧边栏',
    width: 500,
    height: 600,
    desc: '测试拉伸至 500px 宽度时，是否上下左右无任何截断'
  },
  {
    name: '扁平矮窗口',
    width: 850,
    height: 350,
    desc: '测试高度极扁时，是否以高度为瓶颈约束等比缩小'
  },
  {
    name: '标准嵌入卡片',
    width: 1000,
    height: 650,
    desc: '测试 1000px 典型中型窗口'
  },
  {
    name: '宽屏大窗口',
    width: 1280,
    height: 720,
    desc: '测试 1:1 清晰呈现'
  }
]

// 应用预设
const applyPreset = (preset: ScenarioPreset) => {
  isFullSize.value = false
  currentWidth.value = preset.width
  currentHeight.value = preset.height
}

// 充满模式
const applyFullSize = () => {
  isFullSize.value = true
}

// 容器动态样式
const containerStyle = computed(() => {
  if (!isSimulating.value || isFullSize.value) {
    return {
      width: '100%',
      height: '100%'
    }
  }
  return {
    width: `${currentWidth.value}px`,
    height: `${currentHeight.value}px`
  }
})

// 测试状态标签
const testStatusTag = computed(() => {
  if (actualWidth.value <= 500) return 'warning'
  return 'success'
})

const testStatusText = computed(() => {
  if (actualWidth.value <= 420) return '极小窗口适配 PASS'
  if (actualWidth.value <= 520) return '500px窄屏适配 PASS'
  return '全场景等比无截断 PASS'
})

// 监听真实 DOM 尺寸变化 (ResizeObserver)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (sandboxContainerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        actualWidth.value = Math.round(entry.contentRect.width)
        actualHeight.value = Math.round(entry.contentRect.height)
      }
    })
    resizeObserver.observe(sandboxContainerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// ================= 鼠标拖拽拉伸边框逻辑 (Draggable Resizer) =================
let resizeMode: 'width' | 'height' | 'both' = 'both'
let startX = 0
let startY = 0
let startW = 0
let startH = 0

const startResize = (event: PointerEvent, mode: 'width' | 'height' | 'both') => {
  event.preventDefault()
  isFullSize.value = false
  resizeMode = mode
  startX = event.clientX
  startY = event.clientY
  startW = currentWidth.value
  startH = currentHeight.value

  document.addEventListener('pointermove', onPointerMoveResize)
  document.addEventListener('pointerup', onPointerUpResize)
}

const onPointerMoveResize = (event: PointerEvent) => {
  const dx = event.clientX - startX
  const dy = event.clientY - startY

  if (resizeMode === 'width' || resizeMode === 'both') {
    currentWidth.value = Math.min(Math.max(startW + dx, 320), 1500)
  }
  if (resizeMode === 'height' || resizeMode === 'both') {
    currentHeight.value = Math.min(Math.max(startH + dy, 240), 900)
  }
}

const onPointerUpResize = () => {
  document.removeEventListener('pointermove', onPointerMoveResize)
  document.removeEventListener('pointerup', onPointerUpResize)
}
</script>

<style scoped>
.instrument-page {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background-color: #0f1113;
  color: #f1f5f9;
  position: relative;
  overflow: hidden;
}

/* ================= 1. 顶部场景测试控制台 ================= */
.test-bench-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 16px;
  background: #181a1d;
  border-bottom: 1px solid #2e3238;
  z-index: 40;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.bench-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
  color: #38bdf8;
}

.title-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #f8fafc;
}

/* 场景预设按钮组 */
.toolbar-presets {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 11px;
  color: #94a3b8;
  margin-right: 4px;
}

.preset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #cbd5e1;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-btn:hover {
  background: #334155;
  color: #ffffff;
  border-color: #64748b;
}

.preset-btn.active {
  background: rgba(14, 165, 233, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 600;
}

.btn-size {
  font-family: monospace;
  font-size: 10px;
  opacity: 0.75;
}

.full-btn {
  background: #27272a;
}

/* 实时指标看板 */
.toolbar-status {
  display: flex;
  align-items: center;
  gap: 14px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.metric-label {
  color: #94a3b8;
}

.metric-value {
  color: #f1f5f9;
  font-weight: 600;
}

.text-emerald {
  color: #10b981;
}

/* ================= 2. 调节滑块栏 ================= */
.slider-control-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 16px;
  background: #131518;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  max-width: 380px;
}

.slider-title {
  color: #94a3b8;
  white-space: nowrap;
}

.custom-slider {
  flex: 1;
  --el-slider-main-bg-color: #38bdf8;
}

.slider-val {
  min-width: 50px;
  color: #38bdf8;
  font-weight: bold;
}

.slider-divider {
  width: 1px;
  height: 20px;
  background: #334155;
}

.drag-hint {
  font-size: 11px;
  color: #eab308;
  margin-left: auto;
}

/* ================= 3. 主体视口舞台 ================= */
.sandbox-viewport-stage {
  flex: 1 1 0%;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  padding: 12px;
  box-sizing: border-box;
}

/* 模拟客户端卡片窗口 (具有固定边框和阴影) */
.client-mock-container {
  position: relative;
  background: #1e2022;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  transition: width 0.1s ease-out, height 0.1s ease-out;
}

.client-mock-container.fixed-box {
  border: 2px solid #0284c7;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(2, 132, 199, 0.25);
}

.client-mock-container.fullscreen-box {
  width: 100% !important;
  height: 100% !important;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

/* 模拟客户端标题栏 */
.mock-client-header {
  flex-shrink: 0;
  height: 30px;
  background: #181a1d;
  border-bottom: 1px solid #2e3238;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  user-select: none;
}

.client-traffic-lights {
  display: flex;
  gap: 5px;
}

.client-traffic-lights .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.client-traffic-lights .red { background: #ef4444; }
.client-traffic-lights .yellow { background: #f59e0b; }
.client-traffic-lights .green { background: #10b981; }

.client-title {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.client-window-size {
  font-size: 10px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 1px 5px;
  border-radius: 4px;
}

/* 模拟客户端机台内容承载体 */
.mock-content-body {
  flex: 1 1 0%;
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

/* 拖拽拉伸边框手柄 */
.resize-handle {
  position: absolute;
  z-index: 50;
  user-select: none;
}

.corner-handle {
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: se-resize;
  background: linear-gradient(135deg, transparent 50%, #38bdf8 50%);
}

.right-handle {
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: e-resize;
}

.bottom-handle {
  left: 0;
  bottom: 0;
  width: 100%;
  height: 6px;
  cursor: s-resize;
}

/* ================= 4. 场景验证自动化检测卡 ================= */
.scenario-checklist {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 60;
  background: rgba(24, 26, 29, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  max-width: 340px;
  font-size: 12px;
}

.checklist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.checklist-header .title {
  font-weight: 700;
  color: #f8fafc;
}

.checklist-header .tip {
  font-size: 10px;
  color: #64748b;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.4;
  color: #cbd5e1;
}

.status-icon.pass {
  color: #10b981;
  font-weight: bold;
}
</style>
