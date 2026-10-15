<template>
  <div class="dc-vi-container" ref="viewportRef">
    <!-- 悬浮缩放控制栏与交互提示 (Floating Zoom HUD) -->
    <div class="zoom-hud-panel" :class="{ 'ctrl-active': isCtrlPressed, 'space-active': isSpacePressed }">
      <div class="hud-controls">
        <el-tooltip content="缩小机台 (按住 Ctrl 滚轮向下)" placement="bottom">
          <button class="hud-btn" @click="zoomOut()">
            <el-icon><ZoomOut /></el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="点击复位缩放为 100%" placement="bottom">
          <button class="hud-scale-btn" @click="resetZoom">
            {{ scalePercent }}
          </button>
        </el-tooltip>
        <el-tooltip content="放大机台 (按住 Ctrl 滚轮向上)" placement="bottom">
          <button class="hud-btn" @click="zoomIn()">
            <el-icon><ZoomIn /></el-icon>
          </button>
        </el-tooltip>
        <div class="hud-divider"></div>
        <el-tooltip content="自适应外层视口" placement="bottom">
          <button class="hud-btn" @click="fitToContainer">
            <el-icon><FullScreen /></el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="复位 1:1 与位置 (双击空白处也可复位)" placement="bottom">
          <button class="hud-btn" @click="resetZoom">
            <el-icon><Aim /></el-icon>
          </button>
        </el-tooltip>
      </div>

      <div class="hud-status">
        <span class="hud-key-tag" :class="{ 'tag-active': isCtrlPressed }">Ctrl</span>
        <span class="hud-tip-text">
          {{ isCtrlPressed ? '按住中: 滚动滚轮即可平滑缩放' : '+ 鼠标滚轮缩放' }}
        </span>
        <span class="hud-dot">·</span>
        <span class="hud-key-tag" :class="{ 'tag-active': isSpacePressed }">Space</span>
        <span class="hud-tip-text">
          {{ isSpacePressed ? '抓手模式: 按住鼠标拖动画布' : '+ 鼠标拖拽平移' }}
        </span>
        <span class="hud-dot">·</span>
        <span
          class="hud-mode-pill"
          :class="{ 'mode-autofit': isAutoFit }"
          @click="fitToContainer"
          :title="isAutoFit ? '当前处于窗口拉伸自适应模式' : '点击切回窗口拉伸自适应模式'"
        >
          <span class="mode-led"></span>
          {{ isAutoFit ? '窗口拉伸自适应' : '自由观察中' }}
        </span>
      </div>
    </div>

    <!-- 主机台外框 (Teradyne UltraFLEX / IG-XL 风格经典集成测试仪) -->
    <div
      class="ate-instrument-chassis"
      ref="chassisRef"
      :class="{ 'cursor-grab': isSpacePressed, 'cursor-grabbing': isPanning }"
    >
      
      <!-- ================= 1. 顶部操作工具栏 (Header Toolbar) ================= -->
      <div class="ate-toolbar">
        <div class="toolbar-left">
          <!-- Site 选择 -->
          <div class="site-box">
            <span class="label">Site:</span>
            <el-select v-model="siteValue" size="small" class="site-select">
              <el-option :value="0" label="0" />
              <el-option :value="1" label="1" />
              <el-option :value="2" label="2" />
              <el-option :value="3" label="3" />
            </el-select>
          </div>

          <!-- Master 勾选项 -->
          <label class="master-checkbox">
            <input type="checkbox" v-model="isMaster" />
            <span>Master</span>
          </label>

          <div class="toolbar-divider"></div>

          <!-- 工具图标组 -->
          <div class="tool-icons">
            <el-tooltip content="复制当前通道配置" placement="top">
              <button class="tool-icon-btn" @click="handleDuplicate">
                <el-icon><CopyDocument /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="矩阵通道扩展视图" placement="top">
              <button class="tool-icon-btn" @click="handleMatrixView">
                <el-icon><Grid /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="重置通道设定" placement="top">
              <button class="tool-icon-btn" @click="handleResetConfig">
                <el-icon><RefreshRight /></el-icon>
              </button>
            </el-tooltip>

            <div class="toolbar-divider mini"></div>

            <!-- 工具栏内置缩放快捷组 -->
            <el-tooltip content="缩小 (Ctrl + 滚轮向下)" placement="top">
              <button class="tool-icon-btn" @click="zoomOut()">
                <el-icon><ZoomOut /></el-icon>
              </button>
            </el-tooltip>
            <span class="zoom-badge-pill" @click="resetZoom" title="点击复位到 100%">{{ scalePercent }}</span>
            <el-tooltip content="放大 (Ctrl + 滚轮向上)" placement="top">
              <button class="tool-icon-btn" @click="zoomIn()">
                <el-icon><ZoomIn /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="复位 1:1" placement="top">
              <button class="tool-icon-btn" @click="resetZoom">
                <el-icon><Aim /></el-icon>
              </button>
            </el-tooltip>
          </div>

          <!-- COPY CODE 按钮 -->
          <button class="ate-btn copy-btn" @click="copyAteCode" title="复制生成的 ATE C++/IG-XL 驱动调用代码">
            <el-icon><DocumentCopy /></el-icon>
            <span>{{ copySuccess ? 'COPIED!' : 'COPY CODE' }}</span>
          </button>
        </div>

        <!-- 右侧机台在线状态 -->
        <div class="toolbar-right">
          <div class="status-pill">
            <span class="online-led"></span>
            <span>ATE Channel Online</span>
          </div>
          <span class="hardware-id">Teradyne UltraFLEX VI (Slot 19)</span>
        </div>
      </div>

      <!-- ================= 2. 舒展均衡的统一工作画布 (min-height: 665px) ================= -->
      <div class="unified-canvas">
        
        <!-- 全局统一矢量拓扑 SVG 层 (保证所有连线与元器件 100% 物理精准对齐) -->
        <svg class="main-topology-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- 指向左侧 Meter Reading 的标准箭头 (端点向左) -->
            <marker id="arrow-left" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 1 2 L 8 5 L 1 8 z" fill="#1e293b" />
            </marker>
          </defs>

          <!-- A. 驱动源输出主干线 (向右展开，y = 208px 中心线) -->
          <line
            x1="606"
            y1="208"
            x2="650"
            y2="208"
            stroke="#334155"
            stroke-width="2.5"
            :class="{ 'wire-active-flow': isGateActive }"
          />
          
          <!-- 压摆整形方块 [/‾] (严格嵌入 x=650~688, y=208 导线断口) -->
          <g class="svg-slew-box">
            <rect x="650" y="193" width="38" height="30" rx="3" fill="#ffffff" stroke="#334155" stroke-width="2"/>
            <path d="M 656 215 L 665 215 L 673 201 L 682 201" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <line
            x1="688"
            y1="208"
            x2="730"
            y2="208"
            stroke="#334155"
            stroke-width="2.5"
            :class="{ 'wire-active-flow': isGateActive }"
          />

          <!-- 精密采样电阻 /\\/\\/\\ (严格嵌入 x=730~805, y=208 导线断口) -->
          <path
            d="M 730 208 L 737 208 L 743 198 L 753 218 L 763 198 L 773 218 L 783 198 L 793 218 L 799 208 L 805 208"
            fill="none"
            stroke="#0f172a"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
          <line
            x1="805"
            y1="208"
            x2="1000"
            y2="208"
            stroke="#334155"
            stroke-width="2.5"
            :class="{ 'wire-active-flow': isGateActive }"
          />

          <!-- B. Sense 远端感测回路平行线 (从紫色圆引出至 y = 270px，延伸至 x=1000) -->
          <line
            x1="580"
            y1="270"
            x2="1000"
            y2="270"
            stroke="#334155"
            stroke-width="2.5"
            :class="{ 'wire-active-flow': isGateActive }"
          />

          <!-- C. Kelvin 垂直短接红母线 (跨接 Force y=208 与 Sense y=270，右展至 x=1000 饱满布局) -->
          <line x1="1000" y1="175" x2="1000" y2="305" stroke="#dc2626" stroke-width="4"/>
          <polygon points="1000,204 1012,208 1000,212" fill="#dc2626"/>
          <polygon points="1000,266 1012,270 1000,274" fill="#dc2626"/>

          <!-- D. 电阻两端测量抽头节点 (Junction Dots) -->
          <circle cx="730" cy="208" r="3.5" fill="#334155"/>
          <circle cx="800" cy="208" r="3.5" fill="#334155"/>

          <!-- E. 差分采样下行回路 (引向右侧，再 90度垂直折向下接入 Meter 右侧竖直基底) -->
          <!-- 抽头 1 (电阻前侧 x=730)：垂直向下引至 y=395，向左进入 Meter 基底 (x=635, y=395) -->
          <path d="M 730 208 L 730 395 L 635 395" fill="none" stroke="#334155" stroke-width="2"/>
          
          <!-- 抽头 2 (电阻后侧 x=800)：垂直向下引至 y=435，向左进入 Meter 基底 (x=635, y=435) -->
          <path d="M 800 208 L 800 435 L 635 435" fill="none" stroke="#334155" stroke-width="2"/>

          <!-- F. 橙色梯形 Meter (尖端在 x=510, y=419，基底在 x=635, y: 375~463) -->
          <polygon points="510,419 635,375 635,463" fill="#f59e0b" stroke="#b45309" stroke-width="2.5"/>
          <text x="585" y="423" font-size="13" font-weight="900" fill="#78350f" text-anchor="middle">Meter</text>

          <!-- G. 从 Meter 尖端连至 Filter 方框右侧 (x=510 -> x=458, y=419) -->
          <line x1="510" y1="419" x2="458" y2="419" stroke="#334155" stroke-width="2.2"/>

          <!-- H. 滤波阶跃特性符号方框 (Filter Box，位于 x=420~458, y=404~434) -->
          <rect x="420" y="404" width="38" height="30" rx="3" fill="#ffffff" stroke="#334155" stroke-width="2"/>
          <!-- 阶跃滤波特征符号：高平 -> 阶跃下跌 -> 低平 -->
          <path d="M 426 411 L 435 411 L 443 427 L 452 427" fill="none" stroke="#0f172a" stroke-width="2.2"/>

          <!-- I. 从 Filter 方框左侧直达 Meter Reading 回读框的箭头线 (x=420 -> x=250, y=419 严格共轴) -->
          <line x1="420" y1="419" x2="250" y2="419" stroke="#334155" stroke-width="2.5" marker-end="url(#arrow-left)"/>

          <!-- J. 限流保护总线 (从 Source/Sink Limit 汇入紫色圆圈左侧) -->
          <path d="M 364 135 L 395 135 L 395 185 L 435 185" fill="none" stroke="#1d4ed8" stroke-width="2.2"/>
          <path d="M 364 230 L 435 230" fill="none" stroke="#2563eb" stroke-width="2.2"/>
        </svg>

        <!-- ================= 3. 控件层 (舒展布局，层次分明) ================= -->

        <!-- 1. Source Current Limit 卡片 (左上，宽 340px，简洁纯净版) -->
        <div class="card-box source-limit-card">
          <div class="card-header">
            <h3 class="card-title">Source Current Limit</h3>
            <span class="tag-badge tag-blue">I-Source</span>
          </div>
          <!-- 纯净参数容器：无方格背景与杂波，保持清爽参数输入 -->
          <div class="card-body">
            <div class="param-row">
              <span class="param-label">Fold Limit:</span>
              <div class="param-value-wrap">
                <span class="sub-label">Level:</span>
                <input type="text" v-model="sourceFoldLimit" class="ate-input text-emerald" />
                <span class="unit">A</span>
              </div>
            </div>
            <div class="param-row param-divider">
              <span class="param-label">Current Range:</span>
              <div class="param-value-wrap">
                <select v-model="sourceRange" class="ate-select range-select">
                  <option value="81">81</option>
                  <option value="50">50</option>
                  <option value="20">20</option>
                </select>
                <span class="unit">A</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Sink Current Limit 卡片 (左中，宽 340px，top: 180px，简洁纯净版) -->
        <div class="card-box sink-limit-card">
          <div class="card-header">
            <h3 class="card-title">Sink Current Limit</h3>
            <span class="tag-badge tag-indigo">I-Sink</span>
          </div>
          <!-- 纯净参数容器 -->
          <div class="card-body">
            <div class="param-row">
              <span class="param-label">Fold Limit:</span>
              <div class="param-value-wrap">
                <span class="sub-label">Level:</span>
                <input type="text" v-model="sinkFoldLimit" class="ate-input text-blue" />
                <span class="unit">A</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Meter Reading 回读框行 (严格对齐 y=419px 中心轴线) -->
        <div class="meter-reading-box">
          <div class="reading-row">
            <span class="reading-label">Meter Reading:</span>
            <div class="reading-input-wrap">
              <input
                type="text"
                :value="meterReading"
                readonly
                class="ate-input reading-display"
              />
              <span class="reading-unit">{{ meterUnit }}</span>
            </div>
          </div>
        </div>

        <!-- 4. 采样控制面板 (左下，top: 475px，控制测量模式与循环) -->
        <div class="card-box sample-ctrl-card">
          <div class="param-row mb-2">
            <span class="param-label">Sample Size:</span>
            <input type="number" v-model.number="sampleSize" min="1" max="1000" class="ate-input w-16" />
          </div>
          <div class="param-row mb-2">
            <label class="checkbox-label">
              <input type="checkbox" v-model="isNoStrobe" />
              <span>No Strobe</span>
            </label>
            <div class="led-indicator">
              <span class="led-dot" :class="ledClass"></span>
              <span class="led-text" :class="ledTextClass">{{ ledStatusText }}</span>
            </div>
          </div>
          <div class="btn-grid">
            <button
              class="ate-btn loop-btn"
              :class="{ 'active-loop': isLooping }"
              @click="toggleLoop"
            >
              {{ isLooping ? 'Stop Loop' : 'Loop Meter' }}
            </button>
            <button class="ate-btn read-btn" @click="triggerRead">
              Read Meter
            </button>
          </div>
        </div>

        <!-- 5. Filter 设定控件组 (位于 Filter Box 正上方，left: 400px, top: 350px) -->
        <div class="filter-ctrl-group">
          <div class="filter-row">
            <span class="label-bold">Filter:</span>
            <select v-model="filterFreq" class="ate-select">
              <option value="2539">2539</option>
              <option value="1000">1000</option>
              <option value="5000">5000</option>
            </select>
            <span class="unit">Hz</span>
          </div>
          <label class="checkbox-label sub-checkbox">
            <input type="checkbox" v-model="filterBypass" />
            <span>Bypass</span>
          </label>
        </div>

        <!-- 6. Mode & Range 控制组 (居于橙色梯形 Meter 正下方，left: 565px, top: 475px) -->
        <div class="meter-config-group">
          <div class="config-row">
            <span class="label-bold">Mode:</span>
            <select v-model="meterMode" class="ate-select font-bold" @change="onMeterModeChange">
              <option value="Current">Current</option>
              <option value="Voltage">Voltage</option>
            </select>
          </div>
          <div class="config-row">
            <span class="label-bold">Range:</span>
            <select v-model="meterRange" class="ate-select font-bold font-mono">
              <option value="101.25">101.25</option>
              <option value="50.00">50.00</option>
              <option value="10.00">10.00</option>
            </select>
            <span class="unit">{{ meterUnit }}</span>
          </div>
        </div>

        <!-- 7. 通道配置与运行模式联合主控区 (Pin, Mode, Bandwidth, DIB Channel 单行联合卡片) -->
        <div class="channel-master-bar">
          <!-- Pin 下拉选择 -->
          <div class="bar-item">
            <span class="bar-label">Pin:</span>
            <select v-model="selectedPin" class="ate-select pin-select">
              <option value="vcc">vcc</option>
              <option value="vdd">vdd</option>
              <option value="vio">vio</option>
              <option value="vcore">vcore</option>
              <option value="vref">vref</option>
            </select>
          </div>

          <div class="bar-divider"></div>

          <!-- Mode 工作模式下拉选择 -->
          <div class="bar-item">
            <span class="bar-label">Mode:</span>
            <select v-model="viMode" class="ate-select mode-select">
              <option value="High Impedance">High Impedance</option>
              <option value="Voltage">Voltage</option>
              <option value="Current">Current</option>
            </select>
          </div>

          <div class="bar-divider"></div>

          <!-- Bandwidth Setting 环路带宽下拉选择 -->
          <div class="bar-item">
            <span class="bar-label">Bandwidth Setting:</span>
            <select v-model="bandwidthSetting" class="ate-select bw-select">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>

          <div class="bar-divider"></div>

          <!-- DIB 槽位与物理通道硬件编号 -->
          <div class="bar-item">
            <span class="dib-label">DIB Channel:</span>
            <span class="dib-badge">19.x202</span>
          </div>
        </div>

        <!-- 8. 中央紫色控制圆 (Source Voltage Hub，居中于上下限流卡片分界处，中心 y=208px) -->
        <div class="purple-circle-hub">
          <h4 class="hub-title">Source Voltage</h4>
          <div class="hub-body">
            <div class="hub-row">
              <span class="hub-label">Main</span>
              <div class="hub-input-wrap">
                <input type="text" v-model="sourceMainVoltage" class="ate-input w-14" />
                <span class="unit">V</span>
              </div>
            </div>
            <div class="hub-row">
              <span class="hub-label">Alt</span>
              <div class="hub-input-wrap">
                <input type="text" v-model="sourceAltVoltage" class="ate-input w-14" />
                <span class="unit">V</span>
              </div>
            </div>
            <div class="hub-row">
              <span class="hub-label">Output:</span>
              <select v-model="sourceOutput" class="ate-select w-16">
                <option value="Main">Main</option>
                <option value="Alt">Alt</option>
                <option value="Off">Off</option>
              </select>
            </div>
          </div>
          <label class="gate-toggle-box">
            <input type="checkbox" v-model="isGateActive" />
            <span>Gate</span>
          </label>
        </div>

      </div>

      <!-- ================= 4. 底部状态指示条 (Footer Status Bar) ================= -->
      <div class="ate-footer">
        <div class="footer-left">
          <span class="status-title">Status:</span>
          <span class="status-msg">{{ statusMessage }}</span>
        </div>
        <div class="footer-right">
          Teradyne UltraFLEX / IG-XL Style DC-VI Interactive Instrumentation Panel
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import {
  DocumentCopy,
  CopyDocument,
  Grid,
  RefreshRight,
  ZoomIn,
  ZoomOut,
  FullScreen,
  Aim
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePanzoom } from '@/hooks/usePanzoom'

