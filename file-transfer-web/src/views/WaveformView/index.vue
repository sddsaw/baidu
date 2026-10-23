<template>
  <div class="waveform-view-container">
    <!-- 顶部操作与元数据栏 -->
    <div class="view-header-bar">
      <div class="header-left">
        <div class="title-wrap">
          <el-icon :size="20" color="#409EFF" style="margin-right: 8px"><Monitor /></el-icon>
          <h2 class="view-title">数字仿真波形分析平台</h2>
          <el-tag type="info" size="small" effect="plain" round>VCD 高性能解析引擎</el-tag>
        </div>

        <div class="metadata-tags" v-if="metadata">
          <el-tag type="success" effect="dark" size="small" v-if="metadata.engine">
            <el-icon style="margin-right: 4px"><Cpu /></el-icon>
            {{ metadata.engine }}
          </el-tag>
          <el-tag type="info" size="small" v-if="metadata.parseDuration !== undefined">
            ⚡ 耗时: {{ metadata.parseDuration }}ms
          </el-tag>
          <el-tag type="success" size="small">
            <el-icon><Document /></el-icon> {{ metadata.fileName }}
          </el-tag>
          <el-tag type="info" size="small" v-if="metadata.fileSize">
            {{ formatFileSize(metadata.fileSize) }}
          </el-tag>
          <el-tag type="warning" size="small">
            周期: {{ metadata.minTime }} ~ {{ metadata.maxTime }} {{ metadata.timeUnit }}
          </el-tag>
          <el-tag type="primary" size="small">
            信号总数: {{ metadata.signalCount }}
          </el-tag>
        </div>
      </div>

      <div class="header-right">
        <!-- 上传 VCD 文件 -->
        <input
          ref="fileInputRef"
          type="file"
          accept=".vcd"
          style="display: none"
          @change="handleFileChange"
        />
        <el-button
          type="primary"
          :icon="Upload"
          :loading="parsing"
          @click="triggerFileSelect"
        >
          上传 VCD 文件 (支持 50~100M)
        </el-button>

        <!-- 体验示例波形按钮 -->
        <el-button
          type="success"
          plain
          :icon="Cpu"
          :loading="parsing"
          @click="loadDemoWaveform"
        >
          加载芯片仿真示例
        </el-button>

        <el-divider direction="vertical" />

        <el-button
          :icon="sidebarVisible ? Fold : Expand"
          circle
          @click="sidebarVisible = !sidebarVisible"
          :title="sidebarVisible ? '折叠信号树' : '展开信号树'"
        />
      </div>
    </div>

    <!-- 解析进度条提示 (大文件专用) -->
    <div class="parsing-progress-banner" v-if="parsing">
      <div class="progress-info">
        <span class="loading-spin"></span>
        <span class="progress-text">{{ parseMessage }}</span>
      </div>
      <el-progress
        :percentage="parsePercent"
        :stroke-width="6"
        status="success"
        style="width: 280px"
      />
    </div>

    <!-- 主展示工作区 -->
    <div class="view-workspace">
      <!-- 左侧：VaporView 原生网络表树 (NETLIST) 与 已显示信号 (DISPLAYED SIGNALS) -->
      <transition name="sidebar-slide">
        <aside class="sidebar-panel" v-show="sidebarVisible">
          <div class="sidebar-header">
            <el-input
              v-model="searchQuery"
              placeholder="搜索信号名称或路径..."
              clearable
              size="small"
              :prefix-icon="Search"
            />
          </div>

          <div class="sidebar-content">
            <!-- 1. NETLIST 树状网络表（虚拟滚动树，针对 60MB~100MB+ 大文件秒级渲染无卡顿） -->
            <div class="netlist-section">
              <div class="section-header">
                <span class="section-title">NETLIST</span>
                <div class="section-actions" v-if="allSignalsList.length > 0">
                  <span class="section-badge">{{ allSignalsList.length }} 信号</span>
                  <el-button
                    link
                    size="small"
                    class="tree-act-btn"
                    @click="toggleExpandAll"
                    :title="isAllExpanded ? '折叠全部模块' : '展开全部模块'"
                  >
                    {{ isAllExpanded ? '折叠' : '展开' }}
                  </el-button>
                </div>
              </div>
              <div class="netlist-tree-container" ref="treeContainerRef">
                <el-tree-v2
                  ref="netlistTreeRef"
                  v-if="netlistTreeData.length > 0"
                  :data="netlistTreeData"
                  :props="netlistTreeProps"
                  :height="treeHeight"
                  :item-size="28"
                  :filter-method="filterNetlistNode"
                  :default-expanded-keys="defaultExpandedKeys"
                  highlight-current
                >
                  <template #default="{ data }">
                    <div class="netlist-node-row" :class="{ 'is-signal': data.isSignal, 'is-scope': data.isScope }">
                      <!-- 信号复选框直接在树上勾选实时展示 -->
                      <el-checkbox
                        v-if="data.isSignal"
                        :model-value="activeSignalIds.has(data.id)"
                        @change="toggleSignalNode(data)"
                        @click.stop
                      />

                      <!-- 专属 EDA 图标 (Scope / Wire / Bus) -->
                      <span class="node-icon">
                        <span v-if="data.isScope" class="icon-scope">📁</span>
                        <span v-else-if="data.size > 1" class="icon-bus">[ ]</span>
                        <span v-else class="icon-wire">⚬—⚬</span>
                      </span>

                      <!-- 名称与位宽 -->
                      <span class="node-name" :title="data.fullName">{{ data.name }}</span>
                      <span class="node-bits" v-if="data.size > 1">[{{ data.size - 1 }}:0]</span>
                    </div>
                  </template>
                </el-tree-v2>
                <div class="empty-tip" v-else>暂无网络表层级</div>
              </div>
            </div>

            <!-- 2. DISPLAYED SIGNALS (已显示在波形区的信号列表) -->
            <div class="displayed-signals-section">
              <div class="section-header clickable" @click="displayedSignalsCollapsed = !displayedSignalsCollapsed">
                <span class="section-title">
                  <el-icon class="collapse-arrow" :class="{ collapsed: displayedSignalsCollapsed }"><ArrowDown /></el-icon>
                  DISPLAYED SIGNALS
                </span>
                <span class="section-badge">{{ activeSignals.length }}</span>
              </div>

              <div class="displayed-signals-scroll" v-show="!displayedSignalsCollapsed">
                <el-scrollbar class="dark-scrollbar">
                  <div
                    v-for="sig in activeSignals"
                    :key="sig.id"
                    class="displayed-signal-item"
                    :class="{ active: selectedSignalId === sig.id }"
                    @click="selectedSignalId = sig.id"
                  >
                    <el-checkbox
                      :model-value="true"
                      @change="removeActiveSignal(sig.id)"
                      @click.stop
                    />
                    <span class="node-icon">
                      <span v-if="sig.size > 1" class="icon-bus">[ ]</span>
                      <span v-else class="icon-wire">⚬—⚬</span>
                    </span>
                    <span class="sig-name" :title="sig.fullName">{{ sig.name }}</span>
                    <span class="node-bits" v-if="sig.size > 1">[{{ sig.size - 1 }}:0]</span>
                  </div>
                  <div class="empty-tip" v-if="activeSignals.length === 0">
                    尚未添加波形信号，请在上方勾选
                  </div>
                </el-scrollbar>
              </div>
            </div>
          </div>
        </aside>
      </transition>

      <!-- 右侧：波形渲染核心 Canvas -->
      <main class="waveform-main-area">
        <template v-if="metadata && activeSignals.length > 0">
          <WaveformCanvas
            :metadata="metadata"
            :active-signals="activeSignals"
            :selected-signal-id="selectedSignalId"
            @update:selected-signal-id="selectedSignalId = $event"
            @remove-signal="removeActiveSignal"
          />
        </template>

        <!-- 空状态：引导用户上传文件或加载示例 -->
        <div class="empty-state-card" v-else-if="!parsing">
          <div class="drop-zone" @dragover.prevent @drop.prevent="handleFileDrop">
            <el-icon :size="64" color="#409eff" class="pulse-icon"><TrendCharts /></el-icon>
            <h3>拖拽 .vcd 仿真文件至此，或点击上方按钮加载</h3>
            <p class="sub-text">
              底层采用 WebAssembly / Web Worker 异步引擎，支持 <strong>50MB ~ 100MB</strong> 超大 VCD 文件零拷贝极速流式解析
            </p>
            <div class="quick-actions">
              <el-button type="primary" :icon="Upload" @click="triggerFileSelect">选择本地文件</el-button>
              <el-button type="success" plain :icon="Cpu" @click="loadDemoWaveform">体验 RISC-V 芯片示例波形</el-button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Monitor,
  Document,
  Upload,
  Cpu,
  Fold,
  Expand,
  Search,
  TrendCharts,
  ArrowDown
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import WaveformCanvas from './components/WaveformCanvas.vue'
import VcdParserWorker from './workers/vcdParser.worker.ts?worker'
import type { VcdMetadata, VcdScopeNode, VcdSignal, VcdSignalData, NetlistTreeNode } from './types'

