<template>
  <div class="waveform-canvas-wrapper" ref="wrapperRef">
    <!-- 顶部测量信息与标尺栏 -->
    <div class="waveform-measurement-bar">
      <div class="time-readouts">
        <span class="readout-item cursor1" title="主游标 T1 (单击画布任意位置放置或按住拖动)">
          <span class="indicator t1-dot"></span>
          <strong>T1:</strong> {{ formatTime(cursor1Time) }}
        </span>
        <span class="readout-item cursor2" v-if="cursor2Time !== null" title="参考游标 T2 (Shift+单击移动，或按住游标线拖动)">
          <span class="indicator t2-dot"></span>
          <strong>T2:</strong> {{ formatTime(cursor2Time) }}
          <el-icon class="cursor-close-btn" @click.stop="clearCursor2" title="关闭参考游标 T2 (快捷键: Esc)"><Close /></el-icon>
        </span>
        <span
          class="readout-item add-cursor-btn"
          v-else
          @click="addCursor2"
          title="点击添加参考游标 T2 进行时差测量 (也可按住 Shift 单击画布或拖拽框选添加)"
        >
          <span class="indicator t2-dot" style="opacity: 0.5;"></span>
          <span class="add-t2-text">+ T2 游标</span>
        </span>
        <span class="readout-item delta" v-if="cursor1Time !== null && cursor2Time !== null">
          <strong>ΔT:</strong> {{ formatTime(Math.abs(cursor2Time - cursor1Time)) }}
        </span>
        <span class="readout-item freq" v-if="cursor1Time !== null && cursor2Time !== null && cursor2Time !== cursor1Time">
          <strong>1/ΔT:</strong> {{ formatFreq(Math.abs(cursor2Time - cursor1Time)) }}
        </span>
      </div>

      <div class="format-controls">
        <el-button-group size="small">
          <el-button :icon="DArrowLeft" @click="jumpPrevTransition" title="跳转至上一个跳变点 (|<)" />
          <el-button :icon="DArrowRight" @click="jumpNextTransition" title="跳转至下一个跳变点 (>|)" />
        </el-button-group>

        <el-radio-group v-model="radixFormat" size="small" style="margin-left: 10px" @change="render">
          <el-radio-button value="hex">HEX</el-radio-button>
          <el-radio-button value="dec">DEC</el-radio-button>
          <el-radio-button value="bin">BIN</el-radio-button>
        </el-radio-group>
        <el-button-group size="small" style="margin-left: 10px">
          <el-button :icon="ZoomIn" @click="handleZoom(1.3)" title="放大波形" />
          <el-button :icon="ZoomOut" @click="handleZoom(0.7)" title="缩小波形" />
          <el-button :icon="FullScreen" @click="zoomToFit" title="自适应全部时间" />
          <el-button :icon="RefreshRight" @click="resetView" title="重置视角" />
        </el-button-group>
      </div>
    </div>

    <!-- 主展示区：左侧信号标签列表 + 右侧 Canvas 画布 -->
    <div class="waveform-body">
      <!-- 左侧信号表头栏 -->
      <div class="signal-header-col" :style="{ width: `${labelColWidth}px` }">
        <div class="ruler-header">
          <span>信号名称 ({{ activeSignals.length }})</span>
          <span class="cursor-val-col">游标值</span>
        </div>
        <div class="signals-list-wrap">
          <el-scrollbar ref="labelScrollbarRef" class="dark-scrollbar" @scroll="handleLabelScroll">
            <div
              v-for="sig in activeSignals"
              :key="sig.id"
              class="signal-label-row"
              :class="{ active: selectedSignalId === sig.id }"
              :style="{ height: `${rowHeight}px` }"
              @click="selectSignal(sig.id)"
            >
              <div class="signal-info" :title="sig.fullName">
                <span class="sig-name">{{ sig.fullName || sig.name }}</span>
              </div>
              <div class="cursor-value" :title="getCursorValue(sig)">
                {{ formatCursorValue(sig) }}
              </div>
              <el-button
                link
                type="danger"
                class="del-sig-btn"
                :icon="Close"
                @click.stop="emit('remove-signal', sig.id)"
              />
            </div>
          </el-scrollbar>
        </div>
      </div>

      <!-- 右侧 Canvas 绘图区域 -->
      <div
        class="canvas-container"
        ref="containerRef"
        @wheel.prevent="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMoveHover"
        @dblclick="handleDblClick"
        @contextmenu.prevent
      >
        <canvas ref="canvasRef" class="main-canvas" />
      </div>
    </div>

    <!-- 底部 VaporView 状态指示栏 -->
    <div class="waveform-status-bar">
      <div class="status-left">
        <span class="status-cell" v-if="cursor1Time !== null && cursor2Time !== null">
          <span class="status-label">At:</span>
          <span class="status-val">{{ formatSignedTime(cursor2Time - cursor1Time) }}</span>
        </span>
        <span class="status-cell" v-if="cursor1Time !== null">
          <span class="status-label">time:</span>
          <span class="status-val">{{ formatWithCommas(Math.round(cursor1Time)) }} {{ metadata.timeUnit }}</span>
        </span>
        <span class="status-cell" v-if="selectedSignal">
          <span class="status-label">Selected signal:</span>
          <span class="status-val selected-sig-text">{{ selectedSignal.fullName || selectedSignal.name }}</span>
          <span class="status-net-tag" v-if="selectedSignal.netId" :title="'VCD 物理同源网标 (Net Code): ' + selectedSignal.netId">[Net: {{ selectedSignal.netId }}]</span>
        </span>
      </div>
      <div class="status-right">
        <span class="status-engine">VaporView (wellen.wasm 0.25.7)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  ZoomIn,
  ZoomOut,
  FullScreen,
  RefreshRight,
  Close,
  DArrowLeft,
  DArrowRight
} from '@element-plus/icons-vue'
import type { VcdMetadata, VcdSignalData } from '../types'