// 视口与机台容器 DOM 引用及 Panzoom 缩放 Hook
const viewportRef = ref<HTMLElement | null>(null)
const chassisRef = ref<HTMLElement | null>(null)

const {
  scalePercent,
  isCtrlPressed,
  isSpacePressed,
  isPanning,
  isAutoFit,
  zoomIn,
  zoomOut,
  reset: resetZoom,
  fitToContainer
} = usePanzoom(chassisRef, viewportRef, {
  minScale: 0.35,
  maxScale: 2.5,
  step: 0.08,
  requireCtrlForWheel: true,
  enablePan: true,
  doubleClickReset: true,
  autoFitOnResize: true,
  autoFitOnInit: true
})

// --- 状态定义 ---
const siteValue = ref(0)
const isMaster = ref(true)
const copySuccess = ref(false)

// 顶部单行卡片
const selectedPin = ref('vcc')
const viMode = ref<'High Impedance' | 'Voltage' | 'Current'>('High Impedance')
const bandwidthSetting = ref('1')

// 限流配置
const sourceFoldLimit = ref('83.430')
const sourceRange = ref('81')
const sinkFoldLimit = ref('6.92')

// 中央驱动源配置 (Source Voltage Hub)
const sourceMainVoltage = ref('0.000')
const sourceAltVoltage = ref('0.000')
const sourceOutput = ref<'Main' | 'Alt' | 'Off'>('Main')
const isGateActive = ref(false)

