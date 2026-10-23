import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/transfer'
  },
  {
    path: '/transfer',
    name: 'Transfer',
    component: () => import('@/views/FileTransferView.vue'),
    meta: {
      title: '文件流转管理',
      icon: 'Files',
      desc: '内外网安全摆渡与流转审批'
    }
  },
  {
    path: '/surface',
    name: 'Surface',
    component: () => import('@/views/ICSurfaceView.vue'),
    meta: {
      title: '3D IC 响应曲面',
      icon: 'TrendCharts',
      desc: 'Three.js 芯片三维响应曲面分析'
    }
  },
  {
    path: '/instrument',
    name: 'Instrument',
    component: () => import('@/views/InstrumentView.vue'),
    meta: {
      title: 'ATE 芯片测试机台',
      icon: 'Odometer',
      desc: 'Teradyne UltraFLEX / IG-XL 风格测试仪'
    }
  },
  {
    path: '/maintenance',
    name: 'Maintenance',
    component: () => import('@/views/MaintenanceView/index.vue'),
    meta: {
      title: 'Proxima 维护校准',
      icon: 'SetUp',
      desc: 'Proxima Factory Test - Full (Online) 维护校准系统'
    }
  },
  {
    path: '/waveform',
    name: 'Waveform',
    component: () => import('@/views/WaveformView/index.vue'),
    meta: {
      title: '数字波形仿真',
      icon: 'Monitor',
      desc: 'VCD 数字波形仿真分析引擎 (支持 50M~100M 大文件)'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/transfer'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 文件摆渡管理系统`
  }
})

export default router