const props = defineProps<{
  metadata: VcdMetadata
  activeSignals: VcdSignalData[]
  selectedSignalId?: string | null
}>()

const emit = defineEmits<{
  (e: 'remove-signal', id: string): void
  (e: 'update:selectedSignalId', id: string | null): void
}>()

const wrapperRef = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const labelScrollbarRef = ref<any>(null)

// 布局尺寸
const labelColWidth = 320
const rowHeight = 36
const rulerHeight = 32

// 状态参数
const radixFormat = ref<'hex' | 'dec' | 'bin'>('hex')
const selectedSignalId = ref<string | null>(props.selectedSignalId || null)

watch(() => props.selectedSignalId, (newId) => {
  if (newId !== undefined) {
    selectedSignalId.value = newId
    render()
  }
})

const selectSignal = (id: string) => {
  selectedSignalId.value = id
  emit('update:selectedSignalId', id)
  render()
}

// 视口与缩放平移
const startTime = ref(0)
const timePerPixel = ref(1) // 每像素代表的仿真时间 (ns)
const scrollTop = ref(0)

const handleLabelScroll = ({ scrollTop: top }: { scrollTop: number }) => {
  scrollTop.value = top
  render()
}

// 测量双游标
const cursor1Time = ref<number | null>(null)
const cursor2Time = ref<number | null>(null)

// 交互状态 (支持左键框选时间区间、游标线拖动微调、右键/中键平移、单击移动主游标)
const isMouseDown = ref(false)
const dragMode = ref<'none' | 'select' | 'pan' | 'drag-cursor1' | 'drag-cursor2'>('none')
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartTime = ref(0)
const selectionAnchorTime = ref(0)

// 颜色主题配置 (Vaporview / EDA 经典暗色风)
const theme = {
  bg: '#181a1f',
  rulerBg: '#21252b',
  rulerText: '#abb2bf',
  gridLine: '#282c34',
  wireHigh: '#98c379',
  wireLow: '#98c379',
  wireFill: 'rgba(152, 195, 121, 0.12)',
  busFill: '#2c313a',
  busBorder: '#61afef',
  busText: '#e5c07b',
  cursor1: '#e5c07b',
  cursor2: '#56b6c2',
  cursorRange: 'rgba(86, 182, 194, 0.15)',
  xState: '#e06c75',
  zState: '#abb2bf'
}

// 格式化时间与单位
const formatTime = (time: number | null): string => {
  if (time === null) return '--'
  const unit = props.metadata.timeUnit || 'ns'
  if (time >= 1000000) return `${(time / 1000000).toFixed(2)} ms`
  if (time >= 1000) return `${(time / 1000).toFixed(2)} us`
  return `${time.toFixed(1)} ${unit}`
}

const formatFreq = (delta: number): string => {
  if (!delta) return '--'
  const unit = props.metadata.timeUnit || 'ns'
  let seconds = delta
  if (unit === 'ps') seconds *= 1e-12
  else if (unit === 'ns') seconds *= 1e-9
  else if (unit === 'us') seconds *= 1e-6
  else if (unit === 'ms') seconds *= 1e-3

  const freq = 1 / seconds
  if (freq >= 1e9) return `${(freq / 1e9).toFixed(2)} GHz`
  if (freq >= 1e6) return `${(freq / 1e6).toFixed(2)} MHz`
  if (freq >= 1e3) return `${(freq / 1e3).toFixed(2)} kHz`
  return `${freq.toFixed(1)} Hz`
}