// 滤波器配置
const filterFreq = ref('2539')
const filterBypass = ref(false)

// 采样与回读配置
const sampleSize = ref(1)
const isNoStrobe = ref(false)
const isLooping = ref(false)
const isBusy = ref(false)
let loopTimer: ReturnType<typeof setInterval> | null = null

const meterMode = ref<'Current' | 'Voltage'>('Current')
const meterRange = ref('101.25')
const meterReading = ref('0.0000')

// --- 计算属性 ---
const meterUnit = computed(() => (meterMode.value === 'Current' ? 'A' : 'V'))

const statusMessage = computed(() => {
  if (isGateActive.value) {
    const v = sourceOutput.value === 'Main' ? sourceMainVoltage.value : sourceAltVoltage.value
    return `Output Active: Driving ${v} V on Pin ${selectedPin.value} (Mode: ${viMode.value})`
  }
  return 'Instrument Ready. Gate is OFF (High-Z state).'
})

const ledClass = computed(() => {
  if (isLooping.value) return 'led-pulse-green'
  if (isBusy.value) return 'led-busy'
  return 'led-ready'
})

const ledTextClass = computed(() => {
  if (isLooping.value) return 'text-looping'
  if (isBusy.value) return 'text-busy'
  return 'text-ready'
})

const ledStatusText = computed(() => {
  if (isLooping.value) return 'LOOPING'
  if (isBusy.value) return 'BUSY'
  return 'READY'
})

