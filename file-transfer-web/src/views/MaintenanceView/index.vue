<template>
  <div class="maintenance-view-page">
    <div class="maintenance-window-wrapper">
      <div class="proxima-app-window" ref="windowRef">
        <!-- 1. 软件原生窗口标题栏 -->
        <!-- <WindowTitleBar
          :is-fullscreen="isFullscreen"
          @toggle-fullscreen="toggleWindowFullscreen"
        /> -->

        <!-- 2. 经典菜单栏 (通过 TS 配置数组驱动循环渲染) -->
        <AppMenuBar
          :view-config="viewConfig"
          :exec-mode="execMode"
          :auto-save-logs="autoSaveLogs"
          @menu-action="onMenuActionItem"
          @toggle-view="onToggleView"
          @set-mode="onSetMode"
          @toggle-autosave="autoSaveLogs = !autoSaveLogs"
        />

        <!-- 3. 经典工控快捷工具栏 -->
        <AppToolBar
          :is-running="isRunning"
          v-model:test-coverage="testCoverage"
          v-model:loop-quantity="loopQuantity"
          @start-execution="startExecution"
          @pause-execution="pauseExecution"
          @stop-execution="stopExecution"
          @expand-all="expandAll"
          @toggle-all-checkboxes="toggleAllCheckboxes"
        />

        <!-- 4. 模块 Tabs 切换栏 (瞬时响应) -->
        <AppTabBar v-model="activeModuleTab" />

        <!-- 5. Tab 主体内容区 -->
        <div class="app-main-viewport">
          <!-- Tab 1: MaintenanceTest (模块组件) -->
          <MaintenanceTestModule v-show="activeModuleTab === 'MaintenanceTest'" />

          <!-- Tab 2: Calibration 主视图 (模块组件) -->
          <CalibrationModule
            v-show="activeModuleTab === 'Calibration'"
            :view-config="viewConfig"
            :left-tree-data="leftTreeData"
            :right-tree-data="rightTreeData"
            :log-list="logList"
            :is-running="isRunning"
            :sys-status-text="sysStatusText"
            :sys-status-class="sysStatusClass"
            v-model:console-height="consoleHeight"
            v-model:auto-scroll="autoScroll"
            v-model:search-query="searchQuery"
            :selected-count="selectedCount"
            @toggle-left-expand="toggleLeftExpand"
            @change-checkbox="handleCheckboxChange"
            @toggle-right-expand="toggleRightExpand"
            @clear-logs="clearLogs"
          />

          <!-- Tab 3: EQM (模块组件) -->
          <EqmModule v-show="activeModuleTab === 'EQM'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { TreeNodeItem, RightGridNode, LogEntry } from './types'
// import WindowTitleBar from './components/WindowTitleBar.vue'
import AppMenuBar, { type MenuItemConfig } from './components/AppMenuBar.vue'
import AppToolBar from './components/AppToolBar.vue'
import AppTabBar from './components/AppTabBar.vue'
import MaintenanceTestModule from './modules/MaintenanceTestModule.vue'
import CalibrationModule from './modules/CalibrationModule.vue'
import EqmModule from './modules/EqmModule.vue'

// --- 引用与基础状态 ---
const windowRef = ref<HTMLElement | null>(null)

const activeModuleTab = ref<'MaintenanceTest' | 'Calibration' | 'EQM'>('Calibration')
const isFullscreen = ref(false)
const autoScroll = ref(true)
const autoSaveLogs = ref(true)
const execMode = ref<'single' | 'loop' | 'halt'>('single')
const testCoverage = ref('Full')
const loopQuantity = ref(1)
const searchQuery = ref('')

const viewConfig = reactive({
  showTree: true,
  showTable: true,
  showConsole: true
})

// 控制台初始高度
const consoleHeight = ref(180)