// 格式化逗号数字
const formatWithCommas = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\w))/g, ',')
}

// 格式化带正负号的时间增量
const formatSignedTime = (delta: number): string => {
  const sign = delta > 0 ? '+' : (delta < 0 ? '-' : '')
  const val = formatWithCommas(Math.abs(Math.round(delta)))
  return `${sign}${val} ${props.metadata.timeUnit || 'ps'}`
}

// 当前选中的信号
const selectedSignal = computed(() => {
  if (!selectedSignalId.value) return null
  return props.activeSignals.find(s => s.id === selectedSignalId.value) || null
})

// 格式化数值进位展示 (VaporView 标准 4 位下划线分隔，如 7002_002c)
const formatRadixValue = (rawVal: string, size: number): string => {
  if (!rawVal || rawVal === 'x' || rawVal === 'z') return rawVal?.toLowerCase() || '--'
  if (size <= 1) return rawVal

  try {
    const dec = BigInt(`0b${rawVal.replace(/[^01]/g, '0') || '0'}`)
    if (radixFormat.value === 'hex') {
      const hexChars = Math.ceil(size / 4)
      const hex = dec.toString(16).toLowerCase().padStart(hexChars, '0')
      return hex.replace(/\B(?=(\w{4})+(?!\w))/g, '_')
    } else if (radixFormat.value === 'dec') {
      return dec.toString(10)
    } else if (radixFormat.value === 'bin') {
      return rawVal.replace(/\B(?=(\w{4})+(?!\w))/g, '_')
    }
  } catch {
    // 回退原始值
  }
  return rawVal
}

// 获取游标处格式化值，单比特跳变点显示 0->1
const formatCursorValue = (sig: VcdSignalData): string => {
  const t = cursor1Time.value
  if (t === null) return '--'
  const trans = sig.transitions
  if (!trans || trans.length === 0) return '--'

  const timeTol = timePerPixel.value * 2
  for (let i = 1; i < trans.length; i++) {
    if (Math.abs(trans[i].time - t) <= timeTol) {
      if (sig.size === 1) {
        return `${trans[i - 1].value}->${trans[i].value}`
      }
    }
  }

  const rawVal = getCursorValue(sig)
  return formatRadixValue(rawVal, sig.size)
}

// 跳转到上一个跳变点 (|<)
const jumpPrevTransition = () => {
  if (props.activeSignals.length === 0) return
  const sig = selectedSignal.value || props.activeSignals[0]
  const curT = cursor1Time.value ?? 0
  const trans = sig.transitions
  if (!trans || trans.length === 0) return
  for (let i = trans.length - 1; i >= 0; i--) {
    if (trans[i].time < curT - 0.001) {
      cursor1Time.value = trans[i].time
      ensureCursorVisible(cursor1Time.value)
      render()
      return
    }
  }
}

// 跳转到下一个跳变点 (>|)
const jumpNextTransition = () => {
  if (props.activeSignals.length === 0) return
  const sig = selectedSignal.value || props.activeSignals[0]
  const curT = cursor1Time.value ?? 0
  const trans = sig.transitions
  if (!trans || trans.length === 0) return
  for (let i = 0; i < trans.length; i++) {
    if (trans[i].time > curT + 0.001) {
      cursor1Time.value = trans[i].time
      ensureCursorVisible(cursor1Time.value)
      render()
      return
    }
  }
}

const ensureCursorVisible = (t: number) => {
  if (!containerRef.value) return
  const w = containerRef.value.clientWidth
  const visibleEnd = startTime.value + w * timePerPixel.value
  if (t < startTime.value || t > visibleEnd) {
    startTime.value = Math.max(0, t - (w * timePerPixel.value) / 2)
  }
}