// --- 测量逻辑模拟 ---
const executeMeasurement = () => {
  isBusy.value = true

  const vSet = parseFloat(sourceOutput.value === 'Main' ? sourceMainVoltage.value : sourceAltVoltage.value) || 0
  const isCurrent = meterMode.value === 'Current'

  setTimeout(() => {
    let val = 0
    if (isGateActive.value && sourceOutput.value !== 'Off') {
      if (isCurrent) {
        // 模拟欧姆定律负载采样 (假设负载 ~2.4 欧姆) 叠加微小热噪声
        val = vSet / 2.4 + (Math.random() * 0.02 - 0.01)
      } else {
        val = vSet + (Math.random() * 0.004 - 0.002)
      }
    } else {
      // High-Z 状态下仅有微量本底漏电流
      val = Math.random() * 0.0006 - 0.0003
    }

    meterReading.value = Math.abs(val) < 0.0001 ? '0.0000' : val.toFixed(4)
    isBusy.value = false
  }, 90)
}

const triggerRead = () => {
  executeMeasurement()
}

const toggleLoop = () => {
  isLooping.value = !isLooping.value
  if (isLooping.value) {
    ElMessage.success('已启动连续环路仪表采样 (Loop Meter)')
    executeMeasurement()
    loopTimer = setInterval(executeMeasurement, 350)
  } else {
    if (loopTimer) clearInterval(loopTimer)
    loopTimer = null
    ElMessage.info('已停止循环采样')
  }
}

