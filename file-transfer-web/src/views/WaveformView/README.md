# WaveformView 数字波形仿真分析组件 (内网自包含模块)

本目录为基于 **VaporView / wellen.wasm 0.25.7** 架构定制的高性能数字波形（VCD）仿真分析组件，采用 **100% 独立自包含架构** 设计，与 `MaintenanceView` 一样，**直接复制整个 `WaveformView` 文件夹即可在任何内网 Vue 3 项目中运行**。

---

## 📁 目录结构（全模块自包含）

```text
src/views/WaveformView/
├── index.vue                  # 主视图页面（NETLIST 信号树、DISPLAYED SIGNALS 列表、顶部操作栏）
├── types.ts                   # 完整的波形仿真 TypeScript 接口定义
├── README.md                  # 内网集成与迁移文档说明
├── components/
│   └── WaveformCanvas.vue     # Canvas 核心波形渲染引擎、时间标尺、双游标 (T1/T2) 测量与滚轮缩放
└── workers/
    ├── vcdParser.worker.ts    # Web Worker 多线程异步大文件流式解析器（带分片重组缓冲）
    └── filehandler.wasm       # 本地携带的 WASM 核心二进制文件（秒级解析 50M~100M VCD）
```

---

## 🚀 内网一键迁移使用步骤

### 1. 复制目录
直接将整个 `WaveformView/` 文件夹复制到内网项目的 `src/views/`（或 `src/components/`）目录下：
```text
your-project/src/views/WaveformView/
```

### 2. 配置路由 (`router/index.ts`)
在内网项目的路由配置中增加一条路由记录即可：

```typescript
{
  path: '/waveform',
  name: 'Waveform',
  component: () => import('@/views/WaveformView/index.vue'),
  meta: {
    title: '数字波形仿真',
    icon: 'Monitor',
    desc: 'VCD 数字波形仿真分析引擎 (支持 50M~100M 大文件)'
  }
}
```

### 3. 项目依赖确认
本组件仅依赖常规的 Vue 3 技术栈生态，无需任何外部网络请求：
- `vue` (^3.3+)
- `element-plus` (^2.4+)
- `@element-plus/icons-vue`
- `lz4js`（可选，用于 WASM 压缩流极速解压，若无会自动使用纯 JS 兜底解析）

如果内网项目尚未安装 `lz4js`，可执行：
```bash
npm install lz4js
```

---

## ✨ 核心特性与技术亮点

1. **零外部网络请求（100% 离线内网运行）**：
   - 不依赖任何外部 CDN、外部字体或外部 API；
   - `filehandler.wasm` 直接内嵌在 `workers/` 目录中，Vite 在构建打包时会自动解析为本地 Asset，无需繁琐的手动拷贝到 `public` 目录。
2. **双引擎自动容灾兜底**：
   - 优先通过 WebAssembly 零拷贝流式解析（秒开 50M~100M 大型仿真文件）；
   - 若宿主内网环境受安全策略（CSP）限制禁用 WASM，Web Worker 会**自动无缝切入纯 JavaScript 引擎**，确保业务 100% 可用。
3. **专业 EDA 双游标测量规范**：
   - **T1 主游标（黄色）**：单击画布快速定位，保持 T2 不动，$\Delta T$ 与频率 $1/\Delta T$ 实时动态更新；
   - **T2 参考游标（青色）**：按住 `Shift + 单击` 定位，支持鼠标靠近游标线（`col-resize`）直接拖拽调整，支持 `Esc` 键或 `✕` 按钮关闭；
   - **框选时间区间**：鼠标左键拖拽直接框选区间测量。
4. **VaporView 1:1 仿真交互体验**：
   - NETLIST 模块树与已显示信号列表；
   - 区分单比特线网（`⚬—⚬`）与多比特总线向量（`[ ] [31:0]`）；
   - HEX / DEC / BIN 进制实时切换与 4 位下划线分隔排版（如 `c000_5ea4`）；
   - 信号跳变沿步进导航（`|<` 与 `>|`）；
   - 底部状态栏展示相对时间 `At:`、当前光标时刻 `time:` 与选中信号完整层级路径 `Selected signal:`。
