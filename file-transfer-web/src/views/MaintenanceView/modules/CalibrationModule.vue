<template>
  <div class="calibration-container" ref="calContainerRef">
    <!-- 左侧：可选板卡 & 待勾选 test instance 测试项树 (独立左栏) -->
    <div v-if="viewConfig.showTree" class="board-tree-panel">
        <div class="panel-header">
          <span class="panel-header-title">System Boards</span>
          <el-tag size="small" type="info" round effect="light">{{ selectedCount }} 选定</el-tag>
        </div>

        <!-- 搜索过滤 (Element Plus) -->
        <div class="tree-search-bar">
          <el-input
            :model-value="searchQuery"
            @update:model-value="emit('update:searchQuery', $event)"
            placeholder="过滤板卡或测试项..."
            size="small"
            clearable
            :prefix-icon="Search"
          />
        </div>

        <!-- 树形层级勾选列表 -->
        <div class="tree-scroll-area">
          <template v-for="node in filteredLeftTree" :key="node.id">
            <div class="tree-node-wrapper">
              <!-- 板卡节点 / 父分组 / 叶子项 -->
              <div
                class="tree-row"
                :style="{ paddingLeft: `${node.depth * 14 + 6}px` }"
                @click="handleTreeNodeClick(node)"
              >
                <button
                  v-if="node.hasChildren"
                  class="tree-box-btn"
                  @click.stop="emit('toggleLeftExpand', node)"
                  :title="node.expanded ? '折叠' : '展开'"
                >
                  {{ node.expanded ? '-' : '+' }}
                </button>
                <span v-else class="tree-box-spacer"></span>

                <el-checkbox
                  :model-value="node.checked"
                  :indeterminate="node.indeterminate"
                  size="small"
                  class="tree-node-checkbox"
                  @click.stop
                  @change="emit('changeCheckbox', node, Boolean($event))"
                />

                <span class="tree-node-icon">
                  <span v-if="node.type === 'board'" class="icon-square-indigo"></span>
                  <span v-else-if="node.type === 'group'" class="icon-square-amber"></span>
                  <span v-else class="icon-dot-slate"></span>
                </span>

                <span
                  class="tree-node-label"
                  :class="{
                    'is-board': node.type === 'board',
                    'is-group': node.type === 'group',
                    'is-item': node.type === 'item'
                  }"
                >
                  {{ node.name }}
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- 底部选择项统计与提示 -->
        <div class="panel-footer">
          <span>待执行测试项: <strong class="text-primary">{{ selectedCount }}</strong> 项</span>
          <span class="footer-tip">调度: generic_tp.so</span>
        </div>
      </div>

      <!-- 右侧：工作主区 (监控表格 + 输出日志控制台) -->
      <div class="cal-right-section">
        <!-- 上半部分：运行状态监控表格 (Element Plus Tree Table) -->
        <div v-if="viewConfig.showTable" class="monitor-table-panel">
          <div class="table-container">
            <el-table
              :data="tableTreeData"
              row-key="id"
              size="small"
              border
              stripe
              height="100%"
              default-expand-all
              :tree-props="{ children: 'children' }"
              @expand-change="handleExpandChange"
              class="monitor-el-table"
            >
              <!-- 树节点名称列 -->
              <el-table-column
                prop="name"
                label="Board / ID / Slot / Module"
                min-width="260"
              >
                <template #default="{ row }">
                  <div class="table-name-cell">
                    <span
                      class="status-indicator-dot"
                      :class="getStatusDotClass(row.status)"
                    ></span>
                    <span
                      class="row-label"
                      :class="{
                        'is-board-row': row.children && row.children.length > 0,
                        'is-item-row': !row.children || row.children.length === 0
                      }"
                    >
                      {{ row.name }}
                    </span>
                  </div>
                </template>
              </el-table-column>

              <!-- 状态列 (Element Plus Tags) -->
              <el-table-column
                prop="status"
                label="Status"
                width="120"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag
                    v-if="row.status === 'OK'"
                    type="success"
                    size="small"
                    effect="light"
                  >
                    OK
                  </el-tag>
                  <el-tag
                    v-else-if="row.status === 'Not OK'"
                    type="danger"
                    size="small"
                    effect="light"
                  >
                    Not OK
                  </el-tag>
                  <el-tag
                    v-else-if="row.status === 'NT'"
                    type="warning"
                    size="small"
                    effect="light"
                  >
                    NT
                  </el-tag>
                  <el-tag
                    v-else-if="row.status === 'RUNNING...'"
                    type="primary"
                    size="small"
                    effect="dark"
                  >
                    RUNNING
                  </el-tag>
                  <span v-else class="text-slate-400">--</span>
                </template>
              </el-table-column>

              <!-- 温度/电压列 -->
              <el-table-column
                prop="temp"
                label="Temperature"
                width="130"
                align="center"
              >
                <template #default="{ row }">
                  <span class="cell-mono-text">{{ row.temp || '--' }}</span>
                </template>
              </el-table-column>

              <!-- 日期列 -->
              <el-table-column
                prop="date"
                label="Date"
                width="180"
                align="center"
              >
                <template #default="{ row }">
                  <span class="cell-mono-text">{{ row.date || '--' }}</span>
                </template>
              </el-table-column>

              <!-- 下次日期列 -->
              <el-table-column
                prop="nextDate"
                label="Next Date"
                width="140"
                align="center"
              >
                <template #default="{ row }">
                  <span class="cell-mono-text">{{ row.nextDate || '--' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

        <!-- 状态统计栏 (Element Plus Tags) -->
        <div class="panel-footer table-footer">
          <div class="stat-group">
            <el-tag size="small" type="success" effect="plain" class="stat-el-tag">
              Passed / OK: <strong>{{ statCounts.passed }}</strong>
            </el-tag>
            <el-tag size="small" type="danger" effect="plain" class="stat-el-tag">
              Not OK / Failed: <strong>{{ statCounts.failed }}</strong>
            </el-tag>
            <el-tag size="small" type="warning" effect="plain" class="stat-el-tag">
              NT / Pending: <strong>{{ statCounts.nt }}</strong>
            </el-tag>
          </div>
          <div class="footer-tip">调用方式: 系统内置直调</div>
        </div>
      </div>

      <!-- 下半部分：输出日志控制台 (支持向上/向下拉伸与边界约束) -->
      <LogConsolePanel
        v-if="viewConfig.showConsole"
        :log-list="logList"
        :is-running="isRunning"
        :sys-status-text="sysStatusText"
        :sys-status-class="sysStatusClass"
        :console-height="consoleHeight"
        :auto-scroll="autoScroll"
        @update:console-height="emit('update:consoleHeight', $event)"
        @update:auto-scroll="emit('update:autoScroll', $event)"
        @clear-logs="emit('clearLogs')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import type {
  TreeNodeItem,
  FlattenedLeftNode,
  RightGridNode,
  LogEntry
} from '../types'
import LogConsolePanel from '../components/LogConsolePanel.vue'

interface Props {
  viewConfig: {
    showTree: boolean
    showTable: boolean
    showConsole: boolean
  }
  leftTreeData: TreeNodeItem[]
  rightTreeData: RightGridNode[]
  logList: LogEntry[]
  isRunning: boolean
  sysStatusText: string
  sysStatusClass: string
  consoleHeight: number
  autoScroll: boolean
  searchQuery: string
  selectedCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:consoleHeight', val: number): void
  (e: 'update:autoScroll', val: boolean): void
  (e: 'update:searchQuery', val: string): void
  (e: 'toggleLeftExpand', node: TreeNodeItem): void
  (e: 'changeCheckbox', node: TreeNodeItem, checked: boolean): void
  (e: 'toggleRightExpand', row: RightGridNode): void
  (e: 'clearLogs'): void
}>()

const calContainerRef = ref<HTMLElement | null>(null)

// 扁平化左侧树
const filteredLeftTree = computed<FlattenedLeftNode[]>(() => {
  const result: FlattenedLeftNode[] = []
  const q = props.searchQuery.trim().toLowerCase()

  function matchesQuery(node: TreeNodeItem): boolean {
    if (!q) return true
    if (node.name.toLowerCase().includes(q)) return true
    if (node.children) {
      return node.children.some(child => matchesQuery(child))
    }
    return false
  }

  function walk(node: TreeNodeItem, depth: number) {
    if (!matchesQuery(node)) return

    const hasChildren = !!(node.children && node.children.length > 0)
    result.push({
      ...node,
      depth,
      hasChildren
    })

    if (hasChildren && (node.expanded || q !== '')) {
      node.children!.forEach(child => walk(child, depth + 1))
    }
  }

  props.leftTreeData.forEach(root => walk(root, 0))
  return result
})

function handleTreeNodeClick(node: FlattenedLeftNode) {
  if (node.hasChildren) {
    emit('toggleLeftExpand', node)
  } else {
    emit('changeCheckbox', node, !node.checked)
  }
}

function handleExpandChange(row: RightGridNode) {
  emit('toggleRightExpand', row)
}

// 树表格数据 (带父级动态状态汇总)
const tableTreeData = computed<RightGridNode[]>(() => {
  function computeTree(nodes: RightGridNode[]): RightGridNode[] {
    return nodes.map(node => {
      let children: RightGridNode[] | undefined
      let status = node.status
      let date = node.date

      if (node.children && node.children.length > 0) {
        children = computeTree(node.children)
        let anyFail = false
        let anyRunning = false
        let allPass = true

        children.forEach(c => {
          if (c.status === 'RUNNING...') anyRunning = true
          if (c.status === 'Not OK' || c.status === 'F') anyFail = true
          if (c.status !== 'OK' && c.status !== 'P') allPass = false
        })

        if (anyRunning) status = 'RUNNING...'
        else if (anyFail) status = 'Not OK'
        else if (allPass) status = 'OK'
        else status = 'NT'

        const childWithDate = children.filter(c => c.date).slice(-1)[0]
        if (childWithDate) date = childWithDate.date
      }

      return {
        ...node,
        status,
        date,
        children
      }
    })
  }

  return computeTree(props.rightTreeData)
})

// 统计信息
const statCounts = computed(() => {
  let passed = 0
  let failed = 0
  let nt = 0
  function walk(node: RightGridNode) {
    if (!node.children || node.children.length === 0) {
      if (node.status === 'P' || node.status === 'OK') passed++
      else if (node.status === 'Not OK' || node.status === 'F' || node.status.includes('M, ND')) failed++
      else if (node.status === 'NT') nt++
    } else {
      node.children.forEach(walk)
    }
  }
  props.rightTreeData.forEach(walk)
  return { passed, failed, nt }
})

function getStatusDotClass(status: string) {
  if (status === 'Not OK' || status?.includes('M, ND') || status === 'F') return 'dot-fail'
  if (status === 'OK' || status === 'P') return 'dot-ok'
  if (status === 'NT') return 'dot-nt'
  if (status === 'RUNNING...') return 'dot-running'
  return 'dot-slate'
}
</script>

<style scoped>
*, *::before, *::after {
  transition: none !important;
  -webkit-transition: none !important;
  animation: none !important;
  -webkit-animation: none !important;
  box-sizing: border-box;
}

:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* ================= Calibration 核心视图 ================= */
.calibration-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 8px;
  overflow: hidden;
  height: 100%;
}

