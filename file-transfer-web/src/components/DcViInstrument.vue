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

    <!-- 居中视口工作区舞台 (Stage) -->
    <div class="ate-stage">
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
            <el-select v-model="siteValue" size="small" class="ate-el-select site-select" popper-class="ate-dark-popper">
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
        
        <!-- 全局统一矢量拓扑 SVG 层 (保证所有连线与元器件 100% 物理精准对齐，暗黑工业风) -->
        <svg class="main-topology-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- 指向左侧的白色标准箭头 -->
            <marker id="arrow-left" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 1 2 L 8 5 L 1 8 z" fill="#ffffff" />
            </marker>
            <!-- 翠绿发光滤镜 (用于 Drive / Comp 三角形放大器) -->
            <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <!-- 天蓝发光滤镜 (用于 Active Load / PPMU 模块) -->
            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <!-- 金黄发光滤镜 (用于末端 Pin 芯片触点) -->
            <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- 1. 顶部参考图装饰标记：Period 与 Driver Mode 导向线 -->
          <line x1="395" y1="135" x2="435" y2="135" stroke="#ffffff" stroke-width="2" />

          <!-- 2. Drive 驱动源翠绿色三角形 (尖端向右，鲜艳荧光绿，匹配参考图) -->
          <g class="svg-drive-amp" filter="url(#glow-green)">
            <polygon points="560,192 596,208 560,224" fill="#22c55e" stroke="#4ade80" stroke-width="2" />
            <text x="578" y="184" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Drive</text>
          </g>

          <!-- 3. Comp 比较器翠绿色三角形 (尖端向左，鲜艳荧光绿，匹配参考图) -->
          <g class="svg-comp-amp" filter="url(#glow-green)">
            <polygon points="596,302 560,318 596,334" fill="#22c55e" stroke="#4ade80" stroke-width="2" />
            <text x="578" y="294" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Comp</text>
          </g>

          <!-- A. 驱动源输出主干线 (向右展开，白色高对比度，y = 208px 中心线) -->
          <line
            x1="596"
            y1="208"
            x2="650"
            y2="208"
            stroke="#ffffff"
            stroke-width="2.5"
            :class="{ 'wire-active-flow': isGateActive }"
          />
          
          <!-- 压摆整形方块 [/‾] (嵌入 x=650~688, y=208 导线断口) -->
          <g class="svg-slew-box">
            <rect x="650" y="193" width="38" height="30" rx="3" fill="#32353a" stroke="#64748b" stroke-width="1.8"/>
            <path d="M 656 215 L 665 215 L 673 201 L 682 201" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <line
            x1="688"
            y1="208"
            x2="730"
            y2="208"
            stroke="#ffffff"
            stroke-width="2.5"
            :class="{ 'wire-active-flow': isGateActive }"
          />

          <!-- 精密采样电阻 /\\/\\/\\ (白银色折线电阻，严格嵌入 x=730~805, y=208 导线断口) -->
          <path
            d="M 730 208 L 737 208 L 743 198 L 753 218 L 763 198 L 773 218 L 783 198 L 793 218 L 799 208 L 805 208"
            fill="none"
            stroke="#ffffff"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
          <line
            x1="805"
            y1="208"
            x2="975"
            y2="208"
            stroke="#ffffff"
            stroke-width="2.5"
            :class="{ 'wire-active-flow': isGateActive }"
          />

          <!-- 右侧末端向上微折角至芯片触点 (匹配参考图) -->
          <line x1="975" y1="208" x2="990" y2="198" stroke="#ffffff" stroke-width="2.5" />
          <line x1="990" y1="198" x2="1005" y2="198" stroke="#ffffff" stroke-width="2.5" />

          <!-- 末端金黄色发光芯片引脚符号 (Pin Name & Channel) -->
          <g class="svg-chip-pin" filter="url(#glow-yellow)">
            <rect x="1005" y="186" width="22" height="24" rx="3" fill="#78350f" stroke="#eab308" stroke-width="2" />
            <line x1="1000" y1="198" x2="1005" y2="198" stroke="#ffffff" stroke-width="2" />
            <line x1="1027" y1="198" x2="1032" y2="198" stroke="#ffffff" stroke-width="2" />
            <text x="1016" y="174" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Pin Name: {{ selectedPin }}</text>
            <text x="1016" y="226" font-size="11" font-weight="700" fill="#cbd5e1" text-anchor="middle">Channel: 19.x202</text>
          </g>

          <!-- B. Sense 远端感测回路平行线 (从紫色圆引出至 y = 270px，延伸至 x=975) -->
          <line
            x1="580"
            y1="270"
            x2="975"
            y2="270"
            stroke="#ffffff"
            stroke-width="2.5"
            :class="{ 'wire-active-flow': isGateActive }"
          />

          <!-- C. Kelvin 垂直短接母线 (跨接 Force 与 Sense) -->
          <line x1="975" y1="175" x2="975" y2="305" stroke="#ef4444" stroke-width="3"/>
          <polygon points="975,204 987,208 975,212" fill="#ef4444"/>
          <polygon points="975,266 987,270 975,274" fill="#ef4444"/>

          <!-- D. 电阻两端测量抽头节点 (白色实心 Junction Dots) -->
          <circle cx="730" cy="208" r="3.5" fill="#ffffff"/>
          <circle cx="800" cy="208" r="3.5" fill="#ffffff"/>

          <!-- E. 差分采样下行回路 (白色导线) -->
          <path d="M 730 208 L 730 395 L 635 395" fill="none" stroke="#ffffff" stroke-width="2"/>
          <path d="M 800 208 L 800 435 L 635 435" fill="none" stroke="#ffffff" stroke-width="2"/>

          <!-- F. 梯形 Meter (尖端在 x=510, y=419，基底在 x=635, y: 375~463) -->
          <polygon points="510,419 635,375 635,463" fill="#d97706" stroke="#f59e0b" stroke-width="2"/>
          <text x="585" y="423" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">Meter</text>

          <!-- G. 从 Meter 尖端连至 Filter 方框右侧 -->
          <line x1="510" y1="419" x2="458" y2="419" stroke="#ffffff" stroke-width="2"/>

          <!-- H. 滤波阶跃特性符号方框 (Filter Box) -->
          <g class="svg-filter-box">
            <rect x="420" y="404" width="38" height="30" rx="3" fill="#32353a" stroke="#64748b" stroke-width="1.8"/>
            <path d="M 426 411 L 435 411 L 443 427 L 452 427" fill="none" stroke="#ffffff" stroke-width="2.2"/>
          </g>

          <!-- I. 从 Filter 方框左侧直达 Meter Reading 回读框的箭头线 (白色发光导线) -->
          <line x1="420" y1="419" x2="250" y2="419" stroke="#ffffff" stroke-width="2.5" marker-end="url(#arrow-left)"/>

          <!-- J. 限流保护总线 (从 Source/Sink Limit 汇入，亮蓝色导线) -->
          <path d="M 364 135 L 395 135 L 395 185 L 435 185" fill="none" stroke="#3b82f6" stroke-width="2.2"/>
          <path d="M 364 230 L 435 230" fill="none" stroke="#60a5fa" stroke-width="2.2"/>
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
                <el-select v-model="sourceRange" size="small" class="ate-el-select range-select" popper-class="ate-dark-popper">
                  <el-option value="81" label="81" />
                  <el-option value="50" label="50" />
                  <el-option value="20" label="20" />
                </el-select>
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
            <el-select v-model="filterFreq" size="small" class="ate-el-select filter-select" popper-class="ate-dark-popper">
              <el-option value="2539" label="2539" />
              <el-option value="1000" label="1000" />
              <el-option value="5000" label="5000" />
            </el-select>
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
            <el-select v-model="meterMode" size="small" class="ate-el-select mode-select font-bold" popper-class="ate-dark-popper" @change="onMeterModeChange">
              <el-option value="Current" label="Current" />
              <el-option value="Voltage" label="Voltage" />
            </el-select>
          </div>
          <div class="config-row">
            <span class="label-bold">Range:</span>
            <el-select v-model="meterRange" size="small" class="ate-el-select range-select font-bold font-mono" popper-class="ate-dark-popper">
              <el-option value="101.25" label="101.25" />
              <el-option value="50.00" label="50.00" />
              <el-option value="10.00" label="10.00" />
            </el-select>
            <span class="unit">{{ meterUnit }}</span>
          </div>
        </div>

        <!-- 7. 通道配置与运行模式联合主控区 (Pin, Mode, Bandwidth, DIB Channel 单行联合卡片) -->
        <div class="channel-master-bar">
          <!-- Pin 下拉选择 -->
          <div class="bar-item">
            <span class="bar-label">Pin:</span>
            <el-select v-model="selectedPin" size="small" class="ate-el-select pin-select" popper-class="ate-dark-popper">
              <el-option value="vcc" label="vcc" />
              <el-option value="vdd" label="vdd" />
              <el-option value="vio" label="vio" />
              <el-option value="vcore" label="vcore" />
              <el-option value="vref" label="vref" />
            </el-select>
          </div>

          <div class="bar-divider"></div>

          <!-- Mode 工作模式下拉选择 -->
          <div class="bar-item">
            <span class="bar-label">Mode:</span>
            <el-select v-model="viMode" size="small" class="ate-el-select mode-select" popper-class="ate-dark-popper">
              <el-option value="High Impedance" label="High Impedance" />
              <el-option value="Voltage" label="Voltage" />
              <el-option value="Current" label="Current" />
            </el-select>
          </div>

          <div class="bar-divider"></div>

          <!-- Bandwidth Setting 环路带宽下拉选择 -->
          <div class="bar-item">
            <span class="bar-label">Bandwidth Setting:</span>
            <el-select v-model="bandwidthSetting" size="small" class="ate-el-select bw-select" popper-class="ate-dark-popper">
              <el-option value="1" label="1" />
              <el-option value="2" label="2" />
              <el-option value="3" label="3" />
              <el-option value="4" label="4" />
            </el-select>
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
  scale,
  scalePercent,
  isCtrlPressed,
  isSpacePressed,
  isPanning,
  isAutoFit,
  zoomIn,
  zoomOut,
  reset: resetZoom,
  fitToContainer,
  dismissAllOverlays
} = usePanzoom(chassisRef, viewportRef, {
  baseWidth: 1100,
  baseHeight: 680,
  minScale: 0.1,
  maxScale: 3.5,
  step: 0.08,
  requireCtrlForWheel: true,
  enablePan: true,
  doubleClickReset: true,
  autoFitOnResize: true,
  autoFitOnInit: true
})

