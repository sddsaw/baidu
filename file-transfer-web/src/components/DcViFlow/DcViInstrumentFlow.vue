<template>
  <div class="dc-vi-flow-wrapper" ref="wrapperRef">
    <!-- 顶部操作工具栏 (Header Toolbar) -->
    <div class="flow-ate-toolbar">
      <div class="toolbar-left">
        <!-- Site 选择 -->
        <div class="site-box">
          <span class="label">Site:</span>
          <el-select v-model="siteValue" size="small" class="flow-select-mini">
            <el-option :value="0" label="0" />
            <el-option :value="1" label="1" />
            <el-option :value="2" label="2" />
            <el-option :value="3" label="3" />
          </el-select>
        </div>

        <label class="master-checkbox">
          <input type="checkbox" v-model="isMaster" />
          <span>Master</span>
        </label>

        <div class="toolbar-divider"></div>

        <!-- 快捷操作按钮 -->
        <el-tooltip content="重置机台初始设定" placement="top">
          <button class="tool-btn" @click="handleResetConfig">
            <el-icon><RefreshRight /></el-icon>
            <span>重置</span>
          </button>
        </el-tooltip>

        <el-tooltip content="一键适应画布与居中" placement="top">
          <button class="tool-btn" @click="fitView({ padding: 0.2 })">
            <el-icon><FullScreen /></el-icon>
            <span>居中适配</span>
          </button>
        </el-tooltip>

        <el-tooltip content="复位 1:1 比例" placement="top">
          <button class="tool-btn" @click="zoomTo(1)">
            <el-icon><Aim /></el-icon>
            <span>100%</span>
          </button>
        </el-tooltip>

        <div class="toolbar-divider"></div>

        <!-- 网格吸附/自由微调切换 -->
        <el-tooltip :content="isSnapEnabled ? '当前开启 10px 网格吸附，点击可切换为 1px 自由像素微调' : '当前处于 1px 自由微调模式，点击开启 10px 磁吸对齐'" placement="top">
          <button class="tool-btn" :class="{ 'snap-active-btn': isSnapEnabled }" @click="isSnapEnabled = !isSnapEnabled">
            <span>{{ isSnapEnabled ? '🧲 磁吸(10px)' : '🖐 微调(1px)' }}</span>
          </button>
        </el-tooltip>

        <!-- 布局排版与复制工具 -->
        <el-tooltip content="复制当前鼠标拖拽后的最新节点坐标，方便直接保存到代码" placement="top">
          <button class="tool-btn copy-layout-btn" @click="copyLayoutJson">
            <el-icon><CopyDocument /></el-icon>
            <span class="text-amber-btn">📋 复制布局坐标</span>
          </button>
        </el-tooltip>

        <el-tooltip content="恢复初始默认布局位置" placement="top">
          <button class="tool-btn" @click="resetDefaultLayout">
            <el-icon><RefreshRight /></el-icon>
            <span>重置布局</span>
          </button>
        </el-tooltip>

        <!-- 复制 ATE 代码 -->
        <button class="copy-code-btn" @click="copyAteCode">
          <el-icon><DocumentCopy /></el-icon>
          <span>{{ copySuccess ? 'COPIED!' : 'COPY CODE' }}</span>
        </button>
      </div>

      <div class="toolbar-right">
        <div class="tech-tag">
          <span class="led-green"></span>
          <span>Vue Flow 可视化拖拽引擎</span>
        </div>
        <span class="hardware-id">Slot 19 (19.x202)</span>
      </div>
    </div>

    <!-- 主体 Vue Flow 画布舞台 (所有节点直接内联，开启智能吸附对齐) -->
    <div class="flow-canvas-container">
      <!-- 智能磁吸辅助对齐线 (Smart Magnetic Alignment Guides) -->
      <div
        v-if="screenSnapY !== null"
        class="snap-guide-line-h"
        :style="{ top: `${screenSnapY}px` }"
      >
        <span class="guide-tag">水平对齐 (Y: {{ snapGuideY }}px)</span>
      </div>

      <div
        v-if="screenSnapX !== null"
        class="snap-guide-line-v"
        :style="{ left: `${screenSnapX}px` }"
      >
        <span class="guide-tag">垂直对齐 (X: {{ snapGuideX }}px)</span>
      </div>

      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ zoom: 1, x: 0, y: 0 }"
        :min-zoom="0.2"
        :max-zoom="2.5"
        :snap-to-grid="isSnapEnabled"
        :snap-grid="[10, 10]"
        :fit-view-on-init="true"
        @node-drag="onNodeDrag"
        @node-drag-stop="onNodeDragStop"
        class="ate-dark-flow"
      >
        <!-- 1. 顶部通道主控节点 (Channel Master) -->
        <template #node-channelMaster>
          <div class="channel-master-node custom-flow-node">
            <div class="bar-item">
              <span class="bar-label">Pin:</span>
              <el-select v-model="selectedPin" size="small" class="pin-select" :teleported="false" popper-class="ate-dark-popper">
                <el-option value="vcc" label="vcc" />
                <el-option value="vdd" label="vdd" />
                <el-option value="vio" label="vio" />
                <el-option value="vcore" label="vcore" />
                <el-option value="vref" label="vref" />
              </el-select>
            </div>
            <div class="bar-divider"></div>
            <div class="bar-item">
              <span class="bar-label">Mode:</span>
              <el-select v-model="viMode" size="small" class="mode-select" :teleported="false" popper-class="ate-dark-popper">
                <el-option value="High Impedance" label="High Impedance" />
                <el-option value="Voltage" label="Voltage" />
                <el-option value="Current" label="Current" />
              </el-select>
            </div>
            <div class="bar-divider"></div>
            <div class="bar-item">
              <span class="bar-label">Bandwidth:</span>
              <el-select v-model="bandwidthSetting" size="small" class="bw-select" :teleported="false" popper-class="ate-dark-popper">
                <el-option value="1" label="1" />
                <el-option value="2" label="2" />
                <el-option value="3" label="3" />
                <el-option value="4" label="4" />
              </el-select>
            </div>
            <div class="bar-divider"></div>
            <div class="bar-item">
              <span class="dib-label">DIB Channel:</span>
              <span class="dib-badge">19.x202</span>
            </div>
            <Handle type="source" :position="Position.Bottom" id="bottom-out" class="flow-handle cyan-handle" />
          </div>
        </template>

        <!-- 2. 限流保护模块 (Limit Node) -->
        <template #node-limit>
          <div class="limit-node custom-flow-node">
            <div class="sub-card">
              <div class="card-header">
                <span class="card-title">Source Current Limit</span>
                <span class="tag-badge tag-blue">I-Source</span>
              </div>
              <div class="card-body">
                <div class="param-row">
                  <span class="param-label">Fold Limit:</span>
                  <div class="param-wrap">
                    <input type="text" v-model="sourceFoldLimit" class="flow-input text-emerald" />
                    <span class="unit">A</span>
                  </div>
                </div>
                <div class="param-row">
                  <span class="param-label">Range:</span>
                  <div class="param-wrap">
                    <el-select v-model="sourceRange" size="small" class="flow-select-mini" :teleported="false" popper-class="ate-dark-popper">
                      <el-option value="81" label="81 A" />
                      <el-option value="50" label="50 A" />
                      <el-option value="20" label="20 A" />
                    </el-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="sub-card mt-2">
              <div class="card-header">
                <span class="card-title">Sink Current Limit</span>
                <span class="tag-badge tag-indigo">I-Sink</span>
              </div>
              <div class="card-body">
                <div class="param-row">
                  <span class="param-label">Fold Limit:</span>
                  <div class="param-wrap">
                    <input type="text" v-model="sinkFoldLimit" class="flow-input text-blue" />
                    <span class="unit">A</span>
                  </div>
                </div>
              </div>
            </div>
            <Handle type="source" :position="Position.Right" id="limit-out" class="flow-handle blue-handle" />
          </div>
        </template>

        <!-- 3. 中央电压源与驱动放大器 (Source Hub Node) -->
        <template #node-sourceHub>
          <div class="source-hub-node custom-flow-node">
            <Handle type="target" :position="Position.Left" id="limit-in" class="flow-handle blue-handle" />
            <Handle type="target" :position="Position.Top" id="control-in" class="flow-handle cyan-handle" />

            <div class="hub-container">
              <div class="purple-circle-hub">
                <h4 class="hub-title">Source Voltage</h4>
                <div class="hub-body">
                  <div class="hub-row">
                    <span class="hub-label">Main</span>
                    <div class="hub-input-wrap">
                      <input type="text" v-model="sourceMainVoltage" class="hub-input" />
                      <span class="unit">V</span>
                    </div>
                  </div>
                  <div class="hub-row">
                    <span class="hub-label">Alt</span>
                    <div class="hub-input-wrap">
                      <input type="text" v-model="sourceAltVoltage" class="hub-input" />
                      <span class="unit">V</span>
                    </div>
                  </div>
                  <div class="hub-row">
                    <span class="hub-label">Output:</span>
                    <el-select v-model="sourceOutput" size="small" class="hub-select" :teleported="false" popper-class="ate-dark-popper">
                      <el-option value="Main" label="Main" />
                      <el-option value="Alt" label="Alt" />
                      <el-option value="Off" label="Off" />
                    </el-select>
                  </div>
                </div>
                <label class="gate-toggle-box">
                  <input type="checkbox" v-model="isGateActive" />
                  <span :class="{ 'text-emerald-glow': isGateActive }">Gate Active</span>
                </label>
              </div>

              <div class="amps-column">
                <div class="amp-box drive-amp" :class="{ 'is-active': isGateActive }">
                  <svg viewBox="0 0 40 32" class="amp-svg">
                    <polygon points="4,2 36,16 4,30" class="amp-triangle" />
                  </svg>
                  <span class="amp-text">Drive</span>
                </div>
                <div class="amp-box comp-amp">
                  <svg viewBox="0 0 40 32" class="amp-svg">
                    <polygon points="36,2 4,16 36,30" class="amp-triangle" />
                  </svg>
                  <span class="amp-text">Comp</span>
                </div>
              </div>
            </div>

            <Handle type="source" :position="Position.Right" id="drive-out" class="flow-handle emerald-handle" />
            <Handle type="target" :position="Position.Bottom" id="sense-in" class="flow-handle purple-handle" />
          </div>
        </template>

        <!-- 4. 压摆整形与采样电阻 (Resistor Node) -->
        <template #node-resistor>
          <div class="resistor-node custom-flow-node">
            <Handle type="target" :position="Position.Left" id="resistor-in" class="flow-handle emerald-handle" />
            <div class="components-wrap">
              <div class="slew-box" title="压摆整形 (Slew Rate Conditioning)">
                <span class="box-tag">Slew</span>
                <svg viewBox="0 0 38 20" class="symbol-svg">
                  <path d="M 4 16 L 14 16 L 24 4 L 34 4" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" />
                </svg>
              </div>
              <div class="wire-connector"></div>
              <div class="resistor-box" title="精密电流采样电阻 (Precision Shunt)">
                <span class="box-tag">Rsense</span>
                <svg viewBox="0 0 54 20" class="symbol-svg resistor-svg">
                  <path d="M 2 10 L 8 10 L 13 3 L 19 17 L 25 3 L 31 17 L 37 3 L 43 17 L 48 10 L 54 10" fill="none" stroke="#f8fafc" stroke-width="2.2" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
            <Handle type="source" :position="Position.Right" id="resistor-out" class="flow-handle emerald-handle" />
            <Handle type="source" :position="Position.Bottom" id="tap-out" class="flow-handle amber-handle" />
          </div>
        </template>

        <!-- 5. 芯片引脚终端 (Chip Pin Node) -->
        <template #node-chipPin>
          <div class="chip-pin-node custom-flow-node">
            <Handle type="target" :position="Position.Left" id="pin-force-in" class="flow-handle emerald-handle" />
            <div class="pin-terminal">
              <div class="pin-icon-wrap">
                <svg viewBox="0 0 32 32" class="chip-icon">
                  <rect x="6" y="6" width="20" height="20" rx="3" fill="#78350f" stroke="#eab308" stroke-width="2" />
                  <line x1="0" y1="16" x2="6" y2="16" stroke="#ffffff" stroke-width="2" />
                  <line x1="26" y1="16" x2="32" y2="16" stroke="#ffffff" stroke-width="2" />
                </svg>
              </div>
              <div class="pin-info">
                <div class="pin-title">DUT Pin Terminal</div>
                <div class="pin-name">Pin: <span class="text-amber">{{ selectedPin }}</span></div>
                <div class="pin-channel">Ch: 19.x202</div>
              </div>
            </div>
            <Handle type="source" :position="Position.Bottom" id="sense-out" class="flow-handle purple-handle" />
          </div>
        </template>

        <!-- 6. 滤波器与测量仪表核心 (Meter Node) -->
        <template #node-meter>
          <div class="meter-node custom-flow-node">
            <Handle type="target" :position="Position.Top" id="meter-tap-in" class="flow-handle amber-handle" />
            <div class="meter-content-grid">
              <!-- 滤波器行 -->
              <div class="filter-strip">
                <div class="filter-box-icon" title="低通滤波器 (Filter)">
                  <svg viewBox="0 0 36 20" class="filter-svg">
                    <rect x="2" y="2" width="32" height="16" rx="2" fill="#24272c" stroke="#475569" stroke-width="1.5" />
                    <path d="M 6 8 L 14 8 L 22 14 L 30 14" fill="none" stroke="#38bdf8" stroke-width="2" />
                  </svg>
                </div>
                <div class="filter-controls">
                  <span class="label">Filter:</span>
                  <el-select v-model="filterFreq" size="small" class="flow-select-mini" :teleported="false" popper-class="ate-dark-popper">
                    <el-option value="2539" label="2539 Hz" />
                    <el-option value="1000" label="1000 Hz" />
                    <el-option value="5000" label="5000 Hz" />
                  </el-select>
                  <label class="bypass-label">
                    <input type="checkbox" v-model="filterBypass" />
                    <span>Bypass</span>
                  </label>
                </div>
              </div>

              <!-- 梯形 Meter 核心 -->
              <div class="meter-trapezoid-row">
                <div class="trapezoid-shape">
                  <svg viewBox="0 0 90 40" class="trapezoid-svg">
                    <polygon points="10,20 85,4 85,36" fill="#d97706" stroke="#f59e0b" stroke-width="2" />
                    <text x="55" y="24" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">Meter</text>
                  </svg>
                </div>
                <div class="meter-configs">
                  <div class="cfg-row">
                    <span class="cfg-label">Mode:</span>
                    <el-select v-model="meterMode" size="small" class="flow-select-mini" :teleported="false" popper-class="ate-dark-popper">
                      <el-option value="Current" label="Current" />
                      <el-option value="Voltage" label="Voltage" />
                    </el-select>
                  </div>
                  <div class="cfg-row">
                    <span class="cfg-label">Range:</span>
                    <el-select v-model="meterRange" size="small" class="flow-select-mini" :teleported="false" popper-class="ate-dark-popper">
                      <el-option value="101.25" label="101.25" />
                      <el-option value="50.00" label="50.00" />
                      <el-option value="10.00" label="10.00" />
                    </el-select>
                    <span class="unit">{{ meterUnit }}</span>
                  </div>
                </div>
              </div>

              <!-- 采样触发与控制 -->
              <div class="sampling-controls">
                <div class="sample-param-row">
                  <div class="param-item">
                    <span class="label">Sample:</span>
                    <input type="number" v-model.number="sampleSize" min="1" max="1000" class="flow-input-num" />
                  </div>
                  <div class="status-indicator">
                    <span class="led-dot" :class="ledClass"></span>
                    <span class="led-text">{{ ledStatusText }}</span>
                  </div>
                </div>
                <div class="btn-group">
                  <button class="flow-btn loop-btn" :class="{ 'active-loop': isLooping }" @click="toggleLoop">
                    {{ isLooping ? 'Stop Loop' : 'Loop Meter' }}
                  </button>
                  <button class="flow-btn read-btn" @click="triggerRead">
                    Read Meter
                  </button>
                </div>
              </div>
            </div>
            <Handle type="source" :position="Position.Right" id="meter-reading-out" class="flow-handle orange-handle" />
          </div>
        </template>

        <!-- 7. 数字仪表读数面板 (Meter Reading Node) -->
        <template #node-meterReading>
          <div class="meter-reading-node custom-flow-node">
            <div class="reading-header">
              <span class="reading-title">Meter Reading</span>
              <span class="reading-tag font-mono">DMM</span>
            </div>
            <div class="reading-display-wrap">
              <div class="reading-value font-mono" :class="{ 'is-busy': isBusy }">
                {{ meterReading }}
              </div>
              <div class="reading-unit">{{ meterUnit }}</div>
            </div>
            <Handle type="target" :position="Position.Left" id="reading-in" class="flow-handle orange-handle" />
          </div>
        </template>
      </VueFlow>
    </div>

    <!-- 底部状态栏 (Footer) -->
    <div class="flow-ate-footer">
      <div class="footer-left">
        <span class="status-title">Status:</span>
        <span class="status-msg">{{ statusMessage }}</span>
      </div>
      <div class="footer-right">
        ⚡ 纯单文件内聚 Vue Flow 节点，无任何碎片化 Hook 与额外文件
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { VueFlow, useVueFlow, Handle, Position } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { RefreshRight, FullScreen, Aim, DocumentCopy, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// --- 所有状态直接定义在单文件内，零额外抽象，直接 v-model ---
const isSnapEnabled = ref(false) // 默认为 1px 精准微调模式，可一键切换为 10px 网格对齐
const siteValue = ref(0)
const isMaster = ref(true)
const selectedPin = ref('vcc')
const viMode = ref<'High Impedance' | 'Voltage' | 'Current'>('High Impedance')
const bandwidthSetting = ref('1')

// 限流配置
const sourceFoldLimit = ref('83.430')
const sourceRange = ref('81')
const sinkFoldLimit = ref('6.92')

// 中央驱动电压源
const sourceMainVoltage = ref('0.000')
const sourceAltVoltage = ref('0.000')
const sourceOutput = ref<'Main' | 'Alt' | 'Off'>('Main')
const isGateActive = ref(false)

// 滤波器配置
const filterFreq = ref('2539')
const filterBypass = ref(false)

// 采样与仪表读数
const sampleSize = ref(1)
const isLooping = ref(false)
const isBusy = ref(false)
let loopTimer: ReturnType<typeof setInterval> | null = null

const meterMode = ref<'Current' | 'Voltage'>('Current')
const meterRange = ref('101.25')
const meterReading = ref('0.0000')
const copySuccess = ref(false)

// 计算属性
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

const ledStatusText = computed(() => {
  if (isLooping.value) return 'LOOPING'
  if (isBusy.value) return 'BUSY'
  return 'READY'
})

// 测量与采样模拟逻辑
const executeMeasurement = () => {
  isBusy.value = true
  const vSet = parseFloat(sourceOutput.value === 'Main' ? sourceMainVoltage.value : sourceAltVoltage.value) || 0
  const isCurrent = meterMode.value === 'Current'

  setTimeout(() => {
    let val = 0
    if (isGateActive.value && sourceOutput.value !== 'Off') {
      if (isCurrent) {
        val = vSet / 2.4 + (Math.random() * 0.02 - 0.01)
      } else {
        val = vSet + (Math.random() * 0.004 - 0.002)
      }
    } else {
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
  } catch {
    ElMessage.info('代码生成成功')
  }
}

onUnmounted(() => {
  if (loopTimer) {
    clearInterval(loopTimer)
  }
})

// --- Vue Flow 画布控制 ---
const wrapperRef = ref<HTMLElement | null>(null)
const { fitView, zoomTo, getViewport } = useVueFlow()

const scalePercent = computed(() => {
  const vp = getViewport()
  return `${Math.round((vp?.zoom || 1) * 100)}%`
})

const fitToContainer = () => {
  fitView({ padding: 0.15 })
}

const resetZoom = () => {
  zoomTo(1)
  fitView({ padding: 0.15 })
}

defineExpose({
  scalePercent,
  fitToContainer,
  resetZoom
})

// 默认标准节点布局 (已固化用户拖拽微调后的最新精准坐标，锁定电阻与引脚 y: 148 消除 1px 差)
const DEFAULT_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'node-master': { x: 120, y: -6 },
  'node-limit': { x: -42, y: 85 },
  'node-hub': { x: 307, y: 89 },
  'node-resistor': { x: 635, y: 148 },
  'node-chip': { x: 953, y: 148 },
  'node-meter': { x: 574, y: 326 },
  'node-reading': { x: 917, y: 387 }
}

// 从本地缓存加载上一次拖拽后的位置
const getInitialPositions = () => {
  try {
    const raw = localStorage.getItem('dc-vi-custom-layout')
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, { x: number; y: number }>
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_NODE_POSITIONS, ...parsed }
      }
    }
  } catch {}
  return DEFAULT_NODE_POSITIONS
}

