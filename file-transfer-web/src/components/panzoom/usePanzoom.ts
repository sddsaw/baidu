import { ref, computed, shallowRef, onMounted, onUnmounted, type Ref, type ComputedRef, type ShallowRef } from 'vue'
import Panzoom, { type PanzoomObject } from '@panzoom/panzoom'

export interface UsePanzoomOptions {
  /** 目标组件设计宽度 (默认 1100)，作为等比缩放基准 */
  baseWidth?: number
  /** 目标组件设计高度 (默认 680) */
  baseHeight?: number
  /** 最小缩放比 (默认 0.1) */
  minScale?: number
  /** 最大缩放比 (默认 3.5) */
  maxScale?: number
  /** 缩放步长 (默认 0.08) */
  step?: number
  /** 初始缩放比 (默认 1.0) */
  initialScale?: number
  /** 是否允许在大容器下拉伸放大超过 1.0，实现 100% 充满父级宽度 (默认 true) */
  allowUpscale?: boolean
  /** 是否必须按住 Ctrl / Command 键才触发滚轮缩放 (默认 true) */
  requireCtrlForWheel?: boolean
  /** 是否允许鼠标拖拽平移 (默认 true) */
  enablePan?: boolean
  /** 是否允许双击空白处复位 (默认 true) */
  doubleClickReset?: boolean
  /** 容器尺寸变动时是否自动等比自适应 (默认 true) */
  autoFitOnResize?: boolean
  /** 初始化挂载时是否自动自适应 (默认 true) */
  autoFitOnInit?: boolean
  /** 排除拖拽交互的控件选择器 */
  excludeSelector?: string
  /** 悬浮控制栏选择器，自适应时自动扣除其高度 (默认 '.zoom-hud-panel') */
  hudSelector?: string
  /** 浮层与下拉菜单关闭时的回调 */
  onDismissOverlays?: () => void
  /** 缩放比变更回调 */
  onScaleChange?: (scale: number) => void
  /** 平移位置变更回调 */
  onPanChange?: (x: number, y: number) => void
}

export interface UsePanzoomReturn {
  panzoom: ShallowRef<PanzoomObject | null>
  scale: Ref<number>
  scalePercent: ComputedRef<string>
  isPanning: Ref<boolean>
  isCtrlPressed: Ref<boolean>
  isSpacePressed: Ref<boolean>
  isAutoFit: Ref<boolean>
  zoomIn: (customStep?: number) => void
  zoomOut: (customStep?: number) => void
  zoomTo: (targetScale: number) => void
  reset: () => void
  fitToContainer: () => void
  dismissAllOverlays: () => void
}

/**
 * usePanzoom - 专为客户端组件设计的平移与缩放组合式 Hook
 * 核心特性：
 * 1. Ctrl + 滚轮光标定点缩放；
 * 2. 窗口及纯 DOM 容器拉伸时，60fps 长高双向等比自适应（小屏自动缩小，大屏充满父级宽度）；
 * 3. 输入框点击空白处主动失焦保存，平移/缩放时自动收起下拉选项；
 * 4. 自动排除表单控件，交互不冲突。
 */