const onMeterModeChange = () => {
  executeMeasurement()
}

// 监听电压或开关变动自动响应
watch([isGateActive, sourceOutput, sourceMainVoltage, sourceAltVoltage], () => {
  if (!isLooping.value) {
    executeMeasurement()
  }
})

// --- 工具栏操作 ---
const handleDuplicate = () => {
  ElMessage.info(`已复制 Pin [${selectedPin.value}] 配置为快速预设`)
}

const handleMatrixView = () => {
  ElMessage.info('多通道矩阵引脚映射视图已就绪 (19.x200 ~ 19.x215)')
}

const handleResetConfig = () => {
  sourceMainVoltage.value = '0.000'
  sourceAltVoltage.value = '0.000'
  sourceOutput.value = 'Main'
  isGateActive.value = false
  viMode.value = 'High Impedance'
  bandwidthSetting.value = '1'
  sourceFoldLimit.value = '83.430'
  sinkFoldLimit.value = '6.92'
  if (isLooping.value) {
    toggleLoop()
  }
  executeMeasurement()
  ElMessage.success('机台参数已重置为安全初始状态')
}

// 复制 ATE 驱动脚本
const copyAteCode = async () => {
  const v = sourceOutput.value === 'Main' ? sourceMainVoltage.value : sourceAltVoltage.value
  const code = `// ===============================================
// Teradyne / ATE DC-VI Instrument Automation API
// ===============================================
vi.set_site(${siteValue.value});
vi.set_pin("${selectedPin.value}");
vi.set_mode("${selectedPin.value}", VI_MODE_${viMode.value.toUpperCase().replace(/\s+/g, '_')});
vi.set_bandwidth("${selectedPin.value}", ${bandwidthSetting.value});
vi.set_voltage("${selectedPin.value}", ${v});
vi.set_source_limit("${selectedPin.value}", ${sourceFoldLimit.value}, ${sourceRange.value});
vi.set_sink_limit("${selectedPin.value}", ${sinkFoldLimit.value});
vi.set_filter("${selectedPin.value}", ${filterFreq.value}, ${filterBypass.value});
vi.gate("${selectedPin.value}", ${isGateActive.value ? 'ENABLE' : 'DISABLE'});

// Trigger Measurement
double val = vi.meter_read("${selectedPin.value}", VI_METER_${meterMode.value.toUpperCase()}, /*samples=*/${sampleSize.value});`

  try {
    await navigator.clipboard.writeText(code)
    copySuccess.value = true
    ElMessage.success('Teradyne ATE 测试控制代码已复制到剪贴板')
    setTimeout(() => {
      copySuccess.value = false
    }, 1800)
  } catch (err) {
    ElMessage.info('代码生成成功，请在控制台或弹窗中查阅')
  }
}