const initialPos = getInitialPositions()

// 节点数据 (初始位置优先采用本地拖拽记忆)
const nodes = ref([
  { id: 'node-master', type: 'channelMaster', position: initialPos['node-master'] || { x: 300, y: 15 }, draggable: true },
  { id: 'node-limit', type: 'limit', position: initialPos['node-limit'] || { x: 30, y: 105 }, draggable: true },
  { id: 'node-hub', type: 'sourceHub', position: initialPos['node-hub'] || { x: 340, y: 100 }, draggable: true },
  { id: 'node-resistor', type: 'resistor', position: initialPos['node-resistor'] || { x: 670, y: 135 }, draggable: true },
  { id: 'node-chip', type: 'chipPin', position: initialPos['node-chip'] || { x: 910, y: 120 }, draggable: true },
  { id: 'node-meter', type: 'meter', position: initialPos['node-meter'] || { x: 450, y: 295 }, draggable: true },
  { id: 'node-reading', type: 'meterReading', position: initialPos['node-reading'] || { x: 130, y: 350 }, draggable: true }
])

// 实时自动持久化用户拖拽后的位置，刷新页面不丢失
watch(
  nodes,
  (newNodes) => {
    try {
      const layoutMap: Record<string, { x: number; y: number }> = {}
      newNodes.forEach((n) => {
        layoutMap[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) }
      })
      localStorage.setItem('dc-vi-custom-layout', JSON.stringify(layoutMap))
    } catch {}
  },
  { deep: true }
)