/* 右侧工作主区 (监控表格 + 输出日志控制台) */
.cal-right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  min-width: 0;
}

/* 左侧板卡树面板 */
.board-tree-panel {
  width: 320px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  height: 100%;
}
.panel-header {
  background-color: #f1f5f9;
  color: #334155;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-header-title {
  font-size: 13px;
  font-weight: 600;
}
.badge-total {
  font-size: 12px;
  background-color: #e2e8f0;
  color: #475569;
  padding: 2px 8px;
  border-radius: 4px;
}
.tree-search-bar {
  padding: 6px;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  display: flex;
  align-items: center;
}
.tree-search-input {
  width: 100%;
  font-size: 13px;
  padding: 5px 8px;
  padding-right: 24px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  outline: none;
}
.tree-search-input:focus {
  border-color: #2563eb;
}
.clear-search-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
}
.tree-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 6px 4px;
}
.tree-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 6px;
  cursor: pointer;
  border-radius: 4px;
}
.tree-row:hover {
  background-color: #f1f5f9;
}
.tree-box-btn {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #94a3b8;
  background-color: #ffffff;
  color: #334155;
  font-size: 12px;
  line-height: 1;
  font-family: inherit;
  font-weight: bold;
  border-radius: 2px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
}
.tree-box-btn:hover {
  border-color: #1e40af;
  color: #1e40af;
  background-color: #eff6ff;
}
.tree-box-spacer {
  width: 14px;
  height: 14px;
  display: inline-block;
  flex-shrink: 0;
}
.tree-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
  border-radius: 2px;
  border: 1px solid #94a3b8;
}
.tree-node-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 2px;
}
.icon-square-indigo {
  width: 8px;
  height: 8px;
  background-color: #6366f1;
  border-radius: 2px;
  display: inline-block;
}
.icon-square-amber {
  width: 7px;
  height: 7px;
  background-color: #f59e0b;
  border-radius: 2px;
  display: inline-block;
}
.icon-dot-slate {
  width: 5px;
  height: 5px;
  background-color: #94a3b8;
  border-radius: 50%;
  display: inline-block;
}
.tree-node-label {
  font-size: 13px;
  color: #334155;
}
.tree-node-label.is-board {
  font-weight: 700;
  color: #0f172a;
}
.tree-node-label.is-group {
  font-weight: 600;
  color: #334155;
}
.panel-footer {
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  flex-shrink: 0;
}
.footer-tip {
  color: #94a3b8;
}

