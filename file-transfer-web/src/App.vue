<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-left">
        <el-icon class="logo-icon" :size="28" color="#409EFF">
          <ElementPlus />
        </el-icon>
        <h1 class="header-title">文件摆渡管理平台</h1>
        <el-tag type="success" effect="plain" round size="small">Vue 3 + Element Plus + TS</el-tag>
      </div>

      <div class="header-right">
        <el-tooltip content="刷新系统" placement="bottom">
          <el-button circle :icon="Refresh" @click="handleRefresh" />
        </el-tooltip>
        <el-tooltip content="新建摆渡任务" placement="bottom">
          <el-button type="primary" :icon="Plus" @click="openDialog()">新建任务</el-button>
        </el-tooltip>
        <el-divider direction="vertical" />
        <div class="user-info">
          <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          <span class="username">管理员</span>
        </div>
      </div>
    </header>

    <!-- 主体区域 -->
    <main class="app-main">
      <!-- 统计指标卡片 -->
      <el-row :gutter="16" class="stats-row">
        <el-col :xs="24" :sm="12" :md="6" v-for="stat in statistics" :key="stat.title">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <div class="stat-header">
                <span>{{ stat.title }}</span>
                <el-icon :color="stat.color"><component :is="stat.icon" /></el-icon>
              </div>
            </template>
            <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
            <div class="stat-desc">{{ stat.desc }}</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 数据管理面板 -->
      <el-card shadow="never" class="table-card">
        <template #header>
          <div class="table-header">
            <div class="table-title">
              <el-icon><Files /></el-icon>
              <span>文件流转列表</span>
            </div>

            <!-- 搜索与筛选 -->
            <div class="table-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索文件名 / 发起人..."
                :prefix-icon="Search"
                clearable
                style="width: 240px"
              />
              <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px">
                <el-option label="已完成" value="completed" />
                <el-option label="传输中" value="transferring" />
                <el-option label="审核中" value="auditing" />
                <el-option label="已驳回" value="rejected" />
              </el-select>
            </div>
          </div>
        </template>

        <!-- 数据表格 -->
        <el-table
          :data="filteredList"
          v-loading="loading"
          stripe
          border
          style="width: 100%"
          :header-cell-style="{ background: '#f8fafc', color: '#475569' }"
        >
          <el-table-column type="index" label="#" width="60" align="center" />
          <el-table-column prop="fileName" label="文件名称" min-width="180">
            <template #default="{ row }">
              <div class="file-name-cell">
                <el-icon color="#409EFF"><Document /></el-icon>
                <span class="file-text">{{ row.fileName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="大小" width="100" align="center" />
          <el-table-column prop="sourceEnv" label="源区域" width="110" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.sourceEnv }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="targetEnv" label="目标区域" width="110" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="primary">{{ row.targetEnv }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="creator" label="发起人" width="110" align="center" />
          <el-table-column prop="status" label="流转状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" effect="light">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="申请时间" width="170" align="center" />
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" :icon="View" @click="handleDetail(row)">详情</el-button>
              <el-button link type="warning" size="small" :icon="Edit" @click="openDialog(row)">编辑</el-button>
              <el-popconfirm title="确定要删除此条记录吗？" @confirm="handleDelete(row.id)">
                <template #reference>
                  <el-button link type="danger" size="small" :icon="Delete">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredList.length"
          />
        </div>
      </el-card>
    </main>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '新建摆渡任务'"
      width="540px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="90px"
        label-position="right"
      >
        <el-form-item label="文件名称" prop="fileName">
          <el-input v-model="formData.fileName" placeholder="例如：ic_tapeout_v1.tar.gz" />
        </el-form-item>
        <el-form-item label="文件大小" prop="fileSize">
          <el-input v-model="formData.fileSize" placeholder="例如：128.5 MB" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="源区域" prop="sourceEnv">
              <el-select v-model="formData.sourceEnv" placeholder="请选择">
                <el-option label="内网研发区" value="内网研发区" />
                <el-option label="安全隔离区" value="安全隔离区" />
                <el-option label="对外交互区" value="对外交互区" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标区域" prop="targetEnv">
              <el-select v-model="formData.targetEnv" placeholder="请选择">
                <el-option label="内网研发区" value="内网研发区" />
                <el-option label="安全隔离区" value="安全隔离区" />
                <el-option label="对外交互区" value="对外交互区" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="发起人" prop="creator">
          <el-input v-model="formData.creator" placeholder="申请人工号或姓名" />
        </el-form-item>
        <el-form-item label="任务状态" prop="status">
          <el-select v-model="formData.status" placeholder="流转状态">
            <el-option label="审核中" value="auditing" />
            <el-option label="传输中" value="transferring" />
            <el-option label="已完成" value="completed" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注说明" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="填写流转用途、安全级别等必要信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  Document,
  Plus,
  Search,
  Refresh,
  Edit,
  Delete,
  View,
  Files,
  CircleCheck,
  Timer,
  CircleClose
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

// 数据类型接口定义
export interface FileTransferItem {
  id: number
  fileName: string
  fileSize: string
  sourceEnv: string
  targetEnv: string
  creator: string
  status: 'completed' | 'transferring' | 'auditing' | 'rejected'
  createTime: string
  remark?: string
}

// 统计指标
const statistics = [
  { title: '累计流转任务', value: '1,280', desc: '环比上周 +12.5%', icon: Files, color: '#409EFF' },
  { title: '传输完成', value: '1,192', desc: '成功率 98.4%', icon: CircleCheck, color: '#67C23A' },
  { title: '正在审核', value: '64', desc: '平均审核耗时 8m', icon: Timer, color: '#E6A23C' },
  { title: '驳回阻断', value: '24', desc: '防泄密安全拦截', icon: CircleClose, color: '#F56C6C' }
]

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 任务列表初始数据
const fileList = ref<FileTransferItem[]>([
  {
    id: 1,
    fileName: 'chip_layout_final_v3.gds',
    fileSize: '412.8 MB',
    sourceEnv: '安全隔离区',
    targetEnv: '内网研发区',
    creator: '张工',
    status: 'completed',
    createTime: '2026-10-12 09:30:15',
    remark: '版图投片终版交付'
  },
  {
    id: 2,
    fileName: 'fpga_bitstream_top.bit',
    fileSize: '84.2 MB',
    sourceEnv: '内网研发区',
    targetEnv: '对外交互区',
    creator: '李工',
    status: 'transferring',
    createTime: '2026-10-12 09:45:22',
    remark: '板卡烧录固件验证'
  },
  {
    id: 3,
    fileName: 'wafer_test_dataset_q3.csv',
    fileSize: '1.2 GB',
    sourceEnv: '对外交互区',
    targetEnv: '内网研发区',
    creator: '王总监',
    status: 'auditing',
    createTime: '2026-10-12 10:02:11',
    remark: '晶圆代工厂回测数据分析'
  },
  {
    id: 4,
    fileName: 'confidential_arch_spec.pdf',
    fileSize: '15.6 MB',
    sourceEnv: '内网研发区',
    targetEnv: '对外交互区',
    creator: '赵工',
    status: 'rejected',
    createTime: '2026-10-12 10:11:05',
    remark: '触发机密架构安全防护拦截'
  },
  {
    id: 5,
    fileName: 'verilog_sim_results.log',
    fileSize: '6.4 MB',
    sourceEnv: '安全隔离区',
    targetEnv: '内网研发区',
    creator: '钱工',
    status: 'completed',
    createTime: '2026-10-12 10:14:40',
    remark: '时序仿真日志'
  }
])

// 过滤列表
const filteredList = computed(() => {
  return fileList.value.filter(item => {
    const matchKeyword = !searchKeyword.value ||
      item.fileName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.creator.includes(searchKeyword.value)
    const matchStatus = !filterStatus.value || item.status === filterStatus.value
    return matchKeyword && matchStatus
  })
})

// 状态映射
const getStatusLabel = (status: FileTransferItem['status']) => {
  const map: Record<string, string> = {
    completed: '已完成',
    transferring: '传输中',
    auditing: '审核中',
    rejected: '已驳回'
  }
  return map[status] || status
}

const getStatusTagType = (status: FileTransferItem['status']) => {
  const map: Record<string, 'success' | 'primary' | 'warning' | 'danger'> = {
    completed: 'success',
    transferring: 'primary',
    auditing: 'warning',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

// 弹窗表单状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: 0,
  fileName: '',
  fileSize: '',
  sourceEnv: '内网研发区',
  targetEnv: '安全隔离区',
  creator: '',
  status: 'auditing' as FileTransferItem['status'],
  remark: ''
})

const formRules: FormRules = {
  fileName: [{ required: true, message: '请输入文件名称', trigger: 'blur' }],
  fileSize: [{ required: true, message: '请输入文件大小', trigger: 'blur' }],
  sourceEnv: [{ required: true, message: '请选择源区域', trigger: 'change' }],
  targetEnv: [{ required: true, message: '请选择目标区域', trigger: 'change' }],
  creator: [{ required: true, message: '请输入发起人姓名', trigger: 'blur' }]
}

// 刷新表格
const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据列表已刷新')
  }, 400)
}