// 一键复制当前节点坐标 JSON
const copyLayoutJson = async () => {
  const currentPositions = nodes.value.reduce<Record<string, { x: number; y: number }>>((acc, n) => {
    acc[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) }
    return acc
  }, {})

  const text = JSON.stringify(currentPositions, null, 2)
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制当前自定义布局坐标 JSON！可直接发送给助手或粘贴保存')
  } catch {
    ElMessage.info('坐标已就绪')
  }
}

// 一键重置回默认布局
const resetDefaultLayout = () => {
  localStorage.removeItem('dc-vi-custom-layout')
  nodes.value.forEach((node) => {
    if (DEFAULT_NODE_POSITIONS[node.id]) {
      node.position = { ...DEFAULT_NODE_POSITIONS[node.id] }
    }
  })
  ElMessage.success('已恢复为初始标准布局')
}

// --- 智能对齐磁吸辅助线与自动吸附对齐 (Smart Magnetic Alignment Snapping) ---
const SNAP_THRESHOLD = 8 // 当相距 <= 8px 时自动强力吸附
const snapGuideY = ref<number | null>(null)
const snapGuideX = ref<number | null>(null)

const screenSnapY = computed(() => {
  if (snapGuideY.value === null) return null
  const vp = getViewport()
  return snapGuideY.value * vp.zoom + vp.y
})