/* 右侧表格面板 */
.monitor-table-panel {
  flex: 1;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 120px;
}
.table-container {
  flex: 1;
  overflow: hidden;
  height: 100%;
}
.table-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cell-mono-text {
  font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Consolas", Menlo, Courier, monospace;
  font-size: 12px;
}
:deep(.monitor-el-table th.el-table__cell) {
  background-color: #f1f5f9;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
}
:deep(.monitor-el-table .el-table__cell) {
  padding: 6px 0;
}
.status-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.dot-ok {
  background-color: #10b981;
}
.dot-fail {
  background-color: #ef4444;
}
.dot-nt {
  background-color: #f59e0b;
}
.dot-running {
  background-color: #3b82f6;
}
.dot-slate {
  background-color: #94a3b8;
}

.row-label {
  color: #334155;
}
.row-label.is-board-row {
  font-weight: 700;
  color: #0f172a;
}
.row-label.is-group-row {
  font-weight: 600;
  color: #334155;
}
.row-label.is-clickable:hover {
  color: #2563eb;
  cursor: pointer;
}

.status-badge-ok {
  color: #047857;
  font-weight: 700;
}
.status-badge-fail {
  color: #dc2626;
  font-weight: 700;
}
.status-badge-nt {
  color: #b45309;
  font-weight: 600;
}
.status-badge-running {
  color: #2563eb;
  font-weight: 700;
}
.status-badge-idle {
  color: #94a3b8;
}

.table-footer {
  justify-content: space-between;
}
.stat-group {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}
.stat-item strong {
  margin-left: 2px;
}

/* 颜色工具类 */
.text-primary { color: #2563eb !important; }
.text-success { color: #10b981 !important; }
.text-danger { color: #ef4444 !important; }
.text-amber { color: #f59e0b !important; }
.text-blue { color: #3b82f6 !important; }
.text-slate-300 { color: #cbd5e1 !important; }
.text-slate-400 { color: #94a3b8 !important; }
.text-slate-500 { color: #64748b !important; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
</style>