// 获取游标处信号的值
const getCursorValue = (signal: VcdSignalData): string => {
  if (cursor1Time.value === null) return '--'
  const t = cursor1Time.value
  const trans = signal.transitions
  if (!trans || trans.length === 0) return '--'

  let low = 0
  let high = trans.length - 1
  let bestIdx = 0

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (trans[mid].time <= t) {
      bestIdx = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return trans[bestIdx]?.value || '--'
}

// 自适应缩放以包含全部波形时间
const zoomToFit = () => {
  if (!containerRef.value) return
  const w = containerRef.value.clientWidth
  const maxT = Math.max(props.metadata.maxTime, 100)
  timePerPixel.value = maxT / (w * 0.95)
  startTime.value = 0
  render()
}

// 重置视角 (保持当前选中信号和游标位置，不破坏用户的测量和选择)
const resetView = () => {
  startTime.value = 0
  timePerPixel.value = 1
  zoomToFit()
  // 确保至少有一个信号处于选中状态
  if (!selectedSignalId.value && props.activeSignals.length > 0) {
    selectSignal(props.activeSignals[0].id)
  }
}

// 缩放操作
const handleZoom = (factor: number, centerX?: number) => {
  if (!containerRef.value) return
  const containerWidth = containerRef.value.clientWidth
  const focusX = centerX !== undefined ? centerX : containerWidth / 2
  const focusTime = startTime.value + focusX * timePerPixel.value

  const newTimePerPixel = Math.max(0.0001, Math.min(100000, timePerPixel.value / factor))
  timePerPixel.value = newTimePerPixel
  startTime.value = Math.max(0, focusTime - focusX * newTimePerPixel)
  render()
}

// 鼠标滚轮平移与缩放 (支持垂直滚动与 el-scrollbar 联动)
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    // Ctrl + 滚轮缩放时间轴
    const rect = containerRef.value!.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const factor = e.deltaY < 0 ? 1.25 : 0.8
    handleZoom(factor, mouseX)
  } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    // Shift + 滚轮 或水平滚轮手势：水平平移时间轴
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
    const timeDelta = delta * timePerPixel.value * 0.5
    startTime.value = Math.max(0, startTime.value + timeDelta)
    render()
  } else {
    // 普通滚轮：垂直滚动信号列表并联动左侧 el-scrollbar！
    const visibleH = (containerRef.value?.clientHeight || 400) - rulerHeight
    const maxScroll = Math.max(0, props.activeSignals.length * rowHeight - visibleH)
    scrollTop.value = Math.max(0, Math.min(maxScroll, scrollTop.value + e.deltaY))
    labelScrollbarRef.value?.setScrollTop(scrollTop.value)
    render()
  }
}

// 添加参考游标 T2
const addCursor2 = () => {
  if (cursor1Time.value !== null) {
    cursor2Time.value = cursor1Time.value + 150 * timePerPixel.value
  } else {
    cursor2Time.value = startTime.value + 200 * timePerPixel.value
  }
  render()
}

// 清除参考游标 T2
const clearCursor2 = () => {
  cursor2Time.value = null
  render()
}

// 键盘快捷键监听 (Esc 清除参考游标 T2)
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (cursor2Time.value !== null) {
      clearCursor2()
    }
  }
}