const screenSnapX = computed(() => {
  if (snapGuideX.value === null) return null
  const vp = getViewport()
  return snapGuideX.value * vp.zoom + vp.x
})

// 拖拽过程中的智能磁吸对齐计算
const onNodeDrag = (dragEvent: any) => {
  const dragged = dragEvent.node
  if (!dragged) return

  let matchedY: number | null = null
  let matchedX: number | null = null

  for (const other of nodes.value) {
    if (other.id === dragged.id) continue

    // 1. 水平 Y 轴智能对齐 (8px 范围内自动强力对齐吸附)
    if (matchedY === null && Math.abs(dragged.position.y - other.position.y) <= SNAP_THRESHOLD) {
      dragged.position.y = other.position.y
      matchedY = other.position.y
    }

    // 2. 垂直 X 轴智能对齐 (8px 范围内自动强力对齐吸附)
    if (matchedX === null && Math.abs(dragged.position.x - other.position.x) <= SNAP_THRESHOLD) {
      dragged.position.x = other.position.x
      matchedX = other.position.x
    }
  }

  snapGuideY.value = matchedY
  snapGuideX.value = matchedX
}

// 释放鼠标时隐藏参考线
const onNodeDragStop = () => {
  snapGuideY.value = null
  snapGuideX.value = null
}