// 引用与状态
const fileInputRef = ref<HTMLInputElement | null>(null)
const sidebarVisible = ref(true)
const parsing = ref(false)
const parsePercent = ref(0)
const parseMessage = ref('正在准备解析...')
const searchQuery = ref('')
const displayedSignalsCollapsed = ref(false)
const selectedSignalId = ref<string | null>(null)
const netlistTreeRef = ref<any>(null)
const treeContainerRef = ref<HTMLDivElement | null>(null)
const treeHeight = ref(400)
const isAllExpanded = ref(false)

// 数据模型
const metadata = ref<VcdMetadata | null>(null)
const rootScopeNode = ref<VcdScopeNode | null>(null)
const allSignalsList = ref<VcdSignal[]>([])
const allSignalsData = ref<VcdSignalData[]>([])
const activeSignalIds = ref<Set<string>>(new Set())

// Worker 实例
let parserWorker: Worker | null = null

const netlistTreeProps = {
  value: 'id',
  label: 'name',
  children: 'children'
}

const defaultExpandedKeys = computed(() => {
  if (netlistTreeData.value.length === 0) return []
  // 默认展开顶层模块，避免几十兆大文件所有子模块全展开导致渲染阻塞
  return netlistTreeData.value.map(n => n.id)
})

const updateTreeHeight = () => {
  if (treeContainerRef.value) {
    const h = treeContainerRef.value.clientHeight
    if (h > 60) {
      treeHeight.value = h
    }
  }
}