onUnmounted(() => {
  if (loopTimer) {
    clearInterval(loopTimer)
  }
})
</script>

<style scoped>
/* 容器居中与自适应外框 */
/* 容器居中与自适应外框：带有细微工业点阵网格与视口防溢出 */
.dc-vi-container {
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: calc(100vh - 120px);
  padding: 16px 20px 48px;
  user-select: none;
  background-color: #f8fafc;
  background-image: 
    radial-gradient(#cbd5e1 1.2px, transparent 1.2px),
    radial-gradient(#cbd5e1 1.2px, #f8fafc 1.2px);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
}

/* ================= 悬浮缩放与平移控制 HUD (Floating Zoom HUD) ================= */
.zoom-hud-panel {
  position: sticky;
  top: 10px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid #cbd5e1;
  border-radius: 24px;
  box-shadow: 0 4px 14px -2px rgba(15, 23, 42, 0.1), 0 2px 6px -1px rgba(15, 23, 42, 0.06);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.zoom-hud-panel:hover {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8px 20px -3px rgba(15, 23, 42, 0.15);
  border-color: #94a3b8;
}

.zoom-hud-panel.ctrl-active {
  border-color: #10b981;
  background: rgba(240, 253, 244, 0.95);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25), 0 8px 20px -3px rgba(5, 150, 105, 0.2);
}

.zoom-hud-panel.space-active {
  border-color: #3b82f6;
  background: rgba(239, 246, 255, 0.95);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
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
  border: 1px solid transparent;
  background: #f1f5f9;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hud-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
  border-color: #cbd5e1;
}

.hud-scale-btn {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 3px 10px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  min-width: 52px;
  text-align: center;
  transition: all 0.15s ease;
}

.hud-scale-btn:hover {
  background: #f8fafc;
  border-color: #3b82f6;
  color: #2563eb;
}

.hud-divider {
  width: 1px;
  height: 18px;
  background-color: #cbd5e1;
  margin: 0 2px;
}

.hud-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
}

.hud-key-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  transition: all 0.15s ease;
}

