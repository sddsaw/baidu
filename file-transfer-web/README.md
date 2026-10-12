# 文件摆渡管理系统 (Vue 3 + Element Plus + TypeScript)

本项目基于 **Vue 3 + Vite + Element Plus + TypeScript** 搭建，提供现代化的文件流转管理与控制台界面。

## 🛠️ 技术栈

- **前端框架**：[Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **UI 组件库**：[Element Plus](https://element-plus.org/) + [@element-plus/icons-vue](https://element-plus.org/zh-CN/component/icon.html)
- **构建工具**：[Vite 5](https://vitejs.dev/)
- **类型系统**：[TypeScript 5](https://www.typescriptlang.org/)

## 🚀 启动与构建

### 1. 安装依赖
```bash
npm install
# 或者使用淘宝/腾讯镜像加速：
npm install --registry=https://registry.npmmirror.com
```

### 2. 本地开发调试
```bash
npm run dev
```
启动后访问本地开发服务地址：`http://localhost:5173`

### 3. 打包构建
```bash
npm run build
```
打包产物将输出在 `dist/` 目录下。

### 4. 预览生产构建
```bash
npm run preview
```

## 📁 目录结构

```
文件摆渡仓库/
├── public/                 # 静态资源
│   └── vite.svg
├── src/
│   ├── assets/             # 资源文件
│   ├── App.vue             # 根组件（文件流转管理看板页面）
│   ├── main.ts             # 应用入口（完整引入 Element Plus 及其中文语言包与图标）
│   ├── style.css           # 全局样式
│   └── vite-env.d.ts       # Vite 环境变量与类型声明
├── index.html              # HTML 模板
├── package.json            # 依赖与脚本
├── tsconfig.json           # TypeScript 配置文件
└── vite.config.ts          # Vite 配置文件
```