// 鼠标悬停感知游标线 (在游标线 6px 范围内提示可拖动)
const handleMouseMoveHover = (e: MouseEvent) => {
  if (isMouseDown.value || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left

  const x1 = cursor1Time.value !== null ? (cursor1Time.value - startTime.value) / timePerPixel.value : -9999
  const x2 = cursor2Time.value !== null ? (cursor2Time.value - startTime.value) / timePerPixel.value : -9999

  const distToT1 = Math.abs(mouseX - x1)
  const distToT2 = Math.abs(mouseX - x2)

  if (distToT1 <= 6 || (cursor2Time.value !== null && distToT2 <= 6)) {
    containerRef.value.style.cursor = 'col-resize'
  } else {
    containerRef.value.style.cursor = 'crosshair'
  }
}

// 鼠标交互：支持点击移动主游标 T1、Shift+点击移动参考游标 T2、直接抓取游标线拖动、框选区间、右键/中键/Alt 平移
const handleMouseDown = (e: MouseEvent) => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const clickTime = Math.max(0, startTime.value + mouseX * timePerPixel.value)

  // 1. 点击波形区：无论点按还是框选，均立即高亮选中当前信号行！
  const relativeY = mouseY - rulerHeight + scrollTop.value
  const rowIdx = Math.floor(relativeY / rowHeight)
  if (rowIdx >= 0 && rowIdx < props.activeSignals.length) {
    selectSignal(props.activeSignals[rowIdx].id)
  }

  // 2. 判断交互模式：
  // 鼠标右键 (2) / 中键 (1) / 按住 Alt 键：平移画布模式
  if (e.button === 2 || e.button === 1 || e.altKey) {
    dragMode.value = 'pan'
    dragStartX.value = e.clientX
    dragStartTime.value = startTime.value
    if (containerRef.value) containerRef.value.style.cursor = 'grabbing'
    isMouseDown.value = true
  } else if (e.button === 0) {
    // 鼠标左键
    const x1 = cursor1Time.value !== null ? (cursor1Time.value - startTime.value) / timePerPixel.value : -9999
    const x2 = cursor2Time.value !== null ? (cursor2Time.value - startTime.value) / timePerPixel.value : -9999
    const distToT1 = Math.abs(mouseX - x1)
    const distToT2 = Math.abs(mouseX - x2)

    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    selectionAnchorTime.value = clickTime

    // A. 优先判断是否直接点中并拖拽现有的游标线 (吸附判定半径 6px)
    if (distToT1 <= 6 && (cursor2Time.value === null || distToT1 <= distToT2)) {
      dragMode.value = 'drag-cursor1'
      if (containerRef.value) containerRef.value.style.cursor = 'col-resize'
    } else if (cursor2Time.value !== null && distToT2 <= 6) {
      dragMode.value = 'drag-cursor2'
      if (containerRef.value) containerRef.value.style.cursor = 'col-resize'
    } else if (e.shiftKey) {
      // B. Shift + 单击：设置/移动参考游标 T2，并允许继续拖动
      cursor2Time.value = clickTime
      dragMode.value = 'drag-cursor2'
      if (containerRef.value) containerRef.value.style.cursor = 'col-resize'
    } else {
      // C. 普通左键：准备框选时间区间 T1 ~ T2，或者单击放置主游标 T1
      dragMode.value = 'select'
      if (containerRef.value) containerRef.value.style.cursor = 'crosshair'
    }

    isMouseDown.value = true
    render()
  }

  let hasMoved = false

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isMouseDown.value || !containerRef.value) return
    const dx = moveEvent.clientX - dragStartX.value
    const dy = moveEvent.clientY - dragStartY.value

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true
    }

    const currentMouseX = moveEvent.clientX - rect.left
    const currentTime = Math.max(0, startTime.value + currentMouseX * timePerPixel.value)

    if (dragMode.value === 'pan') {
      // 平移时间轴
      startTime.value = Math.max(0, dragStartTime.value - dx * timePerPixel.value)
      render()
    } else if (dragMode.value === 'drag-cursor1') {
      // 直接拖拽调整主游标 T1
      cursor1Time.value = currentTime
      render()
    } else if (dragMode.value === 'drag-cursor2') {
      // 直接拖拽调整参考游标 T2
      cursor2Time.value = currentTime
      render()
    } else if (dragMode.value === 'select') {
      // 框选时间区间：实时更新 T1 ~ T2 测量区间
      cursor1Time.value = Math.min(selectionAnchorTime.value, currentTime)
      cursor2Time.value = Math.max(selectionAnchorTime.value, currentTime)
      render()
    }
  }

  const onMouseUp = () => {
    if (dragMode.value === 'select') {
      if (!hasMoved) {
        // 如果只是单击没有拖拽：将主游标 T1 移动到点击位置！
        // 关键逻辑：保留参考游标 T2（如果已存在），绝对不清空 T2，让 ΔT 自动更新测量值！
        cursor1Time.value = clickTime
        render()
      }
      // 如果 hasMoved 为 true，则保留框选出的 [cursor1Time, cursor2Time] 区间！
    }

    isMouseDown.value = false
    dragMode.value = 'none'
    if (containerRef.value) {
      containerRef.value.style.cursor = 'crosshair'
    }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// 双击缩放到当前选中区间
const handleDblClick = () => {
  if (cursor1Time.value !== null && cursor2Time.value !== null && containerRef.value) {
    const tMin = Math.min(cursor1Time.value, cursor2Time.value)
    const tMax = Math.max(cursor1Time.value, cursor2Time.value)
    const span = tMax - tMin
    if (span > 0) {
      const w = containerRef.value.clientWidth
      timePerPixel.value = Math.max(0.0001, span / (w * 0.9))
      startTime.value = Math.max(0, tMin - (w * 0.05) * timePerPixel.value)
      render()
    }
  }
}

// 核心 Canvas 渲染引擎
const render = () => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const width = container.clientWidth
  const height = container.clientHeight

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  // 1. 绘制背景
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, width, height)

  const endTime = startTime.value + width * timePerPixel.value

  // 2. 绘制垂直参考虚线与时间网格
  drawGridLines(ctx, width, height, startTime.value, endTime)

  // 3. 逐行绘制数字仿真波形 (随 scrollTop 垂直平移)
  let curY = rulerHeight - scrollTop.value
  props.activeSignals.forEach((signal, idx) => {
    if (curY + rowHeight >= rulerHeight && curY <= height) {
      const isSelected = selectedSignalId.value === signal.id
      if (isSelected) {
        ctx.fillStyle = 'rgba(64, 158, 255, 0.12)'
        ctx.fillRect(0, curY, width, rowHeight)
      } else if (idx % 2 === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
        ctx.fillRect(0, curY, width, rowHeight)
      }

      if (signal.size <= 1) {
        drawSingleBitSignal(ctx, signal, curY, width)
      } else {
        drawMultiBitSignal(ctx, signal, curY, width)
      }

      // 行分割线
      ctx.strokeStyle = '#282c34'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, curY + rowHeight)
      ctx.lineTo(width, curY + rowHeight)
      ctx.stroke()
    }
    curY += rowHeight
  })

  // 4. 绘制双游标区域高亮与光标竖线
  drawCursors(ctx, width, height)

  // 5. 绘制时间刻度尺顶部（置顶覆盖，确保波形垂直滚动时不遮挡标尺）
  drawRulerBar(ctx, width, startTime.value, endTime)
}