// 响应式连线计算
const edges = computed(() => [
  {
    id: 'edge-control',
    source: 'node-master',
    sourceHandle: 'bottom-out',
    target: 'node-hub',
    targetHandle: 'control-in',
    type: 'smoothstep',
    style: { stroke: '#38bdf8', strokeWidth: 2 }
  },
  {
    id: 'edge-limit',
    source: 'node-limit',
    sourceHandle: 'limit-out',
    target: 'node-hub',
    targetHandle: 'limit-in',
    type: 'smoothstep',
    style: { stroke: '#3b82f6', strokeWidth: 2.2 }
  },
  {
    id: 'edge-drive',
    source: 'node-hub',
    sourceHandle: 'drive-out',
    target: 'node-resistor',
    targetHandle: 'resistor-in',
    type: 'smoothstep',
    animated: isGateActive.value,
    style: {
      stroke: isGateActive.value ? '#22c55e' : '#64748b',
      strokeWidth: 3
    }
  },
  {
    id: 'edge-pin',
    source: 'node-resistor',
    sourceHandle: 'resistor-out',
    target: 'node-chip',
    targetHandle: 'pin-force-in',
    type: 'straight',
    animated: isGateActive.value,
    style: {
      stroke: isGateActive.value ? '#22c55e' : '#64748b',
      strokeWidth: 3
    }
  },
  {
    id: 'edge-sense',
    source: 'node-chip',
    sourceHandle: 'sense-out',
    target: 'node-hub',
    targetHandle: 'sense-in',
    type: 'smoothstep',
    style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '4 4' }
  },
  {
    id: 'edge-tap',
    source: 'node-resistor',
    sourceHandle: 'tap-out',
    target: 'node-meter',
    targetHandle: 'meter-tap-in',
    type: 'smoothstep',
    animated: isLooping.value,
    style: { stroke: '#f59e0b', strokeWidth: 2.2 }
  },
  {
    id: 'edge-read',
    source: 'node-meter',
    sourceHandle: 'meter-reading-out',
    target: 'node-reading',
    targetHandle: 'reading-in',
    type: 'smoothstep',
    animated: isLooping.value,
    style: { stroke: '#d97706', strokeWidth: 2.2 }
  }
])

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  setTimeout(() => {
    fitView({ padding: 0.15 })
  }, 200)

  // 监听外层容器尺寸变化，拉伸时自动等比自适应整个机台
  if (wrapperRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      fitView({ padding: 0.15 })
    })
    resizeObserver.observe(wrapperRef.value)
  }
})