const toggleExpandAll = () => {
  if (!netlistTreeRef.value) return
  if (isAllExpanded.value) {
    netlistTreeRef.value.setExpandedKeys(defaultExpandedKeys.value)
    isAllExpanded.value = false
  } else {
    const allKeys: string[] = []
    const collectKeys = (nodes: NetlistTreeNode[]) => {
      for (const node of nodes) {
        if (node.isScope && node.children && node.children.length > 0) {
          allKeys.push(node.id)
          collectKeys(node.children)
        }
      }
    }
    collectKeys(netlistTreeData.value)
    netlistTreeRef.value.setExpandedKeys(allKeys)
    isAllExpanded.value = true
  }
}

// 构建 VaporView 原生网络表层级树 (Scopes + Signals 树中融合)
const netlistTreeData = computed<NetlistTreeNode[]>(() => {
  if (!rootScopeNode.value) return []

  function buildNode(scope: VcdScopeNode): NetlistTreeNode {
    const children: NetlistTreeNode[] = []

    // 1. 先加入子模块 (sub-scopes)
    if (scope.children && scope.children.length > 0) {
      for (const childScope of scope.children) {
        children.push(buildNode(childScope))
      }
    }

    // 2. 再加入当前模块下的信号 (signals)
    if (scope.signals && scope.signals.length > 0) {
      for (const sig of scope.signals) {
        const sigNode: NetlistTreeNode = {
          id: sig.fullName,
          name: sig.name,
          fullName: sig.fullName,
          isScope: false,
          isSignal: true,
          size: sig.size,
          type: sig.type,
          signalId: sig.netId || sig.id,
          children: []
        }
        // 如果是多位总线向量，展开子位 (如 [0], [1], [2]...)
        if (sig.size > 1 && sig.size <= 32) {
          for (let b = sig.size - 1; b >= 0; b--) {
            sigNode.children!.push({
              id: `${sig.fullName}[${b}]`,
              name: `[${b}]`,
              fullName: `${sig.fullName}[${b}]`,
              isScope: false,
              isSignal: false,
              size: 1,
              type: 'wire'
            })
          }
        }
        children.push(sigNode)
      }
    }

    return {
      id: `scope_${scope.fullName}`,
      name: scope.name,
      fullName: scope.fullName,
      isScope: true,
      isSignal: false,
      size: 0,
      children
    }
  }

  if (rootScopeNode.value.children.length > 0) {
    return rootScopeNode.value.children.map(buildNode)
  }
  return [buildNode(rootScopeNode.value)]
})