// 绘制垂直时间参考虚线
const drawGridLines = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  startT: number,
  endT: number
) => {
  const targetPx = 100
  const roughStep = targetPx * timePerPixel.value
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)))
  let step = mag
  if (roughStep / mag > 5) step = mag * 5
  else if (roughStep / mag > 2) step = mag * 2

  const firstTick = Math.floor(startT / step) * step
  ctx.strokeStyle = theme.gridLine

  for (let t = firstTick; t <= endT; t += step) {
    const x = (t - startT) / timePerPixel.value
    if (x < 0 || x > width) continue

    ctx.beginPath()
    ctx.setLineDash([2, 4])
    ctx.moveTo(x, rulerHeight)
    ctx.lineTo(x, height)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

// 绘制时间标尺栏 (置顶)
const drawRulerBar = (
  ctx: CanvasRenderingContext2D,
  width: number,
  startT: number,
  endT: number
) => {
  // 标尺背景
  ctx.fillStyle = theme.rulerBg
  ctx.fillRect(0, 0, width, rulerHeight)
  ctx.strokeStyle = '#3e4451'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, rulerHeight)
  ctx.lineTo(width, rulerHeight)
  ctx.stroke()

  const targetPx = 100
  const roughStep = targetPx * timePerPixel.value
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)))
  let step = mag
  if (roughStep / mag > 5) step = mag * 5
  else if (roughStep / mag > 2) step = mag * 2

  const firstTick = Math.floor(startT / step) * step
  ctx.font = '11px JetBrains Mono, monospace, sans-serif'
  ctx.fillStyle = theme.rulerText

  for (let t = firstTick; t <= endT; t += step) {
    const x = (t - startT) / timePerPixel.value
    if (x < 0 || x > width) continue

    // 标尺刻度线与文本
    ctx.beginPath()
    ctx.strokeStyle = '#5c6370'
    ctx.moveTo(x, rulerHeight - 8)
    ctx.lineTo(x, rulerHeight)
    ctx.stroke()

    ctx.fillText(`${t} ${props.metadata.timeUnit || 'ns'}`, x + 4, rulerHeight - 10)
  }
}

// 绘制单标量 1-bit 波形 (0/1/x/z)
const drawSingleBitSignal = (
  ctx: CanvasRenderingContext2D,
  signal: VcdSignalData,
  topY: number,
  width: number
) => {
  const trans = signal.transitions
  if (!trans || trans.length === 0) return

  const highY = topY + 8
  const lowY = topY + rowHeight - 8

  ctx.strokeStyle = theme.wireHigh
  ctx.lineWidth = 1.6
  ctx.beginPath()

  let lastX = 0
  let lastY = lowY

  trans.forEach((tr, i) => {
    const x = (tr.time - startTime.value) / timePerPixel.value
    const targetY = tr.value === '1' ? highY : lowY

    if (i === 0) {
      lastY = targetY
      lastX = Math.max(0, x)
      ctx.moveTo(lastX, lastY)
    } else {
      // 水平延伸到跳变点，然后垂直跳变
      ctx.lineTo(x, lastY)
      ctx.lineTo(x, targetY)
      lastX = x
      lastY = targetY
    }
  })

  // 延伸至屏幕最右端
  ctx.lineTo(width, lastY)
  ctx.stroke()
}

