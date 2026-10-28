<template>
  <div class="cluster-control-page">
    <!-- 顶部总控快捷辅助栏 -->
    <header class="cluster-sub-header">
      <div class="sub-header-left">
        <el-button
          size="small"
          type="info"
          plain
          @click="navigateBackToProxima"
          class="back-btn"
        >
          <el-icon style="margin-right: 4px"><ArrowLeft /></el-icon>
          返回 Proxima 平台
        </el-button>

        <el-divider direction="vertical" />

        <div class="cluster-badge-tag">
          <span class="pulse-indicator"></span>
          <span class="brand-text">AETHER SEMI MASTER</span>
          <span class="net-text">网关: 192.168.1.100:50051 (gRPC)</span>
        </div>

        <el-tag type="success" effect="dark" size="small" round>1 对多集群互联已激活</el-tag>
      </div>

      <div class="sub-header-right">
        <el-tooltip content="刷新中控控制台" placement="bottom">
          <el-button size="small" circle @click="reloadIframe">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip content="在独立新标签页中打开" placement="bottom">
          <el-button size="small" type="primary" plain @click="openInNewTab">
            <el-icon style="margin-right: 4px"><TopRight /></el-icon>
            独立窗口打开
          </el-button>
        </el-tooltip>
      </div>
    </header>

    <!-- 1对多集群总控嵌入视窗 -->
    <div class="cluster-iframe-wrapper">
      <div v-if="loading" class="iframe-loading-mask">
        <el-icon class="is-loading" :size="32" color="#007acc"><Loading /></el-icon>
        <span class="loading-label">正在建立 1:N 芯片测试机台集群连接与网关会话...</span>
      </div>
      <iframe
        ref="iframeRef"
        src="/html/index.html"
        class="cluster-iframe"
        @load="onIframeLoaded"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Refresh,
  TopRight,
  Loading
} from '@element-plus/icons-vue'

const router = useRouter()
const iframeRef = ref<HTMLIFrameElement | null>(null)
const loading = ref(true)

const onIframeLoaded = () => {
  loading.value = false
}

const reloadIframe = () => {
  if (iframeRef.value) {
    loading.value = true
    iframeRef.value.src = '/html/index.html'
    ElMessage.success('已重新加载集群总控系统')
  }
}

const openInNewTab = () => {
  window.open('/html/index.html', '_blank')
}

const navigateBackToProxima = () => {
  router.push('/proxima')
}
</script>

<style scoped>
.cluster-control-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  overflow: hidden;
  box-sizing: border-box;
}

.cluster-sub-header {
  height: 42px;
  background-color: #181818;
  border-bottom: 1px solid #2d2d2d;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  z-index: 20;
}

.sub-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background-color: #2b2b2b;
  border-color: #3e3e3e;
  color: #cccccc;
}

.back-btn:hover {
  background-color: #383838;
  color: #ffffff;
}

.cluster-badge-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #73c991;
  box-shadow: 0 0 8px #73c991;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.brand-text {
  font-family: monospace;
  font-weight: 700;
  color: #e0e0e0;
  letter-spacing: 0.5px;
}

.net-text {
  font-family: monospace;
  font-size: 11px;
  color: #858585;
}

.sub-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cluster-iframe-wrapper {
  flex: 1;
  width: 100%;
  height: calc(100% - 42px);
  position: relative;
  overflow: hidden;
}

.cluster-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.iframe-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  z-index: 10;
}

.loading-label {
  font-size: 13px;
  color: #94a3b8;
  letter-spacing: 0.3px;
}
</style>
