<template>
  <div class="panzoom-viewport-box" ref="viewportRef">
    <!-- 1. 浮动缩放控制面板 (HUD，支持通过 slot="hud" 自定义或通过 showHud 开关) -->
    <div
      v-if="showHud"
      class="panzoom-hud-panel"
      :class="{ 'ctrl-active': isCtrlPressed, 'space-active': isSpacePressed }"
    >
      <slot
        name="hud"
        :scale="scale"
        :scale-percent="scalePercent"
        :is-auto-fit="isAutoFit"
        :zoom-in="zoomIn"
        :zoom-out="zoomOut"
        :reset="reset"
        :fit-to-container="fitToContainer"
      >
        <!-- 默认内建精美 Dark Glass HUD 控制栏 -->
        <div class="hud-controls">
          <button class="hud-btn" @click="zoomOut()" title="缩小 (Ctrl + 滚轮向下)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button class="hud-scale-btn" @click="reset()" title="点击复位为 100%">
            {{ scalePercent }}
          </button>
          <button class="hud-btn" @click="zoomIn()" title="放大 (Ctrl + 滚轮向上)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <div class="hud-divider"></div>
          <button class="hud-btn" @click="fitToContainer()" title="自适应窗口并居中">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
          <button class="hud-btn" @click="reset()" title="复位 1:1 原始尺寸">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
          </button>
        </div>

        <div class="hud-status" v-if="showHudStatus">
          <span class="hud-key-tag" :class="{ 'tag-active': isCtrlPressed }">Ctrl</span>
          <span class="hud-tip-text">{{ isCtrlPressed ? '按住中: 滚轮缩放' : '+ 滚轮缩放' }}</span>
          <span class="hud-dot">·</span>
          <span class="hud-key-tag" :class="{ 'tag-active': isSpacePressed }">Space</span>
          <span class="hud-tip-text">{{ isSpacePressed ? '抓手模式: 拖动画布' : '+ 拖拽平移' }}</span>
          <span class="hud-dot">·</span>
          <span
            class="hud-mode-pill"
            :class="{ 'mode-autofit': isAutoFit }"
            @click="fitToContainer()"
            :title="isAutoFit ? '当前处于窗口拉伸自适应模式' : '点击切回窗口拉伸自适应模式'"
          >
            <span class="mode-led"></span>
            {{ isAutoFit ? '自适应中' : '自由观察中' }}
          </span>
        </div>
      </slot>
    </div>

    <!-- 2. 居中视口工作区舞台 (Stage) -->
    <div class="panzoom-stage">
      <!-- 3. 要缩放的目标底盘容器 (Target) -->
      <div
        class="panzoom-target-wrapper"
        ref="targetRef"
        :style="targetStyle"
        :class="{ 'cursor-grab': isSpacePressed, 'cursor-grabbing': isPanning }"
      >
        <!-- 默认插槽：放置你的任何业务组件或 DOM 节点 -->
        <slot
          :scale="scale"
          :scale-percent="scalePercent"
          :is-auto-fit="isAutoFit"
          :is-panning="isPanning"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type CSSProperties } from 'vue'
import { usePanzoom, type UsePanzoomOptions } from './usePanzoom'

interface Props {
  /** 目标组件设计宽度 (默认 1100)，作为等比缩放基准 */
  baseWidth?: number
  /** 目标组件设计高度 (默认 680) */
  baseHeight?: number
  /** 最小缩放比 (默认 0.1) */
  minScale?: number
  /** 最大缩放比 (默认 3.5) */
  maxScale?: number
  /** 单次滚轮或点击步长 (默认 0.08) */
  step?: number
  /** 初始缩放比例 (默认 1.0) */
  initialScale?: number
  /** 是否允许在大容器下等比放大超过 1.0 充满父级宽度 (默认 true) */
  allowUpscale?: boolean
  /** 是否必须按住 Ctrl / Command 键才触发滚轮缩放 (默认 true) */
  requireCtrlForWheel?: boolean
  /** 是否开启鼠标平移 (默认 true) */
  enablePan?: boolean
  /** 是否开启双击空白处复位 (默认 true) */
  doubleClickReset?: boolean
  /** 是否自动监听窗口/容器尺寸拉伸并自适应 (默认 true) */
  autoFitOnResize?: boolean
  /** 挂载时是否自动自适应 (默认 true) */
  autoFitOnInit?: boolean
  /** 是否显示顶部浮动 HUD 控制面板 (默认 true) */
  showHud?: boolean
  /** 是否显示 HUD 内部的快捷键状态文字 (默认 true) */
  showHudStatus?: boolean
  /** 排除拖拽交互的控件选择器 */
  excludeSelector?: string
  /** 悬浮控制栏选择器，自适应时自动扣除其高度 (默认 '.panzoom-hud-panel') */
  hudSelector?: string
  /** 浮层与下拉菜单关闭时的回调 */
  onDismissOverlays?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  baseWidth: 1100,
  baseHeight: 680,
  minScale: 0.1,
  maxScale: 3.5,
  step: 0.08,
  initialScale: 1.0,
  allowUpscale: true,
  requireCtrlForWheel: true,
  enablePan: true,
  doubleClickReset: true,
  autoFitOnResize: true,
  autoFitOnInit: true,
  showHud: true,
  showHudStatus: true,
  hudSelector: '.panzoom-hud-panel'
})

