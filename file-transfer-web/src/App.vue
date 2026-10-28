<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-left">
        <el-icon class="logo-icon" :size="28" color="#409EFF">
          <ElementPlus />
        </el-icon>
        <div class="brand-text">
          <h1 class="header-title">半导体测试与流转管理平台</h1>
          <el-tag type="success" effect="plain" round size="small">Vue 3 + Router + TS</el-tag>
        </div>
      </div>

      <!-- 中间视图路由切换导航 -->
      <div class="header-center">
        <el-radio-group :model-value="activeNav" @update:model-value="handleNavChange" size="default">
          <el-radio-button value="/proxima">
            <el-icon style="margin-right: 4px"><Platform /></el-icon> Proxima 平台
          </el-radio-button>
          <el-radio-button value="/cluster">
            <el-icon style="margin-right: 4px"><Connection /></el-icon> 集群总控 (1:N)
          </el-radio-button>
          <el-radio-button value="/transfer">
            <el-icon style="margin-right: 4px"><Files /></el-icon> 文件流转管理
          </el-radio-button>
          <el-radio-button value="/surface">
            <el-icon style="margin-right: 4px"><TrendCharts /></el-icon> 3D IC 响应曲面
          </el-radio-button>
          <el-radio-button value="/instrument">
            <el-icon style="margin-right: 4px"><Odometer /></el-icon> ATE 芯片测试机台
          </el-radio-button>
          <el-radio-button value="/maintenance">
            <el-icon style="margin-right: 4px"><SetUp /></el-icon> Proxima 维护校准
          </el-radio-button>
          <el-radio-button value="/waveform">
            <el-icon style="margin-right: 4px"><Monitor /></el-icon> 数字波形仿真
          </el-radio-button>
          <el-radio-button value="/circuit-flow">
            <el-icon style="margin-right: 4px"><Share /></el-icon> VI 电路拓扑
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 右侧操作与用户信息 -->
      <div class="header-right">
        <el-tooltip content="刷新页面" placement="bottom">
          <el-button circle :icon="Refresh" @click="handleRefresh" />
        </el-tooltip>
        <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏展示'" placement="bottom">
          <el-button circle :icon="FullScreen" @click="toggleFullscreen" />
        </el-tooltip>
        <el-divider direction="vertical" />
        <div class="user-info">
          <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          <div class="user-meta">
            <span class="username">管理员</span>
            <span class="role-badge">研发测试组</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主体路由承载区域 -->
    <main
      class="app-main"
      :class="{
        'fluid-main': route.path === '/surface' || route.path === '/instrument' || route.path === '/maintenance' || route.path === '/waveform' || route.path === '/proxima' || route.path === '/cluster' || route.path === '/circuit-flow',
        'maintenance-main': route.path === '/maintenance',
        'waveform-main': route.path === '/waveform',
        'proxima-main': route.path === '/proxima',
        'cluster-main': route.path === '/cluster'
      }"
    >
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <keep-alive>
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Platform,
  Connection,
  Files,
  TrendCharts,
  Odometer,
  SetUp,
  Refresh,
  FullScreen,
  Monitor,
  Share
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 当前激活的路由导航路径
const activeNav = computed(() => {
  if (route.path === '/proxima') return '/proxima'
  if (route.path === '/cluster') return '/cluster'
  if (route.path === '/surface') return '/surface'
  if (route.path === '/instrument') return '/instrument'
  if (route.path === '/maintenance') return '/maintenance'
  if (route.path === '/waveform') return '/waveform'
  if (route.path === '/circuit-flow') return '/circuit-flow'
  return '/transfer'
})

// 路由跳转
const handleNavChange = (path: string | number | boolean | undefined) => {
  if (typeof path === 'string' && path !== route.path) {
    router.push(path)
  }
}

// 刷新页面
const handleRefresh = () => {
  ElMessage.success('视图已同步刷新')
}

// 全屏控制
const isFullscreen = ref(false)
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch(() => {
      ElMessage.warning('当前环境不支持全屏切换')
    })
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    })
  }
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f1f5f9;
  overflow: hidden;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-text {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.header-center {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  line-height: 1.2;
}

.role-badge {
  font-size: 11px;
  color: #94a3b8;
}

.app-main {
  flex: 1;
  padding: 20px 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.fluid-main {
  max-width: 1560px;
}

.maintenance-main {
  max-width: 100%;
  padding: 10px 16px;
  height: calc(100vh - 64px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.waveform-main {
  max-width: 100%;
  padding: 0;
  height: calc(100vh - 64px);
  flex: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.proxima-main {
  max-width: 100%;
  padding: 0;
  height: calc(100vh - 64px);
  flex: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cluster-main {
  max-width: 100%;
  padding: 0;
  height: calc(100vh - 64px);
  flex: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 路由转场过渡动效 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