// 绘制多位总线 Bus 波形 (以蜂窝菱形数据包展开)
const drawMultiBitSignal = (
  ctx: CanvasRenderingContext2D,
  signal: VcdSignalData,
  topY: number,
  width: number
) => {
  const trans = signal.transitions
  if (!trans || trans.length === 0) return

  const highY = topY + 6
  const lowY = topY + rowHeight - 6
  const midY = (highY + lowY) / 2
  const crossOffset = 4 // 菱形交叉宽度

  for (let i = 0; i < trans.length; i++) {
    const cur = trans[i]
    const next = trans[i + 1]
    const x1 = Math.max(0, (cur.time - startTime.value) / timePerPixel.value)
    const x2 = next ? (next.time - startTime.value) / timePerPixel.value : width

    if (x2 < 0 || x1 > width) continue

    // 绘制总线多边形包络面
    ctx.fillStyle = theme.busFill
    ctx.strokeStyle = theme.busBorder
    ctx.lineWidth = 1.2

    ctx.beginPath()
    ctx.moveTo(x1 + crossOffset, highY)
    ctx.lineTo(x2 - crossOffset, highY)
    ctx.lineTo(x2, midY)
    ctx.lineTo(x2 - crossOffset, lowY)
    ctx.lineTo(x1 + crossOffset, lowY)
    ctx.lineTo(x1, midY)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 若宽度充足，在总线内部绘制当前数值
    const cellWidth = x2 - x1
    if (cellWidth > 36) {
      ctx.fillStyle = theme.busText
      ctx.font = '11px JetBrains Mono, monospace, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const formattedVal = formatRadixValue(cur.value, signal.size)
      ctx.fillText(formattedVal, (x1 + x2) / 2, midY, cellWidth - 12)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }
  }
}

// 绘制光标与区间高亮
const drawCursors = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  // 游标 1 与游标 2 之间高亮区域
  if (cursor1Time.value !== null && cursor2Time.value !== null) {
    const x1 = (cursor1Time.value - startTime.value) / timePerPixel.value
    const x2 = (cursor2Time.value - startTime.value) / timePerPixel.value
    const minX = Math.min(x1, x2)
    const span = Math.abs(x2 - x1)
    ctx.fillStyle = theme.cursorRange
    ctx.fillRect(minX, 0, span, height)
  }

  // 绘制游标 1 (黄色主光标)
  if (cursor1Time.value !== null) {
    const x1 = (cursor1Time.value - startTime.value) / timePerPixel.value
    if (x1 >= -10 && x1 <= width + 10) {
      ctx.strokeStyle = theme.cursor1
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(x1, 0)
      ctx.lineTo(x1, height)
      ctx.stroke()

      // 标尺头部游标标记 (T1 指示箭头)
      ctx.fillStyle = theme.cursor1
      ctx.beginPath()
      ctx.moveTo(x1 - 5, rulerHeight - 12)
      ctx.lineTo(x1 + 5, rulerHeight - 12)
      ctx.lineTo(x1 + 5, rulerHeight - 6)
      ctx.lineTo(x1, rulerHeight - 1)
      ctx.lineTo(x1 - 5, rulerHeight - 6)
      ctx.closePath()
      ctx.fill()
    }
  }

  // 绘制游标 2 (青色参考光标)
  if (cursor2Time.value !== null) {
    const x2 = (cursor2Time.value - startTime.value) / timePerPixel.value
    if (x2 >= -10 && x2 <= width + 10) {
      ctx.strokeStyle = theme.cursor2
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(x2, 0)
      ctx.lineTo(x2, height)
      ctx.stroke()

      // 标尺头部游标标记 (T2 指示箭头)
      ctx.fillStyle = theme.cursor2
      ctx.beginPath()
      ctx.moveTo(x2 - 5, rulerHeight - 12)
      ctx.lineTo(x2 + 5, rulerHeight - 12)
      ctx.lineTo(x2 + 5, rulerHeight - 6)
      ctx.lineTo(x2, rulerHeight - 1)
      ctx.lineTo(x2 - 5, rulerHeight - 6)
      ctx.closePath()
      ctx.fill()
    }
  }
}

// 监听外层信号增减与视口变化
watch(() => props.activeSignals, () => {
  nextTick(() => render())
}, { deep: true })