const emit = defineEmits<{
  (e: 'scaleChange', scale: number): void
  (e: 'panChange', x: number, y: number): void
}>()

const viewportRef = ref<HTMLElement | null>(null)
const targetRef = ref<HTMLElement | null>(null)

// 锁定目标包裹层的物理基准尺寸 (防止被 flex 挤压变形)
const targetStyle = computed<CSSProperties>(() => ({
  width: `${props.baseWidth}px`,
  minWidth: `${props.baseWidth}px`,
  maxWidth: `${props.baseWidth}px`,
  height: props.baseHeight ? `${props.baseHeight}px` : 'auto',
  flexShrink: 0
}))

const panzoomOptions: UsePanzoomOptions = {
  baseWidth: props.baseWidth,
  baseHeight: props.baseHeight,
  minScale: props.minScale,
  maxScale: props.maxScale,
  step: props.step,
  initialScale: props.initialScale,
  allowUpscale: props.allowUpscale,
  requireCtrlForWheel: props.requireCtrlForWheel,
  enablePan: props.enablePan,
  doubleClickReset: props.doubleClickReset,
  autoFitOnResize: props.autoFitOnResize,
  autoFitOnInit: props.autoFitOnInit,
  excludeSelector: props.excludeSelector,
  hudSelector: props.hudSelector,
  onDismissOverlays: props.onDismissOverlays,
  onScaleChange: (scale) => emit('scaleChange', scale),
  onPanChange: (x, y) => emit('panChange', x, y)
}

const {
  panzoom,
  scale,
  scalePercent,
  isPanning,
  isCtrlPressed,
  isSpacePressed,
  isAutoFit,
  zoomIn,
  zoomOut,
  zoomTo,
  reset,
  fitToContainer,
  dismissAllOverlays
} = usePanzoom(targetRef, viewportRef, panzoomOptions)

// 暴露全部状态与方法给父组件使用
defineExpose({
  panzoom,
  scale,
  scalePercent,
  isPanning,
  isCtrlPressed,
  isSpacePressed,
  isAutoFit,
  zoomIn,
  zoomOut,
  zoomTo,
  reset,
  fitToContainer,
  dismissAllOverlays
})
</script>

<style scoped>
/* ================= 1. 外部视口容器 ================= */
.panzoom-viewport-box {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 0%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 6px;
  box-sizing: border-box;
  container-type: inline-size;
  user-select: none;
}

/* ================= 2. 居中视口工作区舞台 ================= */
.panzoom-stage {
  flex: 1 1 0%;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: visible;
}

/* ================= 3. 目标缩放包裹层 ================= */
.panzoom-target-wrapper {
  transform-origin: 50% 50%;
  cursor: default;
}

.panzoom-target-wrapper.cursor-grab {
  cursor: grab !important;
}

.panzoom-target-wrapper.cursor-grabbing {
  cursor: grabbing !important;
}

/* ================= 4. 浮动 HUD 控制栏 (Dark Glass 质感) ================= */
.panzoom-hud-panel {
  flex-shrink: 0;
  position: sticky;
  top: 6px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  padding: 5px 14px;
  background: rgba(33, 36, 40, 0.88);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.5);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #f1f5f9;
}

.panzoom-hud-panel:hover {
  background: rgba(38, 41, 46, 0.96);
  border-color: rgba(255, 255, 255, 0.2);
}

.panzoom-hud-panel.ctrl-active {
  border-color: #22c55e;
  background: rgba(20, 36, 26, 0.95);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3), 0 8px 20px -3px rgba(34, 197, 94, 0.2);
}

.panzoom-hud-panel.space-active {
  border-color: #38bdf8;
  background: rgba(15, 30, 48, 0.95);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.3);
}

.hud-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hud-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #2b2e33;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hud-btn:hover {
  background: #383b42;
  color: #ffffff;
  border-color: #64748b;
}

.hud-scale-btn {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: #2b2e33;
  padding: 3px 10px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hud-scale-btn:hover {
  background: #383b42;
  border-color: #38bdf8;
  color: #7dd3fc;
}

.hud-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 2px;
}

.hud-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.hud-key-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 5px;
  border-radius: 4px;
  background: #1e2022;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-family: ui-monospace, monospace;
  font-size: 10px;
  font-weight: 600;
  color: #cbd5e1;
  transition: all 0.15s ease;
}

.hud-key-tag.tag-active {
  background: #22c55e;
  border-color: #22c55e;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.hud-dot {
  color: #64748b;
  font-weight: bold;
}

.hud-mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border-radius: 12px;
  background: #2b2e33;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hud-mode-pill:hover {
  background: #383b42;
  color: #ffffff;
}

.hud-mode-pill.mode-autofit {
  background: rgba(14, 165, 233, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
}

.mode-led {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64748b;
  transition: all 0.15s ease;
}

.hud-mode-pill.mode-autofit .mode-led {
  background: #38bdf8;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.8);
}

/* 窄容器微缩响应式 (<680px) */
@container (max-width: 680px) {
  .panzoom-hud-panel {
    flex-direction: row;
    justify-content: space-between;
    padding: 3px 8px;
    gap: 6px;
    margin-bottom: 4px;
    border-radius: 12px;
  }
  .hud-status .hud-tip-text,
  .hud-status .hud-dot {
    display: none;
  }
}
</style>