// 树节点搜索过滤
const filterNetlistNode = (value: string, data: NetlistTreeNode) => {
  if (!value) return true
  const q = value.toLowerCase()
  return data.name.toLowerCase().includes(q) || data.fullName.toLowerCase().includes(q)
}

watch(searchQuery, (val) => {
  netlistTreeRef.value?.filter(val)
})

// 处于激活展示状态的波形数据
const activeSignals = computed<VcdSignalData[]>(() => {
  return allSignalsData.value.filter(s => activeSignalIds.value.has(s.id))
})

// 在 NETLIST 树中勾选/取消勾选单个信号
const toggleSignalNode = (node: NetlistTreeNode) => {
  if (activeSignalIds.value.has(node.id)) {
    activeSignalIds.value.delete(node.id)
  } else {
    activeSignalIds.value.add(node.id)
    selectedSignalId.value = node.id
  }
}

// 移除单个波形信号
const removeActiveSignal = (id: string) => {
  activeSignalIds.value.delete(id)
}

// 触发文件选择
const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

// 文件大小格式化
const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

// 处理本地文件上传
const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    processVcdFile(file)
  }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// 处理拖拽文件
const handleFileDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    processVcdFile(file)
  }
}

// 执行 VCD 文件读取并零拷贝传给 Worker
const processVcdFile = async (file: File) => {
  if (!file.name.toLowerCase().endsWith('.vcd')) {
    ElMessage.error('请上传扩展名为 .vcd 的仿真波形文件！')
    return
  }

  parsing.value = true
  parsePercent.value = 5
  parseMessage.value = `正在加载文件 (${formatFileSize(file.size)})...`

  try {
    const buffer = await file.arrayBuffer()
    parsePercent.value = 15
    parseMessage.value = '正在将数据转移至 Web Worker 进行异步解析...'

    // 零拷贝传输 ArrayBuffer
    parserWorker?.postMessage(
      {
        type: 'PARSE_VCD',
        buffer,
        fileName: file.name
      },
      [buffer]
    )
  } catch (err: any) {
    parsing.value = false
    ElMessage.error(`读取文件失败: ${err.message}`)
  }
}

// 加载芯片仿真 Demo
const loadDemoWaveform = () => {
  parsing.value = true
  parsePercent.value = 50
  parseMessage.value = '正在生成 RISC-V SoC 仿真波形示例...'

  setTimeout(() => {
    parserWorker?.postMessage({ type: 'GENERATE_DEMO' })
  }, 100)
}

let treeResizeObserver: ResizeObserver | null = null

// 初始化 Worker 与自适应虚拟树容器
onMounted(() => {
  parserWorker = new VcdParserWorker()

  nextTick(() => {
    updateTreeHeight()
  })

  if (treeContainerRef.value) {
    treeResizeObserver = new ResizeObserver(() => {
      updateTreeHeight()
    })
    treeResizeObserver.observe(treeContainerRef.value)
  }

  parserWorker.onmessage = (e: MessageEvent) => {
    const { type, payload, percent, message, error } = e.data

    if (type === 'PROGRESS') {
      parsePercent.value = percent
      if (message) parseMessage.value = message
    } else if (type === 'PARSE_COMPLETE') {
      parsing.value = false
      metadata.value = payload.metadata
      rootScopeNode.value = payload.rootScope
      allSignalsList.value = payload.signalsList
      allSignalsData.value = payload.signalsData

      // 默认把前 8 个主要信号加入波形展示区
      activeSignalIds.value = new Set(payload.signalsList.slice(0, 8).map((s: VcdSignal) => s.id))
      selectedSignalId.value = payload.signalsList[0]?.id || null

      nextTick(() => {
        updateTreeHeight()
      })

      const dur = payload.metadata?.parseDuration !== undefined ? ` (耗时 ${payload.metadata.parseDuration}ms)` : ''
      const engineName = payload.metadata?.engine || 'wellen.wasm'
      ElMessage.success(`【${engineName}】仿真数据加载完成！${dur}，共解析 ${payload.signalsList.length} 个信号`)
    } else if (type === 'PARSE_ERROR') {
      parsing.value = false
      ElMessage.error(error || '解析失败')
    }
  }

  // 默认启动时自动加载演示波形，让用户第一眼即可体验
  loadDemoWaveform()
})