// 打开弹窗
const openDialog = (item?: FileTransferItem) => {
  if (item) {
    isEdit.value = true
    formData.id = item.id
    formData.fileName = item.fileName
    formData.fileSize = item.fileSize
    formData.sourceEnv = item.sourceEnv
    formData.targetEnv = item.targetEnv
    formData.creator = item.creator
    formData.status = item.status
    formData.remark = item.remark || ''
  } else {
    isEdit.value = false
    formData.id = 0
    formData.fileName = ''
    formData.fileSize = ''
    formData.sourceEnv = '内网研发区'
    formData.targetEnv = '安全隔离区'
    formData.creator = '管理员'
    formData.status = 'auditing'
    formData.remark = ''
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      submitting.value = true
      setTimeout(() => {
        submitting.value = false
        if (isEdit.value) {
          const index = fileList.value.findIndex(item => item.id === formData.id)
          if (index !== -1) {
            fileList.value[index] = {
              ...fileList.value[index],
              ...formData
            }
          }
          ElMessage.success('任务信息更新成功')
        } else {
          const now = new Date()
          const timeStr = now.toISOString().replace('T', ' ').substring(0, 19)
          fileList.value.unshift({
            ...formData,
            id: Date.now(),
            createTime: timeStr
          })
          ElMessage.success('新流转任务已创建')
        }
        dialogVisible.value = false
      }, 500)
    }
  })
}

// 查看详情
const handleDetail = (row: FileTransferItem) => {
  ElMessage.info(`查看任务 [${row.fileName}]：发起人 ${row.creator}，状态：${getStatusLabel(row.status)}`)
}

// 删除记录
const handleDelete = (id: number) => {
  fileList.value = fileList.value.filter(item => item.id !== id)
  ElMessage.success('记录已删除')
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.app-main {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #64748b;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  margin: 6px 0;
}

.stat-desc {
  font-size: 12px;
  color: #94a3b8;
}

.table-card {
  border-radius: 8px;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: #1e293b;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
