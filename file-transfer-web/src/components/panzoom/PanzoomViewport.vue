<template>
  <div class="panzoom-viewport-box" ref="viewportRef">
    <!-- 1. 浮动 HUD 控制面板 (可通 showHud 开关，或通过 #hud 插槽完全替换) -->
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
        <!-- 默认内建精美 Dark Glass HUD -->
        <div class="hud-controls">
          <button class="hud-btn" @click="zoomOut()" title="缩小 (Ctrl + 滚轮向下)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button class="hud-scale-btn" @click="reset()" title="点击复位为 100%">
            {{ scalePercent }}
          </button>
          <button class="hud-btn" @click="zoomIn()" title="放大 (Ctrl + 滚轮向上)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
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
              <circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" />
            </svg>
          </button>
        </div>

        <!-- 键盘操作状态与指示灯 -->
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
      <!-- 3. 要缩放的目标包裹层 (Target) -->
      <div
        class="panzoom-target-wrapper"
        ref="targetRef"
        :style="targetStyle"
        :class="{ 'cursor-grab': isSpacePressed, 'cursor-grabbing': isPanning }"
      >
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

export interface PanzoomViewportProps extends UsePanzoomOptions {
  /** 是否显示顶部浮动 HUD 控制面板 (默认 true) */
  showHud?: boolean
  /** 是否显示 HUD 内部的快捷键状态文字 (默认 true) */
  showHudStatus?: boolean
}

const props = withDefaults(defineProps<PanzoomViewportProps>(), {
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

// 调用核心 Hook
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
} = usePanzoom(targetRef, viewportRef, {
  ...props,
  onScaleChange: (scale) => emit('scaleChange', scale),
  onPanChange: (x, y) => emit('panChange', x, y)
})

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
/* ================= 1. 外部视口与舞台 ================= */
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
  box-sizing: border-box;
  container-type: inline-size;
  user-select: none;
}

.panzoom-stage {
  flex: 1 1 0%;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.panzoom-target-wrapper {
  transform-origin: 50% 50%;
}
.panzoom-target-wrapper.cursor-grab { cursor: grab !important; }
.panzoom-target-wrapper.cursor-grabbing { cursor: grabbing !important; }

/* ================= 2. 浮动 HUD 控制栏 (Dark Glass) ================= */
.panzoom-hud-panel {
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
  transition: all 0.2s ease;
  color: #f1f5f9;
}
.panzoom-hud-panel.ctrl-active {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
}
.panzoom-hud-panel.space-active {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.hud-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hud-btn,
.hud-scale-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #2b2e33;
  color: #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hud-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hud-btn:hover {
  background: #383b42;
  color: #ffffff;
}

.hud-scale-btn {
  padding: 3px 10px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
}
.hud-scale-btn:hover {
  background: #383b42;
  color: #7dd3fc;
}

.hud-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 2px;
}

/* ================= 3. HUD 状态指示 ================= */
.hud-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.hud-key-tag {
  padding: 1px 5px;
  border-radius: 4px;
  background: #1e2022;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-family: ui-monospace, monospace;
  font-size: 10px;
  font-weight: 600;
  color: #cbd5e1;
}
.hud-key-tag.tag-active {
  background: #22c55e;
  border-color: #22c55e;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.hud-dot { color: #64748b; font-weight: bold; }

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
}
.hud-mode-pill.mode-autofit .mode-led {
  background: #38bdf8;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.8);
}

/* 窄容器微缩 (<680px) */
@container (max-width: 680px) {
  .panzoom-hud-panel {
    flex-direction: row;
    padding: 3px 8px;
    gap: 6px;
  }
  .hud-status .hud-tip-text,
  .hud-status .hud-dot {
    display: none;
  }
}
</style>