// 运行状态
const isRunning = ref(false)
const sysStatusText = ref('Calibration Completed')
const sysStatusClass = ref('text-success')
let runIntervalTimer: ReturnType<typeof setInterval> | null = null

// 日志项
let logIdCounter = 1
const logList = ref<LogEntry[]>([
  { id: logIdCounter++, text: 'Validating data for board MIO6...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for test instance MIO6.Cal1...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for sub-module MIO6.Cal1.SubModule 1...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for sub-module MIO6.Cal1.SubModule 2...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for test instance MIO6.Cal2...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: '[WARNING] MIO6.Cal2 parameter at 0.82V out of spec margin. The status is Not OK / Failed.', colorClass: 'text-amber' },
  { id: logIdCounter++, text: 'Validating data for test instance MIO6.Cal3...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for board MVS1A...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for test instance MVS1A.Cal1...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for sub-module MVS1A.Cal1.SubModule 1...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for sub-module MVS1A.Cal1.SubModule 2...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for test instance MVS1A.Cal2...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Validating data for test instance MVS1A.Cal3...', colorClass: 'text-slate-500' },
  { id: logIdCounter++, text: 'Calibration Completed. [Ready]', colorClass: 'text-success' }
])

// 1. 左侧板卡勾选树初始数据
const leftTreeData = reactive<TreeNodeItem[]>([
  {
    id: 'board_mio6',
    name: 'MIO6',
    type: 'board',
    checked: true,
    expanded: true,
    children: [
      {
        id: 'mio6_cal1',
        name: 'Cal1',
        type: 'group',
        checked: true,
        expanded: true,
        children: [
          { id: 'mio6_cal1_sub1', name: 'SubModule 1', type: 'item', checked: true, expanded: false },
          { id: 'mio6_cal1_sub2', name: 'SubModule 2', type: 'item', checked: true, expanded: false }
        ]
      },
      { id: 'mio6_cal2', name: 'Cal2', type: 'item', checked: true, expanded: false },
      { id: 'mio6_cal3', name: 'Cal3', type: 'item', checked: false, expanded: false }
    ]
  },
  {
    id: 'board_mvs1a',
    name: 'MVS1A',
    type: 'board',
    checked: false,
    expanded: true,
    children: [
      {
        id: 'mvs1a_cal1',
        name: 'Cal1',
        type: 'group',
        checked: true,
        expanded: true,
        children: [
          { id: 'mvs1a_cal1_sub1', name: 'SubModule 1', type: 'item', checked: true, expanded: false },
          { id: 'mvs1a_cal1_sub2', name: 'SubModule 2', type: 'item', checked: false, expanded: false }
        ]
      },
      { id: 'mvs1a_cal2', name: 'Cal2', type: 'item', checked: false, expanded: false },
      { id: 'mvs1a_cal3', name: 'Cal3', type: 'item', checked: false, expanded: false }
    ]
  }
])

// 2. 右侧运行状态多级 TreeGrid 初始数据
const rightTreeData = reactive<RightGridNode[]>([
  {
    id: 'rt_mio6',
    name: 'MIO6',
    status: 'Not OK',
    temp: '',
    date: '',
    nextDate: '',
    expanded: true,
    children: [
      {
        id: 'rt_mio6_cal1',
        name: 'Cal1',
        status: 'OK',
        temp: '',
        date: '10/9/2026 10:15:20 AM',
        nextDate: '4/9/2027',
        expanded: true,
        children: [
          { id: 'rt_mio6_cal1_sub1', name: 'SubModule 1', status: 'OK', temp: '1.20 V', date: '10/9/2026 10:15:20 AM', nextDate: '4/9/2027', expanded: false },
          { id: 'rt_mio6_cal1_sub2', name: 'SubModule 2', status: 'OK', temp: '1.20 V', date: '10/9/2026 10:15:20 AM', nextDate: '4/9/2027', expanded: false }
        ]
      },
      { id: 'rt_mio6_cal2', name: 'Cal2', status: 'Not OK', temp: '0.82 V', date: '10/9/2026 10:15:22 AM', nextDate: 'Immediate', expanded: false },
      { id: 'rt_mio6_cal3', name: 'Cal3', status: 'NT', temp: '50.4 °C', date: '5/23/2026 8:07:48 AM', nextDate: '--', expanded: false }
    ]
  },
  {
    id: 'rt_mvs1a',
    name: 'MVS1A',
    status: 'OK',
    temp: '',
    date: '',
    nextDate: '',
    expanded: true,
    children: [
      {
        id: 'rt_mvs1a_cal1',
        name: 'Cal1',
        status: 'OK',
        temp: '',
        date: '10/9/2026 10:18:10 AM',
        nextDate: '4/9/2027',
        expanded: true,
        children: [
          { id: 'rt_mvs1a_cal1_sub1', name: 'SubModule 1', status: 'OK', temp: '1.20 V', date: '10/9/2026 10:18:10 AM', nextDate: '4/9/2027', expanded: false },
          { id: 'rt_mvs1a_cal1_sub2', name: 'SubModule 2', status: 'OK', temp: '1.21 V', date: '10/9/2026 10:18:12 AM', nextDate: '4/9/2027', expanded: false }
        ]
      },
      { id: 'rt_mvs1a_cal2', name: 'Cal2', status: 'OK', temp: '1.21 V', date: '10/9/2026 10:18:12 AM', nextDate: '4/9/2027', expanded: false },
      { id: 'rt_mvs1a_cal3', name: 'Cal3', status: 'OK', temp: '1.19 V', date: '10/9/2026 10:18:15 AM', nextDate: '4/9/2027', expanded: false }
    ]
  }
])

// 递归更新左侧树勾选状态
function updateTreeCheckStates() {
  function calc(node: TreeNodeItem) {
    if (node.children && node.children.length > 0) {
      node.children.forEach(calc)
      const allChecked = node.children.every(c => c.checked && !c.indeterminate)
      const anyChecked = node.children.some(c => c.checked || c.indeterminate)
      node.checked = allChecked
      node.indeterminate = !allChecked && anyChecked
    } else {
      node.indeterminate = false
    }
  }
  leftTreeData.forEach(calc)
}

function handleCheckboxChange(targetNode: TreeNodeItem, isChecked: boolean) {
  function checkDown(node: TreeNodeItem, val: boolean) {
    node.checked = val
    node.indeterminate = false
    if (node.children) {
      node.children.forEach(c => checkDown(c, val))
    }
  }

  function findAndCheck(list: TreeNodeItem[], id: string): boolean {
    for (const item of list) {
      if (item.id === id) {
        checkDown(item, isChecked)
        return true
      }
      if (item.children && findAndCheck(item.children, id)) {
        return true
      }
    }
    return false
  }

  findAndCheck(leftTreeData, targetNode.id)
  updateTreeCheckStates()
}

function toggleLeftExpand(targetNode: TreeNodeItem) {
  function findAndToggle(list: TreeNodeItem[], id: string): boolean {
    for (const item of list) {
      if (item.id === id) {
        item.expanded = !item.expanded
        return true
      }
      if (item.children && findAndToggle(item.children, id)) {
        return true
      }
    }
    return false
  }
  findAndToggle(leftTreeData, targetNode.id)
}

function toggleRightExpand(targetRow: RightGridNode) {
  function findAndToggle(list: RightGridNode[], id: string): boolean {
    for (const item of list) {
      if (item.id === id) {
        item.expanded = !item.expanded
        return true
      }
      if (item.children && findAndToggle(item.children, id)) {
        return true
      }
    }
    return false
  }
  findAndToggle(rightTreeData, targetRow.id)
}

// 统计选定待测项数量
const selectedCount = computed(() => {
  let count = 0
  function walk(node: TreeNodeItem) {
    if ((!node.children || node.children.length === 0) && node.checked) {
      count++
    }
    if (node.children) {
      node.children.forEach(walk)
    }
  }
  leftTreeData.forEach(walk)
  return count
})

// 全选/全不选
function toggleAllCheckboxes(state: boolean) {
  function setAll(node: TreeNodeItem) {
    node.checked = state
    node.indeterminate = false
    if (node.children) node.children.forEach(setAll)
  }
  leftTreeData.forEach(setAll)
  updateTreeCheckStates()
}

// 全部展开/折叠
function expandAll(expand: boolean) {
  function walkLeft(node: TreeNodeItem) {
    if (node.children && node.children.length > 0) {
      node.expanded = expand
      node.children.forEach(walkLeft)
    }
  }
  leftTreeData.forEach(walkLeft)

  function walkRight(node: RightGridNode) {
    if (node.children && node.children.length > 0) {
      node.expanded = expand
      node.children.forEach(walkRight)
    }
  }
  rightTreeData.forEach(walkRight)
}

// 控制台日志操作
function appendLog(text: string, colorClass: string = 'text-slate-300') {
  logList.value.push({
    id: logIdCounter++,
    text,
    colorClass
  })
}

function clearLogs() {
  logList.value = []
  appendLog('Console log cleared.', 'text-slate-400')
}

// 菜单事件响应
function onToggleView(key: 'showTree' | 'showTable' | 'showConsole') {
  viewConfig[key] = !viewConfig[key]
}

function onSetMode(mode: 'single' | 'loop' | 'halt') {
  execMode.value = mode
  const modeName = mode === 'single' ? 'Single Pass' : mode === 'loop' ? 'Continuous Loop' : 'Halt on First Fail'
  appendLog(`[MODE] Switched to ${modeName} mode.`)
}

function onMenuActionItem(item: MenuItemConfig) {
  const actionKey = item.id || ''
  const label = item.label || ''

  switch (actionKey) {
    case 'open_suite':
      appendLog('[FILE] Open Test Suite dialog simulated.', 'text-blue')
      break
    case 'save_cfg':
      appendLog('[FILE] Current configuration saved successfully.', 'text-success')
      break
    case 'reset_layout':
      consoleHeight.value = 180
      viewConfig.showTree = true
      viewConfig.showTable = true
      viewConfig.showConsole = true
      appendLog('[VIEW] Layout reset: Console height restored to 180px.', 'text-blue')
      break
    case 'exit':
      ElMessage.info('已触发 Exit Maintenance')
      break
    case 'toggle_fullscreen':
      toggleWindowFullscreen()
      break
    case 'cov_quick':
      testCoverage.value = 'Quick Diagnostic'
      appendLog('[COVERAGE] Set: Quick Diagnostic')
      break
    case 'cov_full':
      testCoverage.value = 'Full'
      appendLog('[COVERAGE] Set: Full Factory Calibration')
      break
    case 'cov_cal_only':
      testCoverage.value = 'Calibration Only'
      appendLog('[COVERAGE] Set: Verification Only')
      break
    case 'run_selected':
      startExecution()
      break
    case 'run_full':
      runFullCalibration()
      break
    case 'pause':
      pauseExecution()
      break
    case 'stop':
      stopExecution()
      break
    case 'step_next':
      stepNextInstance()
      break
    case 'retry_failed':
      retryFailedInstances()
      break
    case 'reset_baseline':
      resetMockData()
      break
    case 'sys_cold_reset':
      handleColdReset()
      break
    case 'cal_commit_eeprom':
      handleCommitEeprom()
      break
    case 'help_about':
      showAboutDialog()
      break
    default:
      appendLog(`[MENU] Action executed: ${label}`, 'text-blue')
      break
  }
}

function showAboutDialog() {
  ElMessageBox.alert(
    'Proxima Maintenance\n版本号: 10.00.02_u1fc(x64)\n核心模式: Factory Test - Full (Online)\n硬件互斥: Exclusive Mutex [LOCKED]\n© Proxima Semiconductor Test Solution',
    'About Proxima Maintenance',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

function handleCommitEeprom() {
  ElMessageBox.confirm(
    '【高危操作警告】\n即将把当前校准数据永久烧录进 MIO6/MVS1A 板载非易失性 EEPROM 存储器。\n此操作将覆盖原厂校验基线，是否确认写入？',
    '硬件烧录警告',
    {
      confirmButtonText: '确认写入',
      cancelButtonText: '放弃',
      type: 'warning'
    }
  ).then(() => {
    appendLog('>>> [SECURITY CHECK PASS] Writing Cal Constants into MIO6 & MVS1A EEPROM...', 'text-amber font-bold')
    setTimeout(() => {
      appendLog('>>> [EEPROM COMMITTED] Hardware checksum verified (CRC32: 0x9E21A4B0). Success.', 'text-success font-bold')
      ElMessage.success('EEPROM 写入成功 (CRC32 校验通过)')
    }, 800)
  }).catch(() => {
    appendLog('[WARN] EEPROM write aborted by operator.', 'text-slate-400')
  })
}

function handleColdReset() {
  ElMessageBox.confirm(
    '【系统联锁警告】\n即将对机架背板及所有测试槽位执行下电放电冷复位 (Cold Reset)。\n所有中间测试状态将被清空，是否继续？',
    '系统联锁冷复位',
    {
      confirmButtonText: '确定冷复位',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    appendLog('[SYSTEM] Initiating chassis safe discharge & Cold Reset...', 'text-danger font-bold')
    stopExecution()
    resetMockData()
    ElMessage.warning('系统已完成安全放电冷复位')
  }).catch(() => {})
}

function toggleWindowFullscreen() {
  if (!document.fullscreenElement) {
    if (windowRef.value?.requestFullscreen) {
      windowRef.value.requestFullscreen().then(() => {
        isFullscreen.value = true
        appendLog('[VIEW] Entered Full Screen Mode.')
      }).catch(() => {
        ElMessage.warning('当前环境不支持全屏切换')
      })
    }
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
      appendLog('[VIEW] Exited Full Screen Mode.')
    })
  }
}

// 逐级硬件测试执行模拟
function findAndModifyRightNode(
  nodeList: RightGridNode[],
  targetId: string,
  newStatus: string,
  newDate?: string,
  newTemp?: string
): boolean {
  for (const node of nodeList) {
    if (node.id === targetId) {
      node.status = newStatus
      if (newDate) node.date = newDate
      if (newTemp) node.temp = newTemp
      return true
    }
    if (node.children && findAndModifyRightNode(node.children, targetId, newStatus, newDate, newTemp)) {
      return true
    }
  }
  return false
}

function startExecution() {
  if (isRunning.value) return

  if (selectedCount.value === 0) {
    ElMessageBox.alert('请先在左侧勾选至少一个测试项！', '未选择测试项', {
      confirmButtonText: '好的',
      type: 'warning'
    })
    return
  }

  isRunning.value = true
  sysStatusText.value = 'Running (Stage 1 Test Program)'
  sysStatusClass.value = 'text-blue font-bold'

  appendLog(`>>> Launching generic maintenance test program (instances: ${selectedCount.value})...`, 'text-blue font-semibold')
  appendLog('Checking hardware lock: Proxima UI status verified [MUTEX_EXCLUSIVE_LOCKED]', 'text-slate-400')
  appendLog('Calling test program: generic_test_runner.so directly without user prompt.', 'text-slate-400')

  const nowStr = () => new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
  const steps = [
    { msg: 'Validating test program generic_tp.so for board MIO6...', updateNodeId: 'rt_mio6_cal1_sub1', status: 'RUNNING...' },
    { msg: 'MIO6.Cal1.SubModule 1: 1.20V internal reference verified. [PASS]', updateNodeId: 'rt_mio6_cal1_sub1', status: 'OK', temp: '1.20 V', date: nowStr() },
    { msg: 'Validating test program generic_tp.so for MIO6.Cal1.SubModule 2...', updateNodeId: 'rt_mio6_cal1_sub2', status: 'RUNNING...' },
    { msg: 'MIO6.Cal1.SubModule 2: Secondary power rail verified. [PASS]', updateNodeId: 'rt_mio6_cal1_sub2', status: 'OK', temp: '1.20 V', date: nowStr() },
    { msg: 'Validating test program generic_tp.so for MIO6.Cal2...', updateNodeId: 'rt_mio6_cal2', status: 'RUNNING...' },
    { msg: '[WARNING] MIO6.Cal2: Parameter at 0.82V out of spec margin [Not OK]', updateNodeId: 'rt_mio6_cal2', status: 'Not OK', temp: '0.82 V', date: nowStr() },
    { msg: 'Validating test program generic_tp.so for MIO6.Cal3...', updateNodeId: 'rt_mio6_cal3', status: 'RUNNING...' },
    { msg: 'MIO6.Cal3: Thermal diagnostic sweep completed. Temp: 49.8 °C. [PASS]', updateNodeId: 'rt_mio6_cal3', status: 'OK', temp: '49.8 °C', date: nowStr() },
    { msg: 'Validating test program generic_tp.so for board MVS1A...', updateNodeId: 'rt_mvs1a_cal1_sub1', status: 'RUNNING...' },
    { msg: 'MVS1A.Cal1.SubModule 1: Direct channel loopback verified. [PASS]', updateNodeId: 'rt_mvs1a_cal1_sub1', status: 'OK', temp: '1.20 V', date: nowStr() },
    { msg: 'Validating test program generic_tp.so for MVS1A.Cal1.SubModule 2...', updateNodeId: 'rt_mvs1a_cal1_sub2', status: 'RUNNING...' },
    { msg: 'MVS1A.Cal1.SubModule 2: Channel offset alignment verified. [PASS]', updateNodeId: 'rt_mvs1a_cal1_sub2', status: 'OK', temp: '1.21 V', date: nowStr() },
    { msg: 'Validating test program generic_tp.so for MVS1A.Cal2...', updateNodeId: 'rt_mvs1a_cal2', status: 'RUNNING...' },
    { msg: 'MVS1A.Cal2: Signal integrity & timing alignment verified. [PASS]', updateNodeId: 'rt_mvs1a_cal2', status: 'OK', temp: '1.21 V', date: nowStr() },
    { msg: 'Validating test program generic_tp.so for MVS1A.Cal3...', updateNodeId: 'rt_mvs1a_cal3', status: 'RUNNING...' },
    { msg: 'MVS1A.Cal3: Precision reference calibration completed. [PASS]', updateNodeId: 'rt_mvs1a_cal3', status: 'OK', temp: '1.19 V', date: nowStr() },
    { msg: '>>> [DONE] Calibration & Test Program Execution Completed.', updateNodeId: '', status: '' }
  ]

  let currentStep = 0
  if (runIntervalTimer) clearInterval(runIntervalTimer)

  runIntervalTimer = setInterval(() => {
    if (!isRunning.value) {
      if (runIntervalTimer) clearInterval(runIntervalTimer)
      return
    }

    if (currentStep < steps.length) {
      const step = steps[currentStep]
      let color = 'text-slate-300'
      if (step.msg.includes('[PASS]')) color = 'text-success'
      else if (step.msg.includes('[WARNING]')) color = 'text-amber font-semibold'
      else if (step.msg.includes('[DONE]')) color = 'text-blue font-bold'

      appendLog(step.msg, color)

      if (step.updateNodeId) {
        findAndModifyRightNode(rightTreeData, step.updateNodeId, step.status, step.date, step.temp)
      }
      currentStep++
    } else {
      if (runIntervalTimer) clearInterval(runIntervalTimer)
      finishExecution()
    }
  }, 750)
}

function runFullCalibration() {
  toggleAllCheckboxes(true)
  startExecution()
}

function pauseExecution() {
  if (!isRunning.value) return
  if (runIntervalTimer) clearInterval(runIntervalTimer)
  isRunning.value = false
  sysStatusText.value = 'Paused'
  sysStatusClass.value = 'text-amber'
  appendLog('Test execution PAUSED by operator.', 'text-amber')
}

function stopExecution() {
  if (runIntervalTimer) clearInterval(runIntervalTimer)
  isRunning.value = false
  sysStatusText.value = 'Stopped'
  sysStatusClass.value = 'text-danger'
  appendLog('Test execution ABORTED by operator.', 'text-danger font-semibold')
}

function finishExecution() {
  isRunning.value = false
  sysStatusText.value = 'Calibration Completed'
  sysStatusClass.value = 'text-success font-semibold'
  appendLog('Hardware test run finished. System safe.', 'text-success')
}

function stepNextInstance() {
  appendLog('[STEP] Step Next Instance triggered (F10).', 'text-blue')
}

function retryFailedInstances() {
  appendLog('>>> [RETRY] Operator invoked retry on failed items (MIO6.Cal2)...', 'text-amber font-semibold')
  findAndModifyRightNode(rightTreeData, 'rt_mio6_cal2', 'RUNNING...')

  setTimeout(() => {
    const now = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    findAndModifyRightNode(rightTreeData, 'rt_mio6_cal2', 'OK', now, '1.20 V')
    appendLog('MIO6.Cal2: Parameter recalibrated within ±1% margin. Status: OK. [PASS]', 'text-success font-bold')
  }, 900)
}

function resetMockData() {
  if (isRunning.value) return
  appendLog('[INFO] Status tree reset to initial baseline.')
  findAndModifyRightNode(rightTreeData, 'rt_mio6_cal2', 'Not OK', '10/9/2026 10:15:22 AM', '0.82 V')
}

// 全局按键监听
function handleGlobalKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
    return
  }

  if (e.key === 'F5' && !e.ctrlKey) {
    e.preventDefault()
    startExecution()
  } else if (e.key === 'F5' && e.ctrlKey) {
    e.preventDefault()
    runFullCalibration()
  } else if (e.key === 'F6') {
    e.preventDefault()
    pauseExecution()
  } else if (e.key === 'F7' || e.key === 'Escape') {
    e.preventDefault()
    stopExecution()
  } else if (e.key.toLowerCase() === 'r' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    retryFailedInstances()
  } else if (e.key === 'F1') {
    e.preventDefault()
    appendLog('[HELP] Maintenance & Calibration Manual requested (F1).', 'text-blue')
  } else if (e.key === 'F11') {
    e.preventDefault()
    toggleWindowFullscreen()
  }
}

onMounted(() => {
  updateTreeCheckStates()
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  if (runIntervalTimer) clearInterval(runIntervalTimer)
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.maintenance-view-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.maintenance-window-wrapper {
  width: 100%;
  height: calc(100vh - 104px);
  min-height: 680px;
  display: flex;
  flex-direction: column;
}

*, *::before, *::after {
  transition: none !important;
  -webkit-transition: none !important;
  animation: none !important;
  -webkit-animation: none !important;
  box-sizing: border-box;
}

/* 主窗口容器 */
.proxima-app-window {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #e2e8f0;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", sans-serif;
  font-size: 14px;
  user-select: none;
  overflow: hidden;
  /* border: 1px solid #94a3b8; */
  /* border-radius: 12px; */
  /* box-shadow: 0 4px 16px rgba(15, 23, 42, 0.15); */
}

/* 主视窗内容 */
.app-main-viewport {
  flex: 1;
  overflow: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

/* 颜色与文字样式工具类 */
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
