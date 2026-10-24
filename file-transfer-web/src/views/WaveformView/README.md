# WaveformView 数字波形仿真分析模块（内网 100% 自包含版）

本目录为基于 **[VaporView](https://github.com/Lramseyer/vaporview) (`wellen.wasm` 0.25.7)** 架构完整剥离与移植的高性能数字波形（VCD）仿真分析模块。所有视图、Canvas 渲染引擎、Web Worker、WASM 二进制核心及 LZ4 解压算法均已收敛在本目录内，**无需任何外部特殊依赖，直接复制整个 `WaveformView` 文件夹即可在任何内网 Vue 3 项目中开箱即用**。

---

## 📁 目录结构（全部内聚在 `WaveformView/` 下）

```text
src/views/WaveformView/
├── index.vue                     # 主页面容器（NETLIST 虚拟滚动信号树、DISPLAYED SIGNALS、文件拖拽/上传）
├── types.ts                      # 完整的 VCD 波形数据结构与 TypeScript 类型定义
├── README.md                     # 内网迁移与集成说明文档
├── components/
│   └── WaveformCanvas.vue        # 1:1 还原 VaporView 的 4 层 Canvas 渲染引擎、顶部工具栏、分栏拖拽与双轴滚动条
└── workers/
    ├── vcdParser.worker.ts       # Web Worker 多线程异步流式解析引擎（WASM + 纯 JS 双引擎自动降级兜底）
    ├── lz4Decompress.ts          # 内置纯 TS 实现的 LZ4 Frame 解压模块（零第三方解压库依赖）
    └── filehandler.wasm          # 随组件打包的 VaporView (wellen) 原生 WebAssembly 核心二进制文件
```

---

## 📦 引用依赖说明

将 `WaveformView` 复制到内网项目时，**不需要安装任何额外的第三方波形库或解压库**（原本依赖的 `lz4js` 已内置为纯 TS 模块 `workers/lz4Decompress.ts`）。宿主项目只需具备标准的 Vue 3 + Element Plus 基础环境：

| 依赖包名 | 版本要求 | 用途说明 |
| :--- | :--- | :--- |
| `vue` | `^3.3.0+` | Vue 3 核心响应式与组件运行时 |
| `element-plus` | `^2.4.0+` | 左侧 `el-tree-v2` 虚拟滚动信号树、按钮、进度条提示 |
| `@element-plus/icons-vue` | `^2.1.0+` | 顶部操作栏基础图标 |

> **Vite TypeScript 静态资源声明**：确保内网项目的 `src/vite-env.d.ts` 中包含标准的 `/// <reference types="vite/client" />`（Vite 默认自带，用于支持 `?worker` 和 `.wasm?url` 资源导入）。

---

## 🚀 内网项目使用方式

### 方式一：作为独立路由页面使用（推荐）

1. **复制文件夹**  
   将 `src/views/WaveformView` 完整复制到内网项目的 `src/views/WaveformView`。

2. **注册路由 (`src/router/index.ts`)**
   ```typescript
   {
     path: '/waveform',
     name: 'Waveform',
     component: () => import('@/views/WaveformView/index.vue'),
     meta: {
       title: '数字波形仿真'
     }
   }
   ```

3. **父容器高度建议**  
   `WaveformView` 采用全屏自适应 Flex/Grid 布局，挂载该路由的父容器建议设置固定视口高度（如 `height: 100vh` 或 `height: calc(100vh - 顶部导航高度)`），以保证内部虚拟树和底部水平滚动条正常贴底显示。

---

### 方式二：作为子组件嵌入任意现有页面

```vue
<template>
  <div class="waveform-host-wrapper">
    <WaveformView />
  </div>
</template>

<script setup lang="ts">
import WaveformView from '@/views/WaveformView/index.vue'
</script>

<style scoped>
.waveform-host-wrapper {
  width: 100%;
  height: 800px; /* 或 100vh / flex: 1 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
```

---

### 方式三：单独调用内部 `WaveformCanvas.vue` 画布组件

如果你有自定义的信号数据源，也可以直接引用内部的 `WaveformCanvas.vue`：

```vue
<template>
  <div style="width: 100%; height: 600px; display: flex;">
    <WaveformCanvas
      :metadata="metadata"
      :active-signals="activeSignals"
      :selected-signal-id="selectedSignalId"
      @update:selected-signal-id="selectedSignalId = $event"
      @remove-signal="handleRemoveSignal"
      @reorder-signals="handleReorderSignals"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WaveformCanvas from '@/views/WaveformView/components/WaveformCanvas.vue'
import type { VcdMetadata, VcdSignalData } from '@/views/WaveformView/types'
</script>
```