watch(() => props.metadata, (newMeta) => {
  if (newMeta && newMeta.maxTime > 0) {
    const maxT = newMeta.maxTime
    if (cursor1Time.value === null) {
      cursor1Time.value = Math.round(maxT * 0.1)
    }
    if (cursor2Time.value === null) {
      cursor2Time.value = Math.round(maxT * 0.4)
    }
    zoomToFit()
  }
}, { deep: true })

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  zoomToFit()
  const maxT = Math.max(props.metadata.maxTime || 1000, 100)
  if (cursor1Time.value === null) {
    cursor1Time.value = Math.round(maxT * 0.1)
  }
  if (cursor2Time.value === null) {
    cursor2Time.value = Math.round(maxT * 0.4)
  }
  window.addEventListener('resize', render)
  window.addEventListener('keydown', handleKeyDown)

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      render()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', render)
  window.removeEventListener('keydown', handleKeyDown)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
.waveform-canvas-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  flex: 1;
  background-color: #181a1f;
  color: #abb2bf;
  user-select: none;
  overflow: hidden;
  border-radius: 0;
  box-shadow: none;
}

.waveform-measurement-bar {
  height: 40px;
  background-color: #21252b;
  border-bottom: 1px solid #282c34;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.time-readouts {
  display: flex;
  align-items: center;
  gap: 16px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
}

.readout-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.t1-dot {
  background-color: #e5c07b;
}

.t2-dot {
  background-color: #56b6c2;
}

.cursor-close-btn {
  font-size: 11px;
  cursor: pointer;
  color: #abb2bf;
  margin-left: 2px;
  padding: 1px 2px;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cursor-close-btn:hover {
  color: #ffffff;
  background-color: rgba(224, 108, 117, 0.4);
}

.add-cursor-btn {
  cursor: pointer;
  padding: 2px 7px;
  border-radius: 3px;
  background: rgba(86, 182, 194, 0.08);
  border: 1px dashed rgba(86, 182, 194, 0.35);
  transition: all 0.2s;
}

.add-cursor-btn:hover {
  background: rgba(86, 182, 194, 0.18);
  border-color: rgba(86, 182, 194, 0.6);
}

.add-t2-text {
  color: #56b6c2;
  font-size: 11px;
}

.readout-item.delta strong {
  color: #61afef;
}

.readout-item.freq strong {
  color: #98c379;
}

.format-controls {
  display: flex;
  align-items: center;
}

.waveform-body {
  flex: 1;
  display: flex;
  position: relative;
  height: calc(100% - 40px);
  overflow: hidden;
}

.signal-header-col {
  flex-shrink: 0;
  background-color: #21252b;
  border-right: 2px solid #282c34;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.ruler-header {
  height: 32px;
  line-height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  background-color: #1e2227;
  border-bottom: 1px solid #282c34;
  display: flex;
  justify-content: space-between;
  color: #5c6370;
}

.cursor-val-col {
  margin-right: 24px;
}

.signals-list-wrap {
  flex: 1;
  overflow: hidden;
  height: calc(100% - 32px);
}

:deep(.signals-list-wrap .el-scrollbar) {
  height: 100%;
}

:deep(.signals-list-wrap .el-scrollbar__wrap) {
  overflow-x: hidden;
}

:deep(.el-scrollbar__thumb) {
  background-color: rgba(121, 121, 121, 0.35) !important;
  border-radius: 4px;
}

:deep(.el-scrollbar__thumb:hover) {
  background-color: rgba(160, 160, 160, 0.6) !important;
}

:deep(.el-scrollbar__bar.is-vertical) {
  width: 6px;
  right: 2px;
}

.signal-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid #282c34;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.signal-label-row:hover {
  background-color: rgba(255, 255, 255, 0.04);
}

.signal-label-row.active {
  background-color: rgba(64, 158, 255, 0.12);
  border-left: 3px solid #61afef;
}

.signal-info {
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
}

.sig-name {
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: #abb2bf;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cursor-value {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
  color: #e5c07b;
  width: 95px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

.del-sig-btn {
  opacity: 0.3;
  transition: opacity 0.2s;
  padding: 2px;
}

.signal-label-row:hover .del-sig-btn {
  opacity: 1;
}

.canvas-container {
  flex: 1;
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: crosshair;
}

.main-canvas {
  display: block;
}

.waveform-status-bar {
  height: 26px;
  background-color: #1a1d24;
  border-top: 1px solid #282c34;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 11px;
  color: #7f848e;
  flex-shrink: 0;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-label {
  color: #5c6370;
}

.status-val {
  color: #abb2bf;
}

.selected-sig-text {
  color: #61afef;
  font-weight: 500;
}

.status-net-tag {
  color: #98c379;
  font-size: 10px;
  background: rgba(152, 195, 121, 0.12);
  padding: 1px 5px;
  border-radius: 2px;
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.status-engine {
  color: #5c6370;
  font-size: 10px;
}
</style>