onUnmounted(() => {
  treeResizeObserver?.disconnect()
  treeResizeObserver = null
  parserWorker?.terminate()
  parserWorker = null
})
</script>

<style scoped>
.waveform-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  width: 100%;
  overflow: hidden;
  background-color: #0f1115;
  border-radius: 0;
  box-shadow: none;
}

.view-header-bar {
  height: 56px;
  background-color: #1a1d24;
  border-bottom: 1px solid #282c34;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.view-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f0f2f5;
}

.metadata-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.parsing-progress-banner {
  background-color: #21252b;
  border-bottom: 1px solid #3e4451;
  padding: 8px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-spin {
  width: 14px;
  height: 14px;
  border: 2px solid #61afef;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-text {
  font-size: 13px;
  color: #abb2bf;
}

.view-workspace {
  flex: 1;
  display: flex;
  height: calc(100% - 56px);
  overflow: hidden;
  position: relative;
}

.sidebar-panel {
  width: 310px;
  background-color: #16181d;
  border-right: 1px solid #282c34;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
}

.sidebar-header {
  padding: 10px 12px;
  border-bottom: 1px solid #282c34;
  background-color: #1a1d24;
}

:deep(.sidebar-header .el-input__wrapper) {
  background-color: #21252b !important;
  box-shadow: 0 0 0 1px #3e4451 inset !important;
  border-radius: 4px;
}

:deep(.sidebar-header .el-input__inner) {
  color: #abb2bf !important;
}

:deep(.sidebar-header .el-input__inner::placeholder) {
  color: #5c6370 !important;
}

:deep(.sidebar-header .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset !important;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100% - 50px);
}

/* 1. NETLIST 树 */
.netlist-section {
  flex: 1.3;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-bottom: 1px solid #282c34;
}

.section-header {
  height: 28px;
  background-color: #1b1e24;
  border-bottom: 1px solid #282c34;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header.clickable {
  cursor: pointer;
  user-select: none;
}

.section-header.clickable:hover {
  background-color: #21252b;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #abb2bf;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.collapse-arrow {
  font-size: 10px;
  transition: transform 0.2s;
  color: #5c6370;
}

.collapse-arrow.collapsed {
  transform: rotate(-90deg);
}

