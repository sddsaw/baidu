import { ref, computed, shallowRef, onMounted, onUnmounted, type Ref, type ComputedRef, type ShallowRef } from 'vue'
import Panzoom, { type PanzoomObject, type PanzoomOptions } from '@panzoom/panzoom'

export interface UsePanzoomOptions {
  /** 最小缩放倍数，默认 0.3 */
  minScale?: number
  /** 最大缩放倍数，默认 3.0 */
  maxScale?: number
  /** 单次滚轮或点击缩放步进，默认 0.1 */
  step?: number
  /** 初始缩放倍数，默认 1.0 */
  initialScale?: number
  /** 是否必须按住 Ctrl (或 Mac Command) 键才触发滚轮缩放，默认 true */
  requireCtrlForWheel?: boolean
  /** 是否开启拖拽平移，默认 true */
  enablePan?: boolean
  /** 双击空白处是否快速复位，默认 true */
  doubleClickReset?: boolean
  /**
   * 排除拖拽平移的元素选择器（默认自动排除各类输入框、下拉框、按钮等，确保表单交互完全正常）
   */
  excludeSelector?: string
  /** 缩放比例改变时的回调 */
  onScaleChange?: (scale: number) => void
  /** 平移位置改变时的回调 */
  onPanChange?: (x: number, y: number) => void
}

export interface UsePanzoomReturn {
  /** Panzoom 底层实例对象 */
  panzoom: ShallowRef<PanzoomObject | null>
  /** 当前实时缩放比例（数值，如 1.0, 1.25） */
  scale: Ref<number>
  /** 当前缩放比例百分比字符串（如 "100%", "125%"） */
  scalePercent: ComputedRef<string>
  /** 当前是否处于拖拽平移中 */
  isPanning: Ref<boolean>
  /** 当前键盘是否正按住 Ctrl / Command 键 */
  isCtrlPressed: Ref<boolean>
  /** 当前是否按住空格键（抓手平移模式） */
  isSpacePressed: Ref<boolean>
  /** 放大一步 */
  zoomIn: (customStep?: number) => void
  /** 缩小一步 */
  zoomOut: (customStep?: number) => void
  /** 缩放到指定倍数 */
  zoomTo: (targetScale: number) => void
  /** 复位缩放和平移（回到 1.0 倍且居中） */
  reset: () => void
  /** 自适应容器（将组件缩放到适合外层容器的大小） */
  fitToContainer: () => void
}

/**
 * usePanzoom Hook
 * 专为客户端组件设计的平移与缩放组合式函数 (Vue 3 Composable)
 * 核心特性：
 * 1. 严格支持 Ctrl + 鼠标滚轮 精准以光标为中心缩放（Focal Point Zooming）
 * 2. 智能防冲突：自动排除输入框、下拉框、按钮等控件，保证机台表单交互 100% 顺畅
 * 3. 支持鼠标平移、空格抓手拖拽与双击复位
 * 4. 完整的生命周期清理，防止内存泄漏
 *
 * @param targetRef 需要被缩放/平移的目标组件 DOM Ref
 * @param containerRef 包含该组件的外层视口容器 Ref（若不传，则取 targetRef 的父级元素）
 * @param options 可选配置项
 */
