import { createApp } from 'vue'
import ElementPlus from 'element-plus'
// 现代化全局样式重置规范 (Reset CSS)
import './styles/reset.css'
import 'element-plus/dist/index.css'
// Element Plus 官方暗黑模式变量预设
import 'element-plus/theme-chalk/dark/css-vars.css'
// Unity 引擎级暗黑工业主题 (变量覆盖与密度压缩)
import './styles/unity-theme.css'
// 全局过渡动效库
import './styles/transition.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// 全局注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 官方全局配置：默认尺寸为 small (单行低高度与高空间利用率)，语言为中文
app.use(ElementPlus, {
  size: 'small',
  locale: zhCn
})

app.use(router)

app.mount('#app')