.section-badge {
  font-size: 10px;
  background-color: rgba(255, 255, 255, 0.08);
  color: #7f848e;
  padding: 1px 6px;
  border-radius: 10px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-act-btn {
  font-size: 11px;
  color: #61afef !important;
  padding: 0 !important;
  height: auto !important;
}

.tree-act-btn:hover {
  color: #98c379 !important;
  text-decoration: underline;
}

.netlist-tree-container {
  flex: 1;
  overflow: hidden;
  height: 100%;
}

:deep(.dark-scrollbar) {
  height: 100%;
}

:deep(.dark-scrollbar .el-scrollbar__wrap) {
  overflow-x: hidden;
}

:deep(.netlist-tree-container .el-scrollbar__view) {
  padding: 6px 8px;
}

:deep(.displayed-signals-scroll .el-scrollbar__view) {
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 优化 Element Plus 滚动条暗色风格 */
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

:deep(.el-scrollbar__bar.is-horizontal) {
  height: 6px;
  bottom: 2px;
}

/* 消除 el-tree / el-tree-v2 默认浅色背景与虚拟滚动列表样式 */
:deep(.el-tree),
:deep(.el-tree-v2) {
  background: transparent !important;
  color: #abb2bf !important;
}

:deep(.el-tree-node__content),
:deep(.el-tree-v2__node) {
  height: 28px !important;
  line-height: 28px !important;
  border-radius: 3px;
  padding-right: 4px;
}

:deep(.el-tree-node__content:hover),
:deep(.el-tree-v2__node:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

:deep(.el-tree-node:focus > .el-tree-node__content),
:deep(.el-tree-v2__node.is-current) {
  background-color: rgba(64, 158, 255, 0.15) !important;
}

:deep(.el-vl__wrapper) {
  scrollbar-width: thin;
  scrollbar-color: rgba(121, 121, 121, 0.35) transparent;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: rgba(64, 158, 255, 0.18) !important;
  color: #61afef !important;
}

:deep(.el-tree-node__expand-icon) {
  color: #5c6370 !important;
  font-size: 11px;
}

:deep(.el-tree-node__expand-icon.is-leaf) {
  color: transparent !important;
}

/* Netlist 节点样式 */
.netlist-node-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  overflow: hidden;
  font-size: 12px;
}

/* Netlist 与 Displayed Signals 的 Checkbox 样式定制 */
:deep(.netlist-node-row .el-checkbox),
:deep(.displayed-signal-item .el-checkbox) {
  --el-checkbox-font-size: 12px;
  --el-checkbox-input-width: 14px;
  --el-checkbox-input-height: 14px;
  --el-checkbox-border-radius: 2px;
  --el-checkbox-bg-color: #21252b;
  --el-checkbox-input-border: 1px solid #3e4451;
  --el-checkbox-input-border-color-hover: #409eff;
  --el-checkbox-checked-bg-color: #409eff;
  --el-checkbox-checked-input-border-color: #409eff;
  --el-checkbox-checked-icon-color: #ffffff;
  margin-right: 0;
  height: auto;
  display: inline-flex;
  align-items: center;
}

:deep(.netlist-node-row .el-checkbox__inner),
:deep(.displayed-signal-item .el-checkbox__inner) {
  background-color: #21252b;
  border-color: #3e4451;
  border-radius: 2px;
  width: 14px;
  height: 14px;
}

:deep(.netlist-node-row .el-checkbox:hover .el-checkbox__inner),
:deep(.displayed-signal-item .el-checkbox:hover .el-checkbox__inner) {
  border-color: #409eff;
}

:deep(.netlist-node-row .el-checkbox__input.is-checked .el-checkbox__inner),
:deep(.displayed-signal-item .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

.node-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.icon-scope {
  color: #c678dd;
  font-size: 13px;
}

.icon-wire {
  color: #61afef;
  font-size: 11px;
  font-weight: bold;
}

.icon-bus {
  color: #98c379;
  font-family: monospace;
  font-size: 11px;
  font-weight: bold;
}

.node-name {
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: #abb2bf;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.node-bits {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 11px;
  color: #5c6370;
  margin-left: 4px;
  flex-shrink: 0;
}

/* 2. DISPLAYED SIGNALS */
.displayed-signals-section {
  flex: 1;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #131519;
}

.displayed-signals-scroll {
  flex: 1;
  overflow: hidden;
  height: 100%;
}

.displayed-signal-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.15s;
}

.displayed-signal-item:hover {
  background-color: #21252b;
}

.displayed-signal-item.active {
  background-color: rgba(64, 158, 255, 0.2);
}

.displayed-signal-item .sig-name {
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: #d19a66;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.empty-tip {
  font-size: 12px;
  color: #5c6370;
  text-align: center;
  padding: 24px 0;
}

.waveform-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #181a1f;
}

.empty-state-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.drop-zone {
  max-width: 540px;
  text-align: center;
  border: 2px dashed #3e4451;
  border-radius: 12px;
  padding: 48px 36px;
  background-color: rgba(33, 37, 43, 0.4);
}

.drop-zone h3 {
  color: #f0f2f5;
  margin: 16px 0 8px 0;
  font-size: 18px;
}

.sub-text {
  color: #7f848e;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: all 0.25s ease;
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  width: 0;
  opacity: 0;
}
</style>