onUnmounted(() => {
  if (loopTimer) {
    clearInterval(loopTimer)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
/* 智能对齐磁吸辅助线 (Figma 风格对齐光标) */
.snap-guide-line-h {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  z-index: 10000;
  pointer-events: none;
}
.snap-guide-line-v {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  z-index: 10000;
  pointer-events: none;
}
.guide-tag {
  position: absolute;
  background: #0284c7;
  color: #ffffff;
  font-size: 10px;
  font-family: monospace;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
}
.snap-guide-line-h .guide-tag {
  left: 16px;
  top: -18px;
}
.snap-guide-line-v .guide-tag {
  top: 16px;
  left: 6px;
}

/* 当节点内有下拉选项展开时，提升层级确保下拉框浮层处于最顶层 */
:deep(.vue-flow__node:focus-within) {
  z-index: 9999 !important;
}

/* 暗黑下拉浮层风格：因为设置了 :teleported="false"，下拉浮层会留在节点内部，随画布等比放大缩小 */
:deep(.ate-dark-popper.el-popper) {
  background: #181a1d !important;
  border: 1px solid #334155 !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7) !important;
}
:deep(.ate-dark-popper .el-select-dropdown__item) {
  color: #cbd5e1 !important;
  font-size: 11px !important;
  padding: 4px 10px !important;
  height: 28px !important;
  line-height: 20px !important;
}
:deep(.ate-dark-popper .el-select-dropdown__item.is-hovering) {
  background-color: #334155 !important;
  color: #38bdf8 !important;
}
:deep(.ate-dark-popper .el-select-dropdown__item.is-selected) {
  background-color: rgba(56, 189, 248, 0.2) !important;
  color: #38bdf8 !important;
  font-weight: 700 !important;
}
:deep(.ate-dark-popper .el-popper__arrow::before) {
  background: #181a1d !important;
  border-color: #334155 !important;
}

.dc-vi-flow-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #0f1113;
  color: #f1f5f9;
  position: relative;
  overflow: hidden;
  user-select: none;
}

/* 顶部操作工具栏 */
.flow-ate-toolbar {
  flex-shrink: 0;
  height: 44px;
  background: #181a1d;
  border-bottom: 1px solid #2e3238;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 20;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.site-box {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.site-box .label {
  color: #94a3b8;
  font-weight: 600;
}
.flow-select-mini {
  width: 76px;
}
.master-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #cbd5e1;
  cursor: pointer;
}
.toolbar-divider {
  width: 1px;
  height: 18px;
  background: #334155;
}
.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #cbd5e1;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.tool-btn:hover {
  background: #334155;
  color: #ffffff;
}
.snap-active-btn {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #34d399;
}
.copy-layout-btn {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}
.copy-layout-btn:hover {
  background: rgba(245, 158, 11, 0.3);
  border-color: #f59e0b;
  color: #fef3c7;
}
.text-amber-btn {
  color: #fbbf24;
  font-weight: 600;
}
.copy-code-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #0284c7;
  background: #0369a1;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.copy-code-btn:hover {
  background: #0284c7;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tech-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.25);
}
.led-green {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 6px #10b981;
}
.hardware-id {
  font-family: monospace;
  font-size: 11px;
  color: #64748b;
}