export function usePanzoom(
  targetRef: Ref<HTMLElement | null>,
  containerRef?: Ref<HTMLElement | null>,
  options: UsePanzoomOptions = {}
): UsePanzoomReturn {
  const {
    minScale = 0.3,
    maxScale = 3.0,
    step = 0.1,
    initialScale = 1.0,
    requireCtrlForWheel = true,
    enablePan = true,
    doubleClickReset = true,
    excludeSelector = 'input, select, textarea, button, a, [role="button"], .el-select, .el-select-dropdown, .el-input, .el-button, .el-checkbox, .el-switch, .ate-btn, .ate-input, .ate-select, .no-panzoom',
    onScaleChange,
    onPanChange
  } = options

  const panzoom = shallowRef<PanzoomObject | null>(null)
  const scale = ref<number>(initialScale)
  const isPanning = ref<boolean>(false)
  const isCtrlPressed = ref<boolean>(false)
  const isSpacePressed = ref<boolean>(false)

  // 格式化缩放百分比
  const scalePercent = computed(() => `${Math.round(scale.value * 100)}%`)

  // 更新缩放和平移状态
  const updateState = () => {
    if (!panzoom.value) return
    const currentScale = panzoom.value.getScale()
    scale.value = Number(currentScale.toFixed(2))
    onScaleChange?.(scale.value)

    const pan = panzoom.value.getPan()
    onPanChange?.(pan.x, pan.y)
  }

  // 键盘快捷键监听（Ctrl 与 空格键）
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Control' || e.key === 'Meta') {
      isCtrlPressed.value = true
    }
    // 当不在输入框中时，按住空格键开启抓手平移模式
    const activeEl = document.activeElement
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
    if (e.code === 'Space' && !isTyping) {
      isSpacePressed.value = true
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Control' || e.key === 'Meta') {
      isCtrlPressed.value = false
    }
    if (e.code === 'Space') {
      isSpacePressed.value = false
    }
  }

  // 核心：滚轮缩放事件处理
  const handleWheel = (event: WheelEvent) => {
    if (!panzoom.value) return

    // 如果开启了 requireCtrlForWheel，仅当用户按下 Ctrl / Command 时才执行缩放
    if (requireCtrlForWheel && !event.ctrlKey && !event.metaKey) {
      return
    }

    // 拦截浏览器默认的缩放行为与页面滚动
    event.preventDefault()

    // 调用 Panzoom 的以光标为中心的缩放方法
    panzoom.value.zoomWithWheel(event, {
      step
    })

    updateState()
  }

  // 鼠标按压平移处理（自定义事件分发，避免误触控件）
  const handlePointerDown = (event: PointerEvent) => {
    if (!panzoom.value || !enablePan) return

    const target = event.target as HTMLElement | null
    if (!target) return

    // 鼠标中键 (button 1) 始终允许平移
    const isMiddleMouse = event.button === 1
    // 空格键按下时允许平移
    const isSpaceDragging = isSpacePressed.value && event.button === 0

    // 如果是鼠标左键，且点击到了表单控件/排除选择器元素，则不启动平移
    if (!isMiddleMouse && !isSpaceDragging) {
      if (excludeSelector && target.closest(excludeSelector)) {
        return
      }
    }

    // 启动平移
    isPanning.value = true
    panzoom.value.handleDown(event)
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!panzoom.value || !isPanning.value) return
    panzoom.value.handleMove(event)
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (!panzoom.value) return
    if (isPanning.value) {
      panzoom.value.handleUp(event)
      isPanning.value = false
      updateState()
    }
  }

  // 双击空白处复位
  const handleDblClick = (event: MouseEvent) => {
    if (!doubleClickReset || !panzoom.value) return
    const target = event.target as HTMLElement | null
    if (target && excludeSelector && target.closest(excludeSelector)) {
      return
    }
    reset()
  }

  // 初始化 Panzoom 实例与事件绑定
  const initPanzoom = () => {
    const targetEl = targetRef.value
    if (!targetEl) return

    const containerEl = containerRef?.value || targetEl.parentElement
    if (!containerEl) return

    // 销毁可能存在的旧实例
    if (panzoom.value) {
      panzoom.value.destroy()
      panzoom.value = null
    }

    // 配置 Panzoom
    const panzoomConfig: PanzoomOptions = {
      minScale,
      maxScale,
      step,
      startScale: initialScale,
      noBind: true // 使用自定义精准事件监听，彻底杜绝与表单输入控件冲突
    }

    const instance = Panzoom(targetEl, panzoomConfig)
    panzoom.value = instance

    // 绑定 Panzoom 状态改变事件
    targetEl.addEventListener('panzoomchange', updateState)

    // 绑定指针拖拽事件
    targetEl.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)

    // 绑定滚轮缩放事件（必须 passive: false 以支持 preventDefault）
    containerEl.addEventListener('wheel', handleWheel, { passive: false })

    // 绑定双击事件
    if (doubleClickReset) {
      targetEl.addEventListener('dblclick', handleDblClick)
    }

    // 初始化缩放值
    updateState()
  }

  // 放大
  const zoomIn = (customStep?: number) => {
    if (!panzoom.value) return
    panzoom.value.zoomIn({ step: customStep ?? step })
    updateState()
  }

  // 缩小
  const zoomOut = (customStep?: number) => {
    if (!panzoom.value) return
    panzoom.value.zoomOut({ step: customStep ?? step })
    updateState()
  }

  // 缩放到指定比例
  const zoomTo = (targetScale: number) => {
    if (!panzoom.value) return
    const clampedScale = Math.min(Math.max(targetScale, minScale), maxScale)
    panzoom.value.zoom(clampedScale, { animate: true })
    updateState()
  }

  // 复位 (1.0 倍且居中)
  const reset = () => {
    if (!panzoom.value) return
    panzoom.value.reset({ animate: true })
    updateState()
  }

  // 自适应容器
  const fitToContainer = () => {
    const targetEl = targetRef.value
    const containerEl = containerRef?.value || targetEl?.parentElement
    if (!targetEl || !containerEl || !panzoom.value) return

    const containerWidth = containerEl.clientWidth - 48
    const containerHeight = containerEl.clientHeight - 48
    const targetWidth = targetEl.offsetWidth
    const targetHeight = targetEl.offsetHeight

    if (containerWidth <= 0 || targetWidth <= 0) return

    const scaleX = containerWidth / targetWidth
    const scaleY = containerHeight / targetHeight
    const fitScale = Math.min(scaleX, scaleY, 1.0)

    panzoom.value.reset({ animate: false })
    zoomTo(fitScale)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    initPanzoom()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)

    const targetEl = targetRef.value
    const containerEl = containerRef?.value || targetEl?.parentElement

    if (targetEl) {
      targetEl.removeEventListener('pointerdown', handlePointerDown)
      targetEl.removeEventListener('panzoomchange', updateState)
      if (doubleClickReset) {
        targetEl.removeEventListener('dblclick', handleDblClick)
      }
    }

    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)

    if (containerEl) {
      containerEl.removeEventListener('wheel', handleWheel)
    }

    if (panzoom.value) {
      panzoom.value.destroy()
      panzoom.value = null
    }
  })

  return {
    panzoom,
    scale,
    scalePercent,
    isPanning,
    isCtrlPressed,
    isSpacePressed,
    zoomIn,
    zoomOut,
    zoomTo,
    reset,
    fitToContainer
  }
}