.hud-key-tag.tag-active {
  background: #10b981;
  border-color: #059669;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.hud-tip-text {
  font-weight: 500;
}

.hud-dot {
  color: #94a3b8;
  font-weight: bold;
}

.hud-mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hud-mode-pill:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.hud-mode-pill.mode-autofit {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.mode-led {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
  transition: all 0.15s ease;
}

.hud-mode-pill.mode-autofit .mode-led {
  background: #2563eb;
  box-shadow: 0 0 6px rgba(37, 99, 235, 0.6);
}

/* 工具栏缩放 Badge */
.zoom-badge-pill {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #94a3b8;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  min-width: 44px;
  text-align: center;
  transition: all 0.15s ease;
}

.zoom-badge-pill:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.toolbar-divider.mini {
  height: 14px;
  margin: 0 2px;
}

/* 机台机箱底盘：支持平滑缩放与变换原点 */
.ate-instrument-chassis {
  width: 100%;
  max-width: 1100px;
  background-color: #cbd5e1;
  border: 2px solid #64748b;
  border-radius: 6px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  color: #0f172a;
  transform-origin: 50% 50%;
  cursor: default;
}

.ate-instrument-chassis.cursor-grab {
  cursor: grab !important;
}

.ate-instrument-chassis.cursor-grabbing {
  cursor: grabbing !important;
}

/* 顶部工具栏 */
.ate-toolbar {
  background: linear-gradient(to right, #e2e8f0, #f1f5f9, #e2e8f0);
  border-bottom: 1px solid #94a3b8;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.site-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #94a3b8;
  padding: 2px 8px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.site-box .label {
  color: #334155;
  font-weight: 700;
}

.site-select {
  width: 65px;
}

.master-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #1e293b;
  font-weight: 700;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: #cbd5e1;
}

.tool-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-icon-btn:hover {
  background: #cbd5e1;
  color: #0f172a;
  border-color: #94a3b8;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 4px;
  background-color: #cbd5e1;
  color: #334155;
  font-weight: 600;
  font-size: 11px;
}

.online-led {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.hardware-id {
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
}

/* ================= 工作画布 ================= */
.unified-canvas {
  position: relative;
  background-color: #e2e8f0;
  min-height: 665px;
  width: 100%;
  overflow: hidden;
}

/* 拓扑 SVG */
.main-topology-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 电流流动动画效果 */
@keyframes wireFlow {
  from {
    stroke-dashoffset: 20;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.wire-active-flow {
  stroke: #059669 !important;
  stroke-width: 2.8 !important;
  stroke-dasharray: 6 3;
  animation: wireFlow 0.8s linear infinite;
}

/* 拟物风格卡片通用样式 */
.card-box {
  position: absolute;
  background: #f1f5f9;
  border-radius: 4px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-title {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.02em;
}

.tag-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.tag-blue {
  background: #dbeafe;
  color: #1e40af;
}

.tag-indigo {
  background: #e0e7ff;
  color: #3730a3;
}

/* 纯净参数容器：简洁纯粹 */
.card-body {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 10px 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.param-divider {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.param-label {
  font-weight: 700;
  color: #334155;
}

.param-value-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sub-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.unit {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

/* 1. Source Current Limit 卡片 */
.source-limit-card {
  left: 24px;
  top: 24px;
  width: 340px;
  border: 2px solid #2563eb;
}

/* 2. Sink Current Limit 卡片 */
.sink-limit-card {
  left: 24px;
  top: 180px;
  width: 340px;
  border: 2px solid #1d4ed8;
}

/* 3. Meter Reading 回读框行 */
.meter-reading-box {
  position: absolute;
  left: 24px;
  top: 405px;
  width: 245px;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.reading-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reading-label {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.reading-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reading-display {
  width: 96px;
  height: 28px;
  font-size: 14px;
  font-weight: 700;
  background: #dbe2ea !important;
  color: #0f172a;
  border: 1px solid #475569;
  box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.2);
  text-align: right;
  padding: 0 6px;
}

.reading-unit {
  font-size: 12px;
  font-weight: 700;
  font-style: italic;
  color: #1e293b;
}

/* 4. 采样控制面板 */
.sample-ctrl-card {
  left: 24px;
  top: 475px;
  width: 220px;
  border: 2px solid #2563eb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.led-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.led-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  transition: all 0.2s ease;
}

.led-ready {
  background-color: #94a3b8;
}

.led-busy {
  background-color: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

.led-pulse-green {
  background-color: #10b981;
  animation: pulseLed 0.8s infinite;
}

@keyframes pulseLed {
  0%, 100% {
    opacity: 1;
    filter: drop-shadow(0 0 4px #10b981);
  }
  50% {
    opacity: 0.3;
  }
}

.led-text {
  font-weight: 700;
}

.text-ready {
  color: #64748b;
}

.text-busy {
  color: #b45309;
}

.text-looping {
  color: #047857;
}

.btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid #cbd5e1;
  margin-top: 4px;
}

/* 5. Filter 设定控件组 */
.filter-ctrl-group {
  position: absolute;
  left: 400px;
  top: 350px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.sub-checkbox {
  margin-left: 16px;
  font-size: 11px;
}

/* 6. Mode & Range 控制组 */
.meter-config-group {
  position: absolute;
  left: 565px;
  top: 475px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
  font-size: 12px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-bold {
  font-weight: 700;
  color: #334155;
}

/* 7. 通道配置与运行模式联合主控区 (Pin, Mode, Bandwidth Setting, DIB Channel) */
.channel-master-bar {
  position: absolute;
  left: 390px;
  top: 20px;
  right: 24px;
  background: rgba(248, 250, 252, 0.95);
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-label {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.pin-select {
  width: 110px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #1e3a8a;
  font-weight: 700;
}

.mode-select {
  min-width: 135px;
  font-weight: 700;
}

.bw-select {
  width: 60px;
  font-weight: 700;
}

.bar-divider {
  width: 1px;
  height: 18px;
  background-color: #cbd5e1;
}

.dib-label {
  font-size: 11px;
  color: #475569;
  font-weight: 700;
  white-space: nowrap;
}

.dib-badge {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  color: #1e3a8a;
  background: #ffffff;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 8. 中央紫色控制圆 (Source Voltage Hub) */
.purple-circle-hub {
  position: absolute;
  left: 430px;
  top: 120px;
  width: 176px;
  height: 176px;
  border-radius: 50%;
  background-color: rgba(216, 180, 254, 0.88);
  border: 2px solid #9333ea;
  box-shadow: 0 4px 14px rgba(147, 51, 234, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: #0f172a;
  z-index: 10;
}

.hub-title {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.02em;
  margin-bottom: 6px;
  color: #3b0764;
}

.hub-body {
  width: 100%;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.hub-label {
  font-weight: 700;
  color: #3b0764;
}

.hub-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.gate-toggle-box {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 700;
  color: #3b0764;
  background: rgba(243, 232, 255, 0.95);
  padding: 2px 10px;
  border-radius: 3px;
  border: 1px solid #c084fc;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease;
}

.gate-toggle-box:hover {
  background: #f3e8ff;
}

/* ================= 通用控件样式 ================= */
.ate-input {
  background: #ffffff;
  border: 1px solid #475569;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.15);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  text-align: right;
  padding: 2px 6px;
  font-size: 12px;
  border-radius: 2px;
  outline: none;
  width: 80px;
}

.ate-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px #2563eb, inset 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.ate-select {
  background: #ffffff;
  border: 1px solid #475569;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.text-emerald {
  color: #065f46;
}

.text-blue {
  color: #1e3a8a;
}

.w-14 {
  width: 56px;
}

.w-16 {
  width: 64px;
}

/* 拟物风格按键 */
.ate-btn {
  background: linear-gradient(to bottom, #ffffff, #cbd5e1);
  border: 1px solid #475569;
  box-shadow: 1px 1px 0px #ffffff inset, -1px -1px 0px #94a3b8 inset, 1px 2px 2px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 3px;
  cursor: pointer;
  color: #0f172a;
  transition: all 0.08s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.ate-btn:hover {
  background: linear-gradient(to bottom, #ffffff, #e2e8f0);
}

.ate-btn:active {
  background: #94a3b8;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.3);
  transform: translateY(1px);
}

.copy-btn {
  color: #1e3a8a;
  padding: 4px 12px;
}

.read-btn {
  color: #1d4ed8;
}

.active-loop {
  background: #16a34a !important;
  color: #ffffff !important;
  border-color: #15803d !important;
  box-shadow: 0 0 8px rgba(22, 163, 74, 0.6) !important;
}

.mb-2 {
  margin-bottom: 8px;
}

/* ================= 底部状态栏 ================= */
.ate-footer {
  background-color: #cbd5e1;
  border-top: 1px solid #94a3b8;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #334155;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-title {
  font-weight: 700;
  color: #1e293b;
}

.status-msg {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #1e3a8a;
  font-weight: 600;
}

.footer-right {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}
</style>