/* 主画布容器 */
.flow-canvas-container {
  flex: 1 1 0%;
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
  background: #121417;
  background-image: 
    radial-gradient(rgba(255, 255, 255, 0.06) 1.2px, transparent 1.2px);
  background-size: 20px 20px;
}
.ate-dark-flow {
  width: 100%;
  height: 100%;
}

/* ================= 节点通用与各模块样式 ================= */
.custom-flow-node {
  box-sizing: border-box;
}

/* 1. Channel Master */
.channel-master-node {
  display: flex;
  align-items: center;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 6px 14px;
  gap: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}
.bar-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bar-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}
.bar-divider {
  width: 1px;
  height: 18px;
  background: #334155;
}
.pin-select { width: 85px; }
.mode-select { width: 115px; }
.bw-select { width: 70px; }
.dib-label { font-size: 11px; color: #94a3b8; }
.dib-badge {
  font-family: monospace;
  font-size: 11px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

/* 2. Limit Node */
.limit-node {
  width: 250px;
  background: #181a1d;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
}
.sub-card {
  background: #1e2023;
  border: 1px solid #2e3238;
  border-radius: 6px;
  padding: 8px 10px;
}
.mt-2 { margin-top: 8px; }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.card-title {
  font-size: 11px;
  font-weight: 700;
  color: #f1f5f9;
}
.tag-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}
.tag-blue {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}
.tag-indigo {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
}
.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 11px;
}
.param-label { color: #94a3b8; }
.param-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.flow-input {
  width: 65px;
  background: #111315;
  border: 1px solid #3b4252;
  border-radius: 4px;
  color: #ffffff;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 11px;
  text-align: right;
  outline: none;
}
.flow-input:focus { border-color: #38bdf8; }
.text-emerald { color: #34d399; }
.text-blue { color: #60a5fa; }
.unit { font-size: 10px; color: #64748b; width: 12px; }

/* 3. Source Hub Node */
.source-hub-node {
  position: relative;
  background: #181a1d;
  border: 1px solid #4338ca;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 4px 20px rgba(67, 56, 202, 0.25);
}
.hub-container {
  display: flex;
  align-items: center;
  gap: 16px;
}
.purple-circle-hub {
  width: 170px;
  background: radial-gradient(circle at center, #2e1065 0%, #1e1b4b 100%);
  border: 2px solid #6366f1;
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);
}
.hub-title {
  margin: 0 0 8px 0;
  font-size: 11px;
  font-weight: 700;
  color: #c7d2fe;
}
.hub-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}
.hub-label { color: #a5b4fc; }
.hub-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.hub-input {
  width: 55px;
  background: #0f172a;
  border: 1px solid #4338ca;
  border-radius: 4px;
  color: #38bdf8;
  font-family: monospace;
  font-size: 11px;
  padding: 2px 4px;
  text-align: right;
  outline: none;
}
.hub-select { width: 72px; }
.gate-toggle-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  color: #e2e8f0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.3);
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.text-emerald-glow {
  color: #34d399;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
}
.amps-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.amp-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.amp-svg {
  width: 38px;
  height: 30px;
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.4));
}
.amp-triangle {
  fill: #15803d;
  stroke: #22c55e;
  stroke-width: 2;
  transition: all 0.3s;
}
.drive-amp.is-active .amp-triangle {
  fill: #22c55e;
  stroke: #86efac;
  filter: drop-shadow(0 0 10px #22c55e);
}
.amp-text {
  font-size: 10px;
  font-weight: 700;
  color: #86efac;
  margin-top: 2px;
}

/* 4. Resistor Node 与 5. Chip Pin Node (严格统一高度与垂直居中，彻底消除 1px 奇偶像素偏差) */
.resistor-node {
  height: 50px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  background: #181a1d;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 0 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}
.components-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slew-box, .resistor-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #24272c;
  border: 1px solid #3e4450;
  border-radius: 6px;
  padding: 4px 6px;
}
.box-tag {
  font-size: 9px;
  color: #94a3b8;
  font-weight: 700;
  margin-bottom: 2px;
}
.symbol-svg { width: 36px; height: 18px; }
.resistor-svg { width: 50px; }
.wire-connector {
  width: 12px;
  height: 2px;
  background: #64748b;
}

/* 5. Chip Pin Node */
.chip-pin-node {
  height: 50px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  background: #181a1d;
  border: 1px solid #ca8a04;
  border-radius: 8px;
  padding: 0 12px;
  box-shadow: 0 0 16px rgba(234, 179, 8, 0.2);
}
.pin-terminal {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chip-icon {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 0 6px rgba(234, 179, 8, 0.6));
}
.pin-info { display: flex; flex-direction: column; }
.pin-title {
  font-size: 9px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
}
.pin-name { font-size: 12px; font-weight: 700; color: #f8fafc; }
.text-amber { color: #fbbf24; }
.pin-channel { font-family: monospace; font-size: 10px; color: #94a3b8; }

/* 6. Meter Node */
.meter-node {
  width: 290px;
  background: #181a1d;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
}
.meter-content-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.filter-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e2023;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #2e3238;
}
.filter-svg { width: 32px; height: 18px; }
.filter-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.label { color: #94a3b8; font-size: 11px; }
.bypass-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #cbd5e1;
  cursor: pointer;
}
.meter-trapezoid-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1e2023;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #2e3238;
}
.trapezoid-svg {
  width: 72px;
  height: 36px;
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.4));
}
.meter-configs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cfg-row { display: flex; align-items: center; gap: 6px; }
.cfg-label { font-size: 11px; color: #94a3b8; width: 40px; }
.sampling-controls {
  background: #1e2023;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #2e3238;
}
.sample-param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.param-item { display: flex; align-items: center; gap: 6px; }
.flow-input-num {
  width: 50px;
  background: #111315;
  border: 1px solid #3b4252;
  border-radius: 4px;
  color: #ffffff;
  padding: 2px 4px;
  font-family: monospace;
  font-size: 11px;
  text-align: right;
  outline: none;
}
.status-indicator { display: flex; align-items: center; gap: 6px; }
.led-dot { width: 8px; height: 8px; border-radius: 50%; }
.led-ready { background: #10b981; box-shadow: 0 0 6px #10b981; }
.led-busy { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
.led-pulse-green {
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
  animation: pulse 1s infinite alternate;
}
@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.1); opacity: 1; }
}
.led-text { font-size: 10px; font-weight: 700; color: #94a3b8; }
.btn-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.flow-btn {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #334155;
  background: #27272a;
  color: #f1f5f9;
  transition: all 0.2s;
}
.flow-btn:hover { background: #334155; }
.loop-btn.active-loop {
  background: #065f46;
  border-color: #059669;
  color: #a7f3d0;
}
.read-btn {
  background: #1e3a8a;
  border-color: #2563eb;
  color: #bfdbfe;
}
.read-btn:hover { background: #1d4ed8; }

/* 7. Meter Reading Node */
.meter-reading-node {
  width: 220px;
  background: #181a1d;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
}
.reading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.reading-title { font-size: 11px; font-weight: 700; color: #94a3b8; }
.reading-tag {
  font-size: 9px;
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  color: #cbd5e1;
}
.reading-display-wrap {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  background: #090a0b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 10px;
}
.reading-value {
  font-size: 20px;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
  transition: opacity 0.15s;
}
.reading-value.is-busy { opacity: 0.5; }
.reading-unit { font-size: 14px; font-weight: 700; color: #94a3b8; }

/* Handle 端点配色 */
.flow-handle {
  width: 9px;
  height: 9px;
  border: 2px solid #0f172a;
}
.cyan-handle { background: #38bdf8 !important; }
.blue-handle { background: #3b82f6 !important; }
.emerald-handle { background: #22c55e !important; }
.purple-handle { background: #a855f7 !important; }
.amber-handle { background: #f59e0b !important; }
.orange-handle { background: #d97706 !important; }

/* 底部状态栏 */
.flow-ate-footer {
  flex-shrink: 0;
  height: 30px;
  background: #141619;
  border-top: 1px solid #2e3238;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 11px;
  color: #94a3b8;
  z-index: 20;
}
.status-title {
  color: #64748b;
  font-weight: 700;
  margin-right: 6px;
}
.status-msg {
  color: #cbd5e1;
  font-family: monospace;
}
.footer-right {
  color: #10b981;
  font-weight: 500;
}
</style>