// 暴露给场景测试台与父级调用
defineExpose({
  scale,
  scalePercent,
  isAutoFit,
  isPanning,
  fitToContainer,
  resetZoom,
  dismissAllOverlays
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
/* ================= 1. 全局容器：暗黑工作台 (匹配参考图工业深灰背景) ================= */
.dc-vi-container {
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
  padding: 8px 6px 12px;
  user-select: none;
  background-color: #1e2022;
  background-image: 
    radial-gradient(rgba(255, 255, 255, 0.05) 1.2px, transparent 1.2px),
    radial-gradient(rgba(255, 255, 255, 0.05) 1.2px, #1e2022 1.2px);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
  box-sizing: border-box;
  color: #f1f5f9;
  container-type: inline-size;
}

/* 视口居中工作区舞台 (确保机台在拉伸、放大缩小、或极小容器下始终精准居中) */
.ate-stage {
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

/* ================= 悬浮缩放与平移控制 HUD (Dark Glass 质感) ================= */
.zoom-hud-panel {
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

@container (max-width: 680px) {
  .zoom-hud-panel {
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

.zoom-hud-panel:hover {
  background: rgba(38, 41, 46, 0.96);
  border-color: rgba(255, 255, 255, 0.2);
}

.zoom-hud-panel.ctrl-active {
  border-color: #22c55e;
  background: rgba(20, 36, 26, 0.95);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3), 0 8px 20px -3px rgba(34, 197, 94, 0.2);
}

.zoom-hud-panel.space-active {
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
  color: #ffffff;
  cursor: pointer;
  min-width: 52px;
  text-align: center;
  transition: all 0.15s ease;
}

.hud-scale-btn:hover {
  background: #383b42;
  border-color: #38bdf8;
  color: #38bdf8;
}

.hud-divider {
  width: 1px;
  height: 18px;
  background-color: rgba(255, 255, 255, 0.15);
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
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  background: #2b2e33;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  transition: all 0.15s ease;
}

.hud-key-tag.tag-active {
  background: #22c55e;
  border-color: #16a34a;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.hud-tip-text {
  font-weight: 500;
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

/* ================= 2. 机台机箱底盘：保持固定设计物理尺寸，通过 transform 矩阵进行全保真等比缩放 ================= */
.ate-instrument-chassis {
  width: 1100px;
  min-width: 1100px;
  max-width: 1100px;
  flex-shrink: 0;
  background-color: #26282b;
  border: 1px solid #3c4046;
  border-radius: 6px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05);
  overflow: hidden;
  color: #ffffff;
  transform-origin: 50% 50%;
  cursor: default;
}

.ate-instrument-chassis.cursor-grab {
  cursor: grab !important;
}

.ate-instrument-chassis.cursor-grabbing {
  cursor: grabbing !important;
}

/* ================= 3. 顶部操作工具栏 ================= */
.ate-toolbar {
  background: linear-gradient(to right, #1f2124, #26282b, #1f2124);
  border-bottom: 1px solid #383b40;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.site-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #2e3136;
  border: 1px solid #484c54;
  padding: 2px 8px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.site-box .label {
  color: #94a3b8;
  font-weight: 700;
}


.master-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #cbd5e1;
  font-weight: 700;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: #383b40;
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
  background: #2e3136;
  border: 1px solid #484c54;
  border-radius: 4px;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-icon-btn:hover {
  background: #3c4047;
  color: #ffffff;
  border-color: #64748b;
}

.zoom-badge-pill {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  background: #2e3136;
  border: 1px solid #484c54;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  min-width: 44px;
  text-align: center;
  transition: all 0.15s ease;
}

.zoom-badge-pill:hover {
  border-color: #38bdf8;
  color: #38bdf8;
  background: #1e293b;
}

.toolbar-divider.mini {
  height: 14px;
  margin: 0 2px;
}

.copy-btn {
  background: #2e3136;
  border: 1px solid #3b82f6;
  color: #60a5fa;
  font-weight: 700;
  border-radius: 4px;
  padding: 4px 12px;
}

.copy-btn:hover {
  background: #1e3a8a;
  color: #ffffff;
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
  background-color: #2b2e33;
  border: 1px solid #44474e;
  color: #94a3b8;
  font-weight: 600;
  font-size: 11px;
}

.online-led {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.hardware-id {
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
}

/* ================= 4. 工作画布 (彻底暗黑 ATE 科技风，匹配参考图) ================= */
.unified-canvas {
  position: relative;
  background-color: #26282b;
  min-height: 665px;
  width: 100%;
  overflow: hidden;
  color: #ffffff;
}

/* 拓扑 SVG：高对比白色导线 + 荧光发光 */
.main-topology-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 白银色高对比导线 */
.main-topology-svg line,
.main-topology-svg path {
  stroke: #ffffff;
}

/* 电流流动动画：鲜艳荧光翠绿发光 */
@keyframes wireFlow {
  from {
    stroke-dashoffset: 20;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.wire-active-flow {
  stroke: #22c55e !important;
  stroke-width: 2.8 !important;
  stroke-dasharray: 6 3;
  animation: wireFlow 0.8s linear infinite;
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.8));
}

/* 压摆整形方块 [/‾] */
.svg-slew-box rect {
  fill: #32353a !important;
  stroke: #64748b !important;
}

.svg-slew-box path {
  stroke: #ffffff !important;
}

/* 滤波阶跃符号方块 */
.svg-filter-box rect {
  fill: #32353a !important;
  stroke: #64748b !important;
}

.svg-filter-box path {
  stroke: #ffffff !important;
}

/* ================= 5. 控件卡片与胶囊输入框 ================= */
.card-box {
  position: absolute;
  background: rgba(38, 41, 46, 0.95);
  border: 1px solid #4a4e56;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  z-index: 10;
  color: #ffffff;
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
  color: #ffffff;
  letter-spacing: 0.02em;
}

.tag-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.tag-blue {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.tag-indigo {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.4);
}

.card-body {
  background: #1f2124;
  border: 1px solid #36393f;
  border-radius: 4px;
  padding: 10px 12px;
}

.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #e2e8f0;
}

.param-divider {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #33363b;
}

.param-label {
  font-weight: 600;
  color: #cbd5e1;
}

.param-value-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sub-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.unit {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

/* 1. Source Current Limit 卡片 */
.source-limit-card {
  left: 24px;
  top: 24px;
  width: 340px;
  border: 1.5px solid #3b82f6;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(59, 130, 246, 0.2);
}

/* 2. Sink Current Limit 卡片 */
.sink-limit-card {
  left: 24px;
  top: 180px;
  width: 340px;
  border: 1.5px solid #6366f1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(99, 102, 241, 0.2);
}

/* 3. Meter Reading 回读框 */
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
  color: #ffffff;
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
  background: #1a2230 !important;
  color: #38bdf8 !important;
  border: 1.5px solid #0284c7 !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(56, 189, 248, 0.25);
  text-align: right;
  padding: 0 6px;
  border-radius: 4px;
}

.reading-unit {
  font-size: 12px;
  font-weight: 700;
  font-style: italic;
  color: #38bdf8;
}

/* 4. 采样控制面板 */
.sample-ctrl-card {
  left: 24px;
  top: 475px;
  width: 220px;
  border: 1.5px solid #3b82f6;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
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
  background-color: #64748b;
}

.led-busy {
  background-color: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}

.led-pulse-green {
  background-color: #22c55e;
  animation: pulseLed 0.8s infinite;
}

@keyframes pulseLed {
  0%, 100% {
    opacity: 1;
    filter: drop-shadow(0 0 6px #22c55e);
  }
  50% {
    opacity: 0.3;
  }
}

.led-text {
  font-weight: 700;
}

.text-ready {
  color: #94a3b8;
}

.text-busy {
  color: #fbbf24;
}

.text-looping {
  color: #4ade80;
}

.btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid #33363b;
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
  color: #e2e8f0;
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
  color: #e2e8f0;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-bold {
  font-weight: 700;
  color: #e2e8f0;
}

/* 7. 通道配置与运行模式联合主控区 */
.channel-master-bar {
  position: absolute;
  left: 390px;
  top: 20px;
  right: 24px;
  background: rgba(33, 36, 40, 0.95);
  border: 1px solid #484c54;
  border-radius: 6px;
  padding: 8px 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
  color: #ffffff;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-label {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
}

.pin-select {
  width: 110px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #60a5fa !important;
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
  background-color: #44474e;
}

.dib-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
  white-space: nowrap;
}

.dib-badge {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  color: #38bdf8;
  background: #1e293b;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid #0284c7;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.2);
}

/* 8. 中央控制圆 (Source Voltage Hub) 科技暗化 */
.purple-circle-hub {
  position: absolute;
  left: 430px;
  top: 120px;
  width: 176px;
  height: 176px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, rgba(24, 24, 38, 0.95) 100%);
  border: 2px solid #a855f7;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: #ffffff;
  z-index: 10;
}

.hub-title {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.02em;
  margin-bottom: 6px;
  color: #e9d5ff;
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
  color: #e2e8f0;
}

.hub-label {
  font-weight: 700;
  color: #c084fc;
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
  color: #f3e8ff;
  background: rgba(147, 51, 234, 0.25);
  padding: 2px 10px;
  border-radius: 4px;
  border: 1px solid #a855f7;
  transition: all 0.15s ease;
}

.gate-toggle-box:hover {
  background: rgba(147, 51, 234, 0.4);
}

/* ================= 6. 通用暗黑控件样式 (完全匹配照片风格) ================= */
.ate-input {
  background: #383b40;
  border: 1px solid #52565c;
  color: #ffffff;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  text-align: right;
  padding: 3px 8px;
  font-size: 12px;
  border-radius: 4px;
  outline: none;
  width: 80px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.ate-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 1px #38bdf8, inset 0 1px 2px rgba(0, 0, 0, 0.35);
}

/* ================= 6. 通用暗黑控件与 el-select 定制样式 ================= */
:deep(.ate-el-select) {
  display: inline-flex;
  vertical-align: middle;
}

:deep(.ate-el-select .el-select__wrapper) {
  background-color: #383b40 !important;
  box-shadow: 0 0 0 1px #52565c inset !important;
  border-radius: 4px;
  min-height: 22px !important;
  height: 22px !important;
  padding: 0 6px !important;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s ease;
}

:deep(.ate-el-select .el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #64748b inset !important;
}

:deep(.ate-el-select .el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px #38bdf8 inset, 0 0 6px rgba(56, 189, 248, 0.4) !important;
}

:deep(.ate-el-select .el-select__selected-item) {
  color: #ffffff !important;
  font-size: 12px;
  font-weight: 600;
  line-height: 22px;
}

:deep(.ate-el-select.pin-select .el-select__selected-item) {
  color: #60a5fa !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

:deep(.ate-el-select.font-mono .el-select__selected-item) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

:deep(.ate-el-select .el-select__placeholder) {
  color: #94a3b8 !important;
  font-size: 12px;
}

:deep(.ate-el-select .el-select__caret) {
  color: #94a3b8 !important;
  font-size: 11px;
}

.site-select {
  width: 60px;
}

.range-select {
  width: 75px;
}

.filter-select {
  width: 80px;
}

/* 全局暗黑下拉浮层风格 (适配 Element Plus Popper) */
:global(.ate-dark-popper.el-popper) {
  background: #25282c !important;
  border: 1px solid #484c54 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
  border-radius: 6px !important;
  padding: 4px 0 !important;
}

:global(.ate-dark-popper .el-select-dropdown__item) {
  color: #e2e8f0 !important;
  font-size: 12px !important;
  padding: 0 10px !important;
  height: 26px !important;
  line-height: 26px !important;
  border-radius: 3px;
  margin: 1px 4px;
}

:global(.ate-dark-popper .el-select-dropdown__item.is-hovering) {
  background-color: #383b40 !important;
  color: #38bdf8 !important;
}

:global(.ate-dark-popper .el-select-dropdown__item.is-selected) {
  background-color: rgba(56, 189, 248, 0.18) !important;
  color: #38bdf8 !important;
  font-weight: 700 !important;
}

:global(.ate-dark-popper .el-popper__arrow::before) {
  background: #25282c !important;
  border-color: #484c54 !important;
}

.text-emerald {
  color: #4ade80 !important;
}

.text-blue {
  color: #60a5fa !important;
}

.w-14 {
  width: 56px;
}

.w-16 {
  width: 64px;
}

/* 暗色按键 */
.ate-btn {
  background: #2e3136;
  border: 1px solid #484c54;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.ate-btn:hover {
  background: #3b3f46;
  border-color: #64748b;
}

.ate-btn:active {
  background: #222428;
  transform: translateY(1px);
}

.read-btn {
  color: #38bdf8;
  border-color: #0284c7;
}

.read-btn:hover {
  background: #0c4a6e;
  color: #ffffff;
}

.active-loop {
  background: #16a34a !important;
  color: #ffffff !important;
  border-color: #22c55e !important;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.6) !important;
}

.mb-2 {
  margin-bottom: 8px;
}

/* ================= 7. 底部状态栏 ================= */
.ate-footer {
  background-color: #1f2124;
  border-top: 1px solid #33363b;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-title {
  font-weight: 700;
  color: #ffffff;
}

.status-msg {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #38bdf8;
  font-weight: 600;
}

.footer-right {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}
</style>