export function usePanzoom(
  targetRef: Ref<HTMLElement | null>,
  containerRef?: Ref<HTMLElement | null>,
  options: UsePanzoomOptions = {}
): UsePanzoomReturn {
  const {
    baseWidth = 1100,
    baseHeight = 680,
    minScale = 0.1,
    maxScale = 3.5,
    step = 0.08,
    initialScale = 1.0,
    allowUpscale = true,
    requireCtrlForWheel = true,
    enablePan = true,
    doubleClickReset = true,
    autoFitOnResize = true,
    autoFitOnInit = true,
    excludeSelector = 'input, select, textarea, button, a, [role="button"], .el-select, .el-input, .el-button, .ate-btn, .ate-input, .ate-select',
    hudSelector = '.zoom-hud-panel',
    onDismissOverlays,
    onScaleChange,
    onPanChange
  } = options

  // 响应式状态
  const panzoom = shallowRef<PanzoomObject | null>(null)
  const scale = ref(initialScale)
  const isPanning = ref(false)
  const isCtrlPressed = ref(false)
  const isSpacePressed = ref(false)
  const isAutoFit = ref(true)

  let resizeObserver: ResizeObserver | null = null
  let rAFId: number | null = null

  // 格式化缩放百分比 (如 "85%")
  const scalePercent = computed(() => `${Math.round(scale.value * 100)}%`)

  // 同步当前 Panzoom 的 scale 与 pan 坐标
  const updateState = () => {
    if (!panzoom.value) return
    scale.value = Number(panzoom.value.getScale().toFixed(2))
    onScaleChange?.(scale.value)
    const pan = panzoom.value.getPan()
    onPanChange?.(pan.x, pan.y)
  }

  // 收起页面所有打开的下拉选项菜单、浮动气泡，并让输入框失焦保存
  const dismissAllOverlays = () => {
    onDismissOverlays?.()

    // 1. 让当前聚焦的输入框/下拉框失焦，触发其校验与保存
    const activeEl = document.activeElement as HTMLElement | null
    if (activeEl && activeEl !== document.body && 'blur' in activeEl) {
      activeEl.blur()
    }

    // 2. 模拟 Escape 键，触发主流 UI 库 (Element Plus / Ant Design 等) 自行收起展开的下拉浮层
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))

    // 3. 广播全局空白点击事件，触发 Element Plus (ClickOutside) 及主流 UI 库干净收起浮层，绝不破坏 DOM 与响应式状态机
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  }

  // 自适应容器核心算法：基于基准尺寸进行长高双向等比自适应（小屏自动收缩防截断，大屏自动放大充满父容器）
  const fitToContainer = () => {
    dismissAllOverlays()
    const targetEl = targetRef.value
    const containerEl = containerRef?.value || targetEl?.parentElement
    if (!targetEl || !containerEl || !panzoom.value) return

    // 扣除边距与控制栏高度，计算可用尺寸
    const hudEl = hudSelector ? (containerEl.querySelector(hudSelector) as HTMLElement | null) : null
    const hudHeight = hudEl ? hudEl.offsetHeight + 10 : 0
    const availW = Math.max(containerEl.clientWidth - 32, 20)
    const availH = Math.max(containerEl.clientHeight - hudHeight - 20, 20)

    // 双向等比容纳比 (Aspect-fit contain)
    let fitScale = Math.min(availW / baseWidth, availH / baseHeight)
    
    // 若未开启 allowUpscale，则大屏下上限为 1.0；若开启（默认），则自动放大铺满父级
    if (!allowUpscale) {
      fitScale = Math.min(fitScale, 1.0)
    }

    // 向下保留 3 位小数，确保即使在极小像素边界也绝不发生 1px 溢出
    fitScale = Math.min(Math.max(Math.floor(fitScale * 1000) / 1000, minScale), maxScale)

    isAutoFit.value = true
    panzoom.value.reset({ animate: false })
    panzoom.value.zoom(fitScale, { animate: false })
    updateState()
  }

  // 容器尺寸变化监听 (rAF 帧同步，60fps 跟随)
  const handleResize = () => {
    if (!autoFitOnResize) return
    dismissAllOverlays()
    if (isAutoFit.value) {
      if (rAFId) cancelAnimationFrame(rAFId)
      rAFId = requestAnimationFrame(() => fitToContainer())
    }
  }

  // 滚轮缩放事件
  const handleWheel = (event: WheelEvent) => {
    if (!panzoom.value) return
    // 若要求按住 Ctrl，未按住时不响应缩放
    if (requireCtrlForWheel && !event.ctrlKey && !event.metaKey) return

    event.preventDefault()
    dismissAllOverlays()
    isAutoFit.value = false
    panzoom.value.zoomWithWheel(event, { step })
    updateState()
  }

  // 鼠标指针按下事件
  const handlePointerDown = (event: PointerEvent) => {
    if (!panzoom.value || !enablePan) return
    const target = event.target as HTMLElement | null
    if (!target) return

    const isExcluded = excludeSelector ? Boolean(target.closest(excludeSelector)) : false

    // 点击空白处时，自动收起下拉列表并失焦输入框
    if (!isExcluded) {
      dismissAllOverlays()
    }

    // 鼠标中键或空格键按下时允许平移；左键点击表单控件时不平移
    const canPan = event.button === 1 || (isSpacePressed.value && event.button === 0)
    if (!canPan && isExcluded) return

    isPanning.value = true
    panzoom.value.handleDown(event)
  }

  // 鼠标移动与松开
  const handlePointerMove = (event: PointerEvent) => {
    if (!panzoom.value || !isPanning.value) return
    dismissAllOverlays()
    isAutoFit.value = false
    panzoom.value.handleMove(event)
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (!panzoom.value || !isPanning.value) return
    panzoom.value.handleUp(event)
    isPanning.value = false
    updateState()
  }

  // 双击空白处复位
  const handleDblClick = (event: MouseEvent) => {
    if (!doubleClickReset || !panzoom.value) return
    const target = event.target as HTMLElement | null
    if (target && excludeSelector && target.closest(excludeSelector)) return
    fitToContainer()
  }

  // 键盘快捷键监听
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Control' || e.key === 'Meta') isCtrlPressed.value = true
    const active = document.activeElement
    const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
    if (e.code === 'Space' && !isTyping) isSpacePressed.value = true
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Control' || e.key === 'Meta') isCtrlPressed.value = false
    if (e.code === 'Space') isSpacePressed.value = false
  }

  // 外部主动控制方法
  const zoomIn = (customStep?: number) => {
    dismissAllOverlays()
    isAutoFit.value = false
    panzoom.value?.zoomIn({ step: customStep ?? step })
    updateState()
  }

  const zoomOut = (customStep?: number) => {
    dismissAllOverlays()
    isAutoFit.value = false
    panzoom.value?.zoomOut({ step: customStep ?? step })
    updateState()
  }

  const zoomTo = (targetScale: number) => {
    dismissAllOverlays()
    const clamped = Math.min(Math.max(targetScale, minScale), maxScale)
    panzoom.value?.zoom(clamped, { animate: true })
    updateState()
  }

  const reset = () => {
    dismissAllOverlays()
    isAutoFit.value = true
    panzoom.value?.reset({ animate: true })
    updateState()
  }

  // 初始化与销毁
  const initPanzoom = () => {
    const targetEl = targetRef.value
    const containerEl = containerRef?.value || targetEl?.parentElement
    if (!targetEl || !containerEl) return

    panzoom.value?.destroy()
    panzoom.value = Panzoom(targetEl, {
      minScale,
      maxScale,
      step,
      startScale: initialScale,
      noBind: true // 使用自定义精准事件监听，彻底杜绝与表单输入控件冲突
    })

    // 事件绑定
    targetEl.addEventListener('panzoomchange', updateState)
    targetEl.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    containerEl.addEventListener('wheel', handleWheel, { passive: false })
    if (doubleClickReset) targetEl.addEventListener('dblclick', handleDblClick)

    // DOM 尺寸监听
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(containerEl)
    }
    window.addEventListener('resize', handleResize)

    // 初始化自适应
    if (autoFitOnInit) {
      setTimeout(fitToContainer, 30)
    } else {
      updateState()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    initPanzoom()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('resize', handleResize)
    if (rAFId) cancelAnimationFrame(rAFId)
    resizeObserver?.disconnect()

    const targetEl = targetRef.value
    const containerEl = containerRef?.value || targetEl?.parentElement
    if (targetEl) {
      targetEl.removeEventListener('pointerdown', handlePointerDown)
      targetEl.removeEventListener('panzoomchange', updateState)
      targetEl.removeEventListener('dblclick', handleDblClick)
    }
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)
    containerEl?.removeEventListener('wheel', handleWheel)
    panzoom.value?.destroy()
  })

  return {
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
  }
}
