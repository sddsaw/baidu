<template>
  <div class="vscode-flow-page">
    <!-- ================= 原生 SVG + PanzoomViewport 视口工作台 (通用组件驱动缩放与 HUD) ================= -->
    <PanzoomViewport
      ref="panzoomViewportRef"
      class="circuit-panzoom-box"
      :base-width="1210"
      :base-height="460"
      :min-scale="0.2"
      :max-scale="3.5"
      :step="0.08"
      :require-ctrl-for-wheel="true"
      :enable-pan="true"
      :double-click-reset="true"
      :auto-fit-on-resize="true"
      :auto-fit-on-init="true"
      :show-hud="true"
      :show-hud-status="true"
      exclude-selector="input, select, textarea, button, a, [role='button'], .el-select, .el-input, .el-button, .interactive-point, .interactive-blade, .interactive-relay, .interactive-socket, .interactive-wire, .hit-area"
    >
      <div class="circuit-content-row">
        <!-- ================= 1. 左侧: 激励源参数配置卡片 ================= -->
        <aside class="force-panel-card">
          <el-tabs v-model="forceSetup.activeTab" class="vscode-tabs" @tab-change="onForceTabChange">
            <!-- ForceI 恒流源选项卡 -->
            <el-tab-pane label="ForceI" name="ForceI">
              <div class="panel-form-body">
                <div class="form-item">
                  <label class="form-label">Current:</label>
                  <el-input v-model="forceSetup.forceI.current" size="small" class="text-right" placeholder="0">
                    <template #append>A</template>
                  </el-input>
                </div>

                <div class="form-item">
                  <label class="form-label">Force Current Range:</label>
                  <el-select v-model="forceSetup.forceI.range" size="small" class="w-full" :teleported="false" popper-class="circuit-dark-popper">
                    <el-option v-for="opt in CURRENT_RANGE_OPTIONS" :key="opt" :label="`${opt} A`" :value="opt" />
                  </el-select>
                </div>

                <div class="form-item">
                  <label class="form-label">VHi:</label>
                  <el-input v-model="forceSetup.forceI.vHi" size="small" class="text-right" placeholder="6.500">
                    <template #append>V</template>
                  </el-input>
                </div>

                <div class="form-item">
                  <label class="form-label">VLo:</label>
                  <el-input v-model="forceSetup.forceI.vLo" size="small" class="text-right" placeholder="-1.600">
                    <template #append>V</template>
                  </el-input>
                </div>

                <div class="form-actions">
                  <el-button size="small" class="w-half" @click="handleClear">Clear</el-button>
                  <el-button type="primary" size="small" class="w-half" @click="handleApply">Apply</el-button>
                </div>
              </div>
            </el-tab-pane>

            <!-- ForceV 恒压源选项卡 -->
            <el-tab-pane label="ForceV" name="ForceV">
              <div class="panel-form-body">
                <div class="form-item">
                  <label class="form-label">Voltage:</label>
                  <el-input v-model="forceSetup.forceV.voltage" size="small" class="text-right" placeholder="0.000">
                    <template #append>V</template>
                  </el-input>
                </div>

                <div class="form-item">
                  <label class="form-label">Force Voltage Range:</label>
                  <el-select v-model="forceSetup.forceV.range" size="small" class="w-full" :teleported="false" popper-class="circuit-dark-popper">
                    <el-option v-for="opt in VOLTAGE_RANGE_OPTIONS" :key="opt" :label="`${opt} V`" :value="opt" />
                  </el-select>
                </div>

                <div class="form-item">
                  <label class="form-label">IHi:</label>
                  <el-input v-model="forceSetup.forceV.iHi" size="small" class="text-right" placeholder="20.000 µ">
                    <template #append>A</template>
                  </el-input>
                </div>

                <div class="form-item">
                  <label class="form-label">ILo:</label>
                  <el-input v-model="forceSetup.forceV.iLo" size="small" class="text-right" placeholder="-20.000 µ">
                    <template #append>A</template>
                  </el-input>
                </div>

                <div class="form-actions">
                  <el-button size="small" class="w-half" @click="handleClear">Clear</el-button>
                  <el-button type="primary" size="small" class="w-half" @click="handleApply">Apply</el-button>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </aside>

        <!-- ================= 2. 右侧: 原生 SVG 电路拓扑板 ================= -->
        <div class="schematic-board">
          <svg class="schematic-svg" width="940" height="440" viewBox="0 0 940 440">
            <!-- 1. 激励源进线与多路开关连接 -->
            <line :x1="LAYOUT.mode.left + 70" y1="52" :x2="LAYOUT.mode.left + 70" y2="95" class="wire-line" />

            <!-- Voltage 进线 (点击可切至电压激励源) -->
            <g class="interactive-wire" @click="setMode('ForceVMeasureI')">
              <title>点击接通 Voltage (电压激励源回路)</title>
              <path
                :d="`M ${LAYOUT.voltage.left + 100} 100 L 155 100 L 155 125 L 222 125`"
                class="wire-line"
                :class="{ 'wire-active': circuit.mode === 'ForceVMeasureI' }"
                fill="none"
              />
              <text x="142" y="116" class="wire-text" :class="{ 'text-active': circuit.mode === 'ForceVMeasureI' }">V</text>
              <path :d="`M ${LAYOUT.voltage.left + 100} 100 L 155 100 L 155 125 L 222 125`" class="wire-hit" fill="none" />
            </g>

            <!-- Current 进线 (点击可切至电流激励源) -->
            <g class="interactive-wire" @click="setMode('ForceIMeasureV')">
              <title>点击接通 Current (电流激励源回路)</title>
              <path
                :d="`M ${LAYOUT.current.left + 100} 183 L 155 183 L 155 165 L 222 165`"
                class="wire-line"
                :class="{ 'wire-active': circuit.mode === 'ForceIMeasureV' }"
                fill="none"
              />
              <text x="142" y="178" class="wire-text" :class="{ 'text-active': circuit.mode === 'ForceIMeasureV' }">A</text>
              <path :d="`M ${LAYOUT.current.left + 100} 183 L 155 183 L 155 165 L 222 165`" class="wire-hit" fill="none" />
            </g>

            <!-- MUX 选通器五边形外框与上下触区 -->
            <polygon points="185,95 240,95 265,145 240,195 185,195" class="mux-polygon" />
            <polygon points="185,95 240,95 265,145 185,145" class="hit-area" @click="setMode('ForceVMeasureI')">
              <title>点击连接顶部【Voltage 电压触点】</title>
            </polygon>
            <polygon points="185,145 265,145 240,195 185,195" class="hit-area" @click="setMode('ForceIMeasureV')">
              <title>点击连接底部【Current 电流触点】</title>
            </polygon>

            <!-- 触点 1: 电压源触点 (V 点) -->
            <g class="interactive-point" :class="{ active: circuit.mode === 'ForceVMeasureI' }" @click.stop="setMode('ForceVMeasureI')">
              <title>触点 V: 点击连接电压源 (Force Voltage)</title>
              <circle cx="222" cy="125" r="7" class="terminal-ring" />
              <circle cx="222" cy="125" r="3" class="terminal-dot" />
              <circle cx="222" cy="125" r="14" class="hit-area" />
            </g>

            <!-- 触点 2: 电流源触点 (A 点) -->
            <g class="interactive-point" :class="{ active: circuit.mode === 'ForceIMeasureV' }" @click.stop="setMode('ForceIMeasureV')">
              <title>触点 A: 点击连接电流源 (Force Current)</title>
              <circle cx="222" cy="165" r="7" class="terminal-ring" />
              <circle cx="222" cy="165" r="3" class="terminal-dot" />
              <circle cx="222" cy="165" r="14" class="hit-area" />
            </g>

            <!-- 触点 3: 刀闸动触点与刀闸连线 (点击切换 V ↔ A) -->
            <g class="interactive-point" @click.stop="toggleMuxBlade">
              <title>刀闸动触点: 点击切换连线 (V ↔ A)</title>
              <circle cx="248" cy="145" r="6" class="terminal-ring" />
              <circle cx="248" cy="145" r="3" class="terminal-dot common-dot" />
              <circle cx="248" cy="145" r="14" class="hit-area" />
            </g>
            <g class="interactive-blade" @click.stop="toggleMuxBlade">
              <title>刀闸动触板 (点击切换连线)</title>
              <line
                x1="248"
                y1="145"
                :x2="bladeTarget.x"
                :y2="bladeTarget.y"
                class="switch-blade-active"
                :class="{
                  'connect-v': circuit.mode === 'ForceVMeasureI',
                  'connect-a': circuit.mode === 'ForceIMeasureV',
                  'connect-none': circuit.mode === 'HighImpedance'
                }"
              />
              <circle
                :cx="bladeTarget.x"
                :cy="bladeTarget.y"
                r="3.5"
                class="blade-tip"
                :class="{
                  'connect-v': circuit.mode === 'ForceVMeasureI',
                  'connect-a': circuit.mode === 'ForceIMeasureV',
                  'connect-none': circuit.mode === 'HighImpedance'
                }"
              />
            </g>

            <!-- 2. 主干母线 (高边贯通 relay，低边通向端子) -->
            <line x1="248" :y1="LAYOUT.bus.upperY" :x2="LAYOUT.bus.relayX" :y2="LAYOUT.bus.upperY" class="wire-line main-bus" />
            <path :d="`M 210 195 L 210 ${LAYOUT.bus.lowerY} L ${LAYOUT.bus.rubyBarX - 16} ${LAYOUT.bus.lowerY}`" class="wire-line main-bus" fill="none" />

            <!-- 3. 测量采样支路与黄色差分运算放大器 -->
            <circle :cx="LAYOUT.bus.ampBaseX" :cy="LAYOUT.bus.upperY" r="3.5" class="junction-dot" />
            <circle :cx="LAYOUT.bus.ampBaseX" :cy="LAYOUT.bus.lowerY" r="3.5" class="junction-dot" />
            <path :d="`M ${LAYOUT.bus.ampBaseX} ${LAYOUT.bus.upperY} L ${LAYOUT.bus.ampBaseX} 208 L ${LAYOUT.bus.ampBaseX - 16} 208`" class="wire-line" fill="none" />
            <path :d="`M ${LAYOUT.bus.ampBaseX} ${LAYOUT.bus.lowerY} L ${LAYOUT.bus.ampBaseX} 232 L ${LAYOUT.bus.ampBaseX - 16} 232`" class="wire-line" fill="none" />
            <polygon :points="`${LAYOUT.bus.ampBaseX - 16},206 ${LAYOUT.bus.ampBaseX - 48},220 ${LAYOUT.bus.ampBaseX - 16},234`" class="amp-polygon" />
            <line :x1="LAYOUT.bus.ampBaseX - 48" y1="220" :x2="LAYOUT.readBtn.left + 52" y2="220" class="wire-line" />

            <!-- 4. 保护钳位二极管 -->
            <line :x1="LAYOUT.bus.diodeX" y1="52" :x2="LAYOUT.bus.diodeX" y2="244" class="wire-line" />
            <circle :cx="LAYOUT.bus.diodeX" :cy="LAYOUT.bus.upperY" r="3.5" class="junction-dot" />
            <polygon :points="`${LAYOUT.bus.diodeX - 8},120 ${LAYOUT.bus.diodeX + 8},120 ${LAYOUT.bus.diodeX},106`" class="diode-shape" />
            <line :x1="LAYOUT.bus.diodeX - 8" y1="106" :x2="LAYOUT.bus.diodeX + 8" y2="106" class="diode-bar" />
            <text :x="LAYOUT.bus.diodeX + 12" y="116" class="sch-sub-text">Vf=0V</text>

            <polygon :points="`${LAYOUT.bus.diodeX - 8},184 ${LAYOUT.bus.diodeX + 8},184 ${LAYOUT.bus.diodeX},170`" class="diode-shape" />
            <line :x1="LAYOUT.bus.diodeX - 8" y1="170" :x2="LAYOUT.bus.diodeX + 8" y2="170" class="diode-bar" />
            <text :x="LAYOUT.bus.diodeX + 12" y="180" class="sch-sub-text">Vf=0V</text>

            <!-- 5. 继电器 K1 (点击可切换导通/断开) -->
            <g class="relay-group interactive-relay" @click="toggleUpperRelay">
              <title>{{ circuit.upperRelay ? '继电器 K1: 已闭合导通 (点击断开)' : '继电器 K1: 已断开开路 (点击闭合)' }}</title>
              <circle :cx="LAYOUT.bus.relayX" :cy="LAYOUT.bus.upperY" r="6" class="terminal-ring" :class="{ active: circuit.upperRelay }" />
              <circle :cx="LAYOUT.bus.relayX" :cy="LAYOUT.bus.upperY" r="3" class="terminal-dot" />
              <circle :cx="LAYOUT.bus.relayX + 40" :cy="LAYOUT.bus.upperY" r="6" class="terminal-ring" :class="{ active: circuit.upperRelay }" />
              <circle :cx="LAYOUT.bus.relayX + 40" :cy="LAYOUT.bus.upperY" r="3" class="terminal-dot" />
              <line
                :x1="LAYOUT.bus.relayX"
                :y1="LAYOUT.bus.upperY"
                :x2="circuit.upperRelay ? LAYOUT.bus.relayX + 40 : LAYOUT.bus.relayX + 34"
                :y2="circuit.upperRelay ? LAYOUT.bus.upperY : LAYOUT.bus.upperY - 15"
                class="relay-blade"
                :class="{ active: circuit.upperRelay }"
              />
              <circle
                :cx="circuit.upperRelay ? LAYOUT.bus.relayX + 40 : LAYOUT.bus.relayX + 34"
                :cy="circuit.upperRelay ? LAYOUT.bus.upperY : LAYOUT.bus.upperY - 15"
                r="3.2"
                class="relay-tip"
                :class="{ active: circuit.upperRelay }"
              />
              <rect :x="LAYOUT.bus.relayX - 10" :y="LAYOUT.bus.upperY - 25" width="60" height="40" class="hit-area" />
            </g>

            <!-- 6. 品红 DUT 矩阵母线条与端口插孔 -->
            <rect :x="LAYOUT.bus.rubyBarX" y="75" width="8" height="255" rx="2" class="matrix-bus-bar" />
            <line :x1="LAYOUT.bus.relayX + 40" :y1="LAYOUT.bus.upperY" :x2="LAYOUT.bus.rubyBarX - 16" :y2="LAYOUT.bus.upperY" class="wire-line" />
            <g class="interactive-socket" @click="cycleNextPin">
              <title>DUT 引脚插孔 (点击切换连接引脚)</title>
              <polygon
                :points="`
                  ${LAYOUT.bus.rubyBarX - 16},${LAYOUT.bus.upperY}
                  ${LAYOUT.bus.rubyBarX - 8},${LAYOUT.bus.upperY - 7}
                  ${LAYOUT.bus.rubyBarX + 16},${LAYOUT.bus.upperY - 7}
                  ${LAYOUT.bus.rubyBarX + 16},${LAYOUT.bus.upperY + 7}
                  ${LAYOUT.bus.rubyBarX - 8},${LAYOUT.bus.upperY + 7}
                `"
                class="socket-shape"
              />
            </g>
            <polygon
              :points="`
                ${LAYOUT.bus.rubyBarX - 16},${LAYOUT.bus.lowerY}
                ${LAYOUT.bus.rubyBarX - 8},${LAYOUT.bus.lowerY - 7}
                ${LAYOUT.bus.rubyBarX + 16},${LAYOUT.bus.lowerY - 7}
                ${LAYOUT.bus.rubyBarX + 16},${LAYOUT.bus.lowerY + 7}
                ${LAYOUT.bus.rubyBarX - 8},${LAYOUT.bus.lowerY + 7}
              `"
              class="socket-shape"
            />
          </svg>

          <!-- ================= 3. 原理图上层交互表单控件 ================= -->
          <!-- Mode 模式显示框 (只读显示，与左侧面板或触点连线同步) -->
          <div class="sch-widget mode-widget" :style="{ left: `${LAYOUT.mode.left}px`, top: `${LAYOUT.mode.top}px` }">
            <div class="sch-label">Mode:</div>
            <div class="sch-display-box mode-select-el">
              {{ circuit.mode }}
            </div>
          </div>

          <!-- Voltage 激励电压显示框 (只读显示，与左侧面板参数同步) -->
          <div class="sch-widget" :style="{ left: `${LAYOUT.voltage.left}px`, top: `${LAYOUT.voltage.top}px` }">
            <div class="sch-label">Voltage:</div>
            <div class="sch-input-row">
              <div class="sch-display-box text-right" style="width: 95px;">
                {{ circuit.voltage }}
              </div>
            </div>
          </div>

          <!-- Current 激励电流显示框 (只读显示，与左侧面板参数同步) -->
          <div class="sch-widget" :style="{ left: `${LAYOUT.current.left}px`, top: `${LAYOUT.current.top}px` }">
            <div class="sch-label">Current:</div>
            <div class="sch-input-row">
              <div class="sch-display-box text-right" style="width: 95px;">
                {{ circuit.current }}
              </div>
            </div>
          </div>

          <!-- Force Current Range 显示框 (只读显示，与左侧面板参数同步) -->
          <div class="sch-widget" :style="{ left: `${LAYOUT.forceRange.left}px`, top: `${LAYOUT.forceRange.top}px` }">
            <div class="sch-label">Force Current Range:</div>
            <div class="sch-input-row">
              <div class="sch-display-box text-right" style="width: 95px;">
                {{ circuit.forceCurrentRange }}
              </div>
              <span class="sch-unit">A</span>
            </div>
          </div>

          <!-- Measure Current Range 显示框 (只读显示) -->
          <div class="sch-widget" :style="{ left: `${LAYOUT.measureRange.left}px`, top: `${LAYOUT.measureRange.top}px` }">
            <div class="sch-label">Measure Current Range:</div>
            <div class="sch-input-row">
              <div class="sch-display-box text-right" style="width: 110px;">
                {{ circuit.measureCurrentRange }}
              </div>
              <span class="sch-unit">A</span>
            </div>
          </div>

          <!-- Measured Result 测读结果显示框 -->
          <div class="sch-widget" :style="{ left: `${LAYOUT.measuredResult.left}px`, top: `${LAYOUT.measuredResult.top}px` }">
            <div class="sch-label">Measured Result:</div>
            <div class="sch-input-row">
              <div class="sch-display-box text-right highlight-result" style="width: 95px;">
                {{ circuit.measuredResult }}
              </div>
              <span class="sch-unit">V</span>
            </div>
          </div>

          <!-- Read 测读触发按钮 -->
          <div class="sch-widget" :style="{ left: `${LAYOUT.readBtn.left}px`, top: `${LAYOUT.readBtn.top}px` }">
            <el-button
              type="success"
              size="small"
              class="read-widget-btn"
              :loading="circuit.isReading"
              @click="handleRead"
              title="触发实时采样测读"
            >
              Read
            </el-button>
          </div>

          <!-- Clamps VHi / VLo -->
          <div class="sch-widget" :style="{ left: `${LAYOUT.clampVHi.left}px`, top: `${LAYOUT.clampVHi.top}px` }">
            <div class="sch-label">Clamps VHi:</div>
            <div class="sch-input-row">
              <el-input v-model="circuit.clampVHi" size="small" style="width: 85px;" class="text-right" />
              <span class="sch-unit">V</span>
            </div>
          </div>

          <div class="sch-widget" :style="{ left: `${LAYOUT.clampVLo.left}px`, top: `${LAYOUT.clampVLo.top}px` }">
            <div class="sch-label">Clamps VLo:</div>
            <div class="sch-input-row">
              <el-input v-model="circuit.clampVLo" size="small" style="width: 85px;" class="text-right" />
              <span class="sch-unit">V</span>
            </div>
          </div>

          <!-- Pin 引脚与信道 -->
          <div class="sch-widget pin-widget" :style="{ left: `${LAYOUT.pin.left}px`, top: `${LAYOUT.pin.top}px` }">
            <div class="sch-label">Pin:</div>
            <el-select v-model="circuit.pin" size="small" class="pin-select-el" :teleported="false" popper-class="circuit-dark-popper" @change="(val: any) => onPinSelectChange(val)">
              <el-option v-for="p in PIN_OPTIONS" :key="p.pin" :label="p.pin" :value="p.pin" />
            </el-select>
            <el-input v-model="circuit.pinChannel" size="small" class="pin-channel-input" />
          </div>

          <!-- DGS 标牌显示框 (只读显示) -->
          <div class="sch-widget dgs-widget" :style="{ left: `${LAYOUT.dgs.left}px`, top: `${LAYOUT.dgs.top}px` }">
            <div class="sch-display-box dgs-input-el text-center">
              {{ circuit.dgs }}
            </div>
          </div>

          <!-- ================= 4. 底部 Test Limits 判定门限框 ================= -->
          <div
            class="sch-limits-panel"
            :style="{
              left: `${LAYOUT.limits.left}px`,
              top: `${LAYOUT.limits.top}px`,
              width: `${LAYOUT.limits.width}px`,
              height: `${LAYOUT.limits.height}px`
            }"
          >
            <span class="limits-caption">Test Limits</span>
            <div class="limits-content">
              <div class="limit-cell">
                <span class="sch-label">IHi:</span>
                <el-input v-model="circuit.iHi" size="small" style="width: 80px;" placeholder="" />
                <span class="sch-unit">A</span>
              </div>
              <div class="limit-cell">
                <span class="sch-label">ILo:</span>
                <el-input v-model="circuit.iLo" size="small" style="width: 80px;" placeholder="" />
                <span class="sch-unit">A</span>
              </div>
              <div class="limit-cell">
                <span class="sch-label">VHi:</span>
                <el-input v-model="circuit.vHi" size="small" style="width: 95px;" />
              </div>
              <div class="limit-cell">
                <span class="sch-label">VLo:</span>
                <el-input v-model="circuit.vLo" size="small" style="width: 95px;" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanzoomViewport>
  </div>
</template>

<script setup lang="ts">
/**
 * =========================================================================
 * @file CircuitFlowView/index.vue
 * @description 半导体 DC-VI 仪器拓扑原理图视图组件 (原生 SVG + PanzoomViewport 视口)
 * =========================================================================
 */
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import PanzoomViewport from '@/components/panzoom/PanzoomViewport.vue'

// 视口组件引用
const panzoomViewportRef = ref<InstanceType<typeof PanzoomViewport> | null>(null)

// ----------------- 常量配置表 -----------------
const LAYOUT = Object.freeze({
  mode: { left: 125, top: 12 },
  voltage: { left: 15, top: 72 },
  current: { left: 15, top: 155 },
  forceRange: { left: 15, top: 238 },
  measureRange: { left: 390, top: 12 },
  measuredResult: { left: 230, top: 198 },
  readBtn: { left: 360, top: 208 },
  clampVHi: { left: 590, top: 12 },
  clampVLo: { left: 590, top: 228 },
  pin: { left: 770, top: 114 },
  dgs: { left: 770, top: 280 },
  limits: { left: 15, top: 345, width: 905, height: 65 },
  bus: {
    upperY: 145,
    lowerY: 290,
    ampBaseX: 510,
    diodeX: 635,
    relayX: 670,
    rubyBarX: 746
  }
})

const CURRENT_RANGE_OPTIONS = [
  '200.00 n', '2.0000 µ', '20.000 µ', '200.00 µ',
  '2.0000 m', '20.000 m', '200.00 m', '1.0000', '2.0000'
]

const VOLTAGE_RANGE_OPTIONS = ['200.00 m', '2.0000', '6.0000', '20.000', '60.000', '100.00']

const PIN_OPTIONS = [
  { pin: 'dir', channel: '16.ab422 (16.ch10)' },
  { pin: 'vcc', channel: '16.ab423 (16.ch11)' },
  { pin: 'vdd', channel: '16.ab424 (16.ch12)' },
  { pin: 'clk', channel: '16.ab425 (16.ch13)' }
]

// ----------------- 核心状态定义 -----------------
// 电路实时运行态
const circuit = reactive({
  mode: 'ForceIMeasureV' as 'ForceIMeasureV' | 'ForceVMeasureI' | 'HighImpedance',
  voltage: '',
  current: '0',
  forceCurrentRange: '20.000 µ',
  measureCurrentRange: '',
  measuredResult: '0',
  isReading: false,
  clampVHi: '6.500',
  clampVLo: '-1.600',
  upperRelay: false,
  pin: 'dir',
  pinChannel: '16.ab422 (16.ch10)',
  dgs: 'DGS',
  iHi: '',
  iLo: '',
  vHi: 'No Limit',
  vLo: 'No Limit',
  evalStatus: 'PASS' as 'PASS' | 'FAIL'
})

// 左侧激励源独立面板参数 (ForceI / ForceV 选项卡)
const forceSetup = reactive({
  activeTab: 'ForceI' as 'ForceI' | 'ForceV',
  forceI: {
    current: '0',
    range: '20.000 µ',
    vHi: '6.500',
    vLo: '-1.600'
  },
  forceV: {
    voltage: '0.000',
    range: '20.000',
    iHi: '20.000 µ',
    iLo: '-20.000 µ'
  }
})

// ----------------- 自动化数据流同步 -----------------
// 左侧输入实时同步至电路拓扑，无需在各个 input 上重复绑定事件
watch(
  () => forceSetup.forceI,
  (val) => {
    if (circuit.mode === 'ForceIMeasureV') {
      circuit.current = val.current
      circuit.forceCurrentRange = val.range
      circuit.clampVHi = val.vHi
      circuit.clampVLo = val.vLo
    }
  },
  { deep: true }
)

watch(
  () => forceSetup.forceV,
  (val) => {
    if (circuit.mode === 'ForceVMeasureI') {
      circuit.voltage = val.voltage
    }
  },
  { deep: true }
)

// ----------------- 业务逻辑与拓扑控制 -----------------
/**
 * MUX 动触刀闸目标坐标
 */
const bladeTarget = computed(() => {
  if (circuit.mode === 'ForceVMeasureI') return { x: 222, y: 125 }
  if (circuit.mode === 'ForceIMeasureV') return { x: 222, y: 165 }
  return { x: 232, y: 145 }
})

/**
 * 统一设置仪器工作模式，并同步关联左侧配置卡片与 MUX 刀闸位置
 */
const setMode = (mode: 'ForceVMeasureI' | 'ForceIMeasureV' | 'HighImpedance', notify = true) => {
  if (circuit.mode === mode) return
  circuit.mode = mode

  if (mode === 'ForceVMeasureI') {
    forceSetup.activeTab = 'ForceV'
    circuit.voltage = forceSetup.forceV.voltage
  } else if (mode === 'ForceIMeasureV') {
    forceSetup.activeTab = 'ForceI'
    circuit.current = forceSetup.forceI.current
    circuit.forceCurrentRange = forceSetup.forceI.range
    circuit.clampVHi = forceSetup.forceI.vHi
    circuit.clampVLo = forceSetup.forceI.vLo
  }

  if (notify) {
    const tipMap: Record<string, string> = {
      ForceVMeasureI: '⚡ 刀闸已连接至【Voltage 电压触点】(ForceVMeasureI)',
      ForceIMeasureV: '⚡ 刀闸已连接至【Current 电流触点】(ForceIMeasureV)',
      HighImpedance: '⚡ 刀闸已断开至【高阻悬空 (High-Z)】'
    }
    ElMessage.success({ message: tipMap[mode], duration: 1600 })
  }
}

/**
 * 切换左侧 Force 选项卡
 */
const onForceTabChange = (tab: string | number) => {
  setMode(tab === 'ForceI' ? 'ForceIMeasureV' : 'ForceVMeasureI', true)
}

/**
 * 动触头快速循环切换 (V ↔ A)
 */
const toggleMuxBlade = () => {
  setMode(circuit.mode === 'ForceVMeasureI' ? 'ForceIMeasureV' : 'ForceVMeasureI')
}

/**
 * 切换上继电器 K1 通断
 */
const toggleUpperRelay = () => {
  circuit.upperRelay = !circuit.upperRelay
  ElMessage.info({
    message: circuit.upperRelay
      ? '🔌 继电器 K1 已闭合：高边母线已导通至 DUT 端口'
      : '⭕ 继电器 K1 已断开：输出回路开路',
    duration: 1600
  })
}

/**
 * DUT 引脚切换与信道联动
 */
const onPinSelectChange = (newPin: string) => {
  const match = PIN_OPTIONS.find((p) => p.pin === newPin)
  if (match) {
    circuit.pinChannel = match.channel
  }
  ElMessage.success(`DUT 引脚已选择：${circuit.pin} (${circuit.pinChannel})`)
}

const cycleNextPin = () => {
  const currentIndex = PIN_OPTIONS.findIndex((p) => p.pin === circuit.pin)
  const next = PIN_OPTIONS[(currentIndex + 1) % PIN_OPTIONS.length]
  circuit.pin = next.pin
  circuit.pinChannel = next.channel
  ElMessage.success(`DUT 引脚已切换至：${circuit.pin} (${circuit.pinChannel})`)
}

/**
 * 测读 (Read) 触发仿真计算与门限比对
 */
const handleRead = () => {
  circuit.isReading = true
  setTimeout(() => {
    circuit.isReading = false

    if (!circuit.upperRelay) {
      circuit.measuredResult = '0'
      circuit.evalStatus = 'FAIL'
      ElMessage.warning('上路继电器断开，回路开路，测读值为 0 V')
      return
    }

    const base = parseFloat(circuit.voltage) || parseFloat(circuit.current) * 8 || 0.05
    const jitter = (Math.random() - 0.5) * 0.01
    const val = (base + jitter).toFixed(3)
    circuit.measuredResult = val

    // 门限判断
    const num = parseFloat(val)
    const vHi = parseFloat(circuit.vHi)
    const vLo = parseFloat(circuit.vLo)
    circuit.evalStatus = (!isNaN(vHi) && num > vHi) || (!isNaN(vLo) && num < vLo) ? 'FAIL' : 'PASS'

    ElMessage.success(`测读成功: ${val} V (${circuit.evalStatus})`)
  }, 220)
}

/**
 * 应用面板参数
 */
const handleApply = () => {
  if (forceSetup.activeTab === 'ForceI') {
    ElMessage.success(`✅ 已应用【ForceI】参数: Current = ${forceSetup.forceI.current || '0'} A`)
  } else {
    ElMessage.success(`✅ 已应用【ForceV】参数: Voltage = ${forceSetup.forceV.voltage || '0'} V`)
  }
}

/**
 * 清空当前选项卡参数
 */
const handleClear = () => {
  if (forceSetup.activeTab === 'ForceI') {
    Object.assign(forceSetup.forceI, { current: '', vHi: '', vLo: '' })
    circuit.current = ''
  } else {
    Object.assign(forceSetup.forceV, { voltage: '', iHi: '', iLo: '' })
    circuit.voltage = ''
  }
  ElMessage.info('已清空当前面板参数')
}
</script>

<style src="./index.css"></style>
