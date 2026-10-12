<template>
  <div class="surface-plot-container" ref="containerRef">
    <!-- Three.js Canvas 挂载容器 -->
    <div class="canvas-viewport" ref="canvasViewportRef"></div>

    <!-- 顶部标题徽章 -->
    <div class="surface-header">
      <h2>
        IC V-F Characterization 3D Surface
        <el-tag type="success" size="small" effect="dark" round>Interactive Demo</el-tag>
      </h2>
      <p>VDD_Core vs VDD_IO vs F_Standby 响应曲面测试分析</p>
    </div>

    <!-- 控制面板 (Element Plus UI) -->
    <div class="surface-controls">
      <div class="controls-card">
        <div class="controls-title">视图与控制</div>
        
        <div class="control-item">
          <span>网格线 (Wireframe)</span>
          <el-switch v-model="showWireframe" @change="onWireframeChange" />
        </div>

        <div class="control-item">
          <span>曲面渐变 (Colormap)</span>
          <el-switch v-model="showColormap" @change="onColormapChange" />
        </div>

        <div class="control-item">
          <span>自动慢速旋转</span>
          <el-switch v-model="autoRotate" />
        </div>

        <div class="control-item">
          <span>显示打标旗帜</span>
          <el-switch v-model="showFlags" @change="onFlagsVisibleChange" />
        </div>

        <el-button
          class="action-btn"
          :type="isAddMode ? 'success' : 'primary'"
          :icon="Location"
          @click="toggleAddMode"
        >
          {{ isAddMode ? '🎯 点击曲面放置旗帜 (生效中)' : '📍 点击曲面任意处打标' }}
        </el-button>

        <el-button
          class="action-btn"
          plain
          :icon="RefreshRight"
          @click="resetView"
        >
          🔄 重置视角
        </el-button>
      </div>
    </div>

    <!-- 底部操作提示 -->
    <div class="surface-hint">
      🖱️ 鼠标左键拖拽旋转 | 右键平移 | 滚轮缩放 | 单击曲面可添加标注旗帜
    </div>

    <!-- 悬浮坐标提示框 (Hover Tooltip) -->
    <div
      v-show="tooltip.visible"
      class="hover-tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div><strong>F_Standby:</strong> {{ tooltip.freq }} MHz</div>
      <div><strong>VDD_Core:</strong> {{ tooltip.vcore }} V</div>
      <div><strong>VDD_IO:</strong> {{ tooltip.vio }} V</div>
    </div>

    <!-- 2D 旗帜标签层 (由 3D 世界坐标投影对齐) -->
    <div class="flags-layer" v-show="showFlags">
      <div
        v-for="flag in flags"
        :key="flag.id"
        v-show="flag.screenVisible"
        class="flag-marker"
        :style="{ left: flag.screenX + 'px', top: flag.screenY + 'px' }"
        :title="'点击可删除此标记 (F=' + flag.freq + 'MHz)'"
        @click.stop="removeFlag(flag.id)"
      >
        <div class="flag-content" :class="'flag-' + flag.status">
          <div class="flag-title">
            <span class="flag-icon"></span>
            F={{ flag.freq }}MHz • {{ flag.statusText }}
          </div>
          <div class="flag-value">
            Core:{{ flag.vcore }}V • IO:{{ flag.vio }}V
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Location, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 标记点接口定义
export interface FlagItem {
  id: number
  u: number
  v: number
  vcore: string
  vio: string
  freq: number
  status: 'pass' | 'warn' | 'fail'
  statusText: string
  pos3D: THREE.Vector3
  obj3D: THREE.Group
  screenX: number
  screenY: number
  screenVisible: boolean
}

// 容器 DOM 引用
const containerRef = ref<HTMLDivElement | null>(null)
const canvasViewportRef = ref<HTMLDivElement | null>(null)

// 响应式开关状态
const showWireframe = ref(true)
const showColormap = ref(true)
const autoRotate = ref(false)
const showFlags = ref(true)
const isAddMode = ref(false)

// 悬浮提示框状态
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  freq: 0,
  vcore: '0.00',
  vio: '0.00'
})

// 旗帜列表
const flags = ref<FlagItem[]>([])

// 尺寸参数
const de = 80 // X轴宽度 (VDD_Core)
const fe = 80 // Z轴深度 (VDD_IO)
const pn = 60 // Y轴高度 (F_Standby)
const ol = 48 // 曲面细分段数
const poleHeight = 12 // 图钉白杆高度

// Three.js 核心对象引用
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let surfaceMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>
let wireframeMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
let flagsGroup: THREE.Group
let animationFrameId: number
let resizeObserver: ResizeObserver | null = null

const raycaster = new THREE.Raycaster()
const pointerNDC = new THREE.Vector2()
const tempVec = new THREE.Vector3()

// 响应曲面计算函数: ul(u, v) -> freq (20 ~ 800 MHz)
function ul(i: number, t: number): number {
  const e = 0.3 + i * 1.2
  const n = 0.6 + t * 1.2
  const s = (e - 0.75) * 4 + (n - 1.1) * 2
  const r = 1 / (1 + Math.exp(-s))
  const o = Math.sin(i * Math.PI * 0.8) * Math.cos(t * Math.PI * 0.7) * 40
  const a = r * 720 + o + 60
  return Math.min(Math.max(a, 20), 800)
}

// 创建 2D 文本画布材质作为 3D 坐标轴标尺
function createTextSprite(text: string, fontSize = 28, color = '#cbd5e1', isBold = false): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px monospace, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(16, 4, 1)
  return sprite
}

// 构建坐标网格面
function createGridPlane(width: number, height: number, segW: number, segH: number, planeType: 'XZ' | 'XY' | 'YZ', pos: [number, number, number]): THREE.Group {
  const group = new THREE.Group()
  const minorMat = new THREE.LineBasicMaterial({ color: 0x222838, transparent: true, opacity: 0.8 })
  const majorMat = new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 1.5 })

  const halfW = width / 2
  const halfH = height / 2

  for (let d = 0; d <= segW; d++) {
    const f = -halfW + (width / segW) * d
    const points: THREE.Vector3[] = []
    if (planeType === 'XZ') points.push(new THREE.Vector3(f, 0, -halfH), new THREE.Vector3(f, 0, halfH))
    if (planeType === 'YZ') points.push(new THREE.Vector3(0, -halfH, f), new THREE.Vector3(0, halfH, f))
    if (planeType === 'XY') points.push(new THREE.Vector3(f, -halfH, 0), new THREE.Vector3(f, halfH, 0))
    const geom = new THREE.BufferGeometry().setFromPoints(points)
    group.add(new THREE.Line(geom, d === 0 || d === segW ? majorMat : minorMat))
  }

  for (let d = 0; d <= segH; d++) {
    const f = -halfH + (height / segH) * d
    const points: THREE.Vector3[] = []
    if (planeType === 'XZ') points.push(new THREE.Vector3(-halfW, 0, f), new THREE.Vector3(halfW, 0, f))
    if (planeType === 'YZ') points.push(new THREE.Vector3(0, f, -halfW), new THREE.Vector3(0, f, halfW))
    if (planeType === 'XY') points.push(new THREE.Vector3(-halfW, f, 0), new THREE.Vector3(halfW, f, 0))
    const geom = new THREE.BufferGeometry().setFromPoints(points)
    group.add(new THREE.Line(geom, d === 0 || d === segH ? majorMat : minorMat))
  }

  group.position.set(...pos)
  return group
}

// 初始化 Three.js 场景
function initThree() {
  if (!canvasViewportRef.value) return

  const container = canvasViewportRef.value
  const width = container.clientWidth || 800
  const height = container.clientHeight || 600

  // 1. 场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b0d13')

  // 2. 相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(130, 90, 140)

  // 3. 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  container.appendChild(renderer.domElement)

  // 4. 控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(0, 25, 0)
  controls.maxPolarAngle = Math.PI / 2 + 0.05

  // 5. 光照
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
  scene.add(ambientLight)

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2)
  dirLight1.position.set(60, 120, 80)
  scene.add(dirLight1)

  const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6)
  dirLight2.position.set(-80, 50, -60)
  scene.add(dirLight2)

  // 6. 曲面几何体
  const planeGeom = new THREE.PlaneGeometry(de, fe, ol, ol)
  planeGeom.rotateX(-Math.PI / 2) // 旋转至 XZ 水平面

  const posAttr = planeGeom.attributes.position
  const colors: number[] = []
  const colPass = new THREE.Color('#22c55e')
  const colWarn = new THREE.Color('#eab308')
  const colFail = new THREE.Color('#ef4444')

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i)
    const vz = posAttr.getZ(i)
    const uNorm = (vx + de / 2) / de
    const vNorm = (vz + fe / 2) / fe
    const freq = ul(uNorm, vNorm)
    const vy = (freq / 800) * pn
    posAttr.setY(i, vy)

    const ratio = freq / 800
    const vertexColor = new THREE.Color()
    if (ratio < 0.5) {
      vertexColor.lerpColors(colPass, colWarn, ratio / 0.5)
    } else {
      vertexColor.lerpColors(colWarn, colFail, (ratio - 0.5) / 0.5)
    }
    colors.push(vertexColor.r, vertexColor.g, vertexColor.b)
  }

  planeGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  planeGeom.computeVertexNormals()

  const surfaceMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0.15,
    side: THREE.DoubleSide
  })
  surfaceMesh = new THREE.Mesh(planeGeom, surfaceMaterial)
  scene.add(surfaceMesh)

  // 网格线覆层
  const wireframeMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  })
  wireframeMesh = new THREE.Mesh(planeGeom, wireframeMat)
  scene.add(wireframeMesh)

  // 7. 坐标轴及参考网格
  const gridsGroup = new THREE.Group()
  gridsGroup.add(createGridPlane(de, fe, 8, 8, 'XZ', [0, 0, 0]))
  gridsGroup.add(createGridPlane(de, pn, 8, 8, 'XY', [0, pn / 2, -fe / 2]))
  gridsGroup.add(createGridPlane(fe, pn, 8, 8, 'YZ', [-de / 2, pn / 2, 0]))
  scene.add(gridsGroup)

  // 8. 标尺刻度及文字
  const labelsGroup = new THREE.Group()
  // Y 轴刻度 (F_Standby: 0 ~ 800 MHz)
  for (let i = 0; i <= 8; i += 1) {
    const val = i * 100
    const yPos = (val / 800) * pn
    const sprite = createTextSprite(val.toString(), 28, '#cbd5e1')
    sprite.position.set(-de / 2 - 8, yPos, -fe / 2)
    labelsGroup.add(sprite)
  }
  const fTitle = createTextSprite('F_Standby', 32, '#f8fafc', true)
  fTitle.position.set(-de / 2 - 20, pn * 0.5, -fe / 2)
  labelsGroup.add(fTitle)

  // X 轴刻度 (VDD_Core: 0.3 ~ 1.5 V)
  for (let i = 0; i <= 4; i++) {
    const val = (0.3 + i * 0.3).toFixed(1)
    const xPos = -de / 2 + (i / 4) * de
    const sprite = createTextSprite(val, 28, '#cbd5e1')
    sprite.position.set(xPos, -3, fe / 2 + 6)
    labelsGroup.add(sprite)
  }
  const vcoreTitle = createTextSprite('VDD_Core', 32, '#f8fafc', true)
  vcoreTitle.position.set(0, -8, fe / 2 + 15)
  labelsGroup.add(vcoreTitle)

  // Z 轴刻度 (VDD_IO: 0.6 ~ 1.8 V)
  for (let i = 0; i <= 4; i++) {
    const val = (0.6 + i * 0.3).toFixed(1)
    const zPos = -fe / 2 + (i / 4) * fe
    const sprite = createTextSprite(val, 28, '#cbd5e1')
    sprite.position.set(de / 2 + 8, -3, zPos)
    labelsGroup.add(sprite)
  }
  const vioTitle = createTextSprite('VDD_IO', 32, '#f8fafc', true)
  vioTitle.position.set(de / 2 + 18, -8, 0)
  labelsGroup.add(vioTitle)

  scene.add(labelsGroup)

  // 9. 旗帜图钉组
  flagsGroup = new THREE.Group()
  scene.add(flagsGroup)

  // 10. 初始化 6 个默认采样点（无穿透、完全贴合曲面）
  const defaultPoints = [
    { u: 0.15, v: 0.85 },
    { u: 0.25, v: 0.15 },
    { u: 0.45, v: 0.55 },
    { u: 0.65, v: 0.35 },
    { u: 0.75, v: 0.75 },
    { u: 0.90, v: 0.90 }
  ]
  defaultPoints.forEach(pt => addFlag(pt.u, pt.v))

  // 11. 绑定交互事件
  bindInteractions()

  // 12. 启动渲染循环
  animate()

  // 13. 监听容器自适应缩放
  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })
  resizeObserver.observe(container)
}

// 创建并放置图钉与标签
function addFlag(u: number, v: number, localY?: number) {
  const posX = -de / 2 + u * de
  const posZ = -fe / 2 + v * fe
  const surfaceFreq = ul(u, v)
  const freq = Math.round(surfaceFreq)
  const surfaceY = localY !== undefined ? localY : (surfaceFreq / 800) * pn

  const vcore = (0.3 + u * 1.2).toFixed(2)
  const vio = (0.6 + v * 1.2).toFixed(2)
  const status: 'pass' | 'warn' | 'fail' = freq > 700 ? 'fail' : freq > 550 ? 'warn' : 'pass'
  const statusText = status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'Warn'

  // 创建 3D 白杆柱子 (底部对准 surfaceY，绝不穿透曲面下方)
  const cylinderGeom = new THREE.CylinderGeometry(0.25, 0.25, poleHeight)
  cylinderGeom.translate(0, poleHeight / 2, 0) // 几何中心上移，使坐标原点为圆柱底部
  const poleMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const poleMesh = new THREE.Mesh(cylinderGeom, poleMat)
  poleMesh.position.set(posX, surfaceY, posZ)

  // 顶端彩色圆珠
  const sphereGeom = new THREE.SphereGeometry(1.2, 16, 16)
  const beadColor = status === 'pass' ? 0x22c55e : status === 'fail' ? 0xef4444 : 0xeab308
  const sphereMat = new THREE.MeshStandardMaterial({
    color: beadColor,
    emissive: beadColor,
    emissiveIntensity: 0.6
  })
  const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat)
  sphereMesh.position.set(posX, surfaceY + poleHeight, posZ)

  const pinGroup = new THREE.Group()
  pinGroup.add(poleMesh)
  pinGroup.add(sphereMesh)
  flagsGroup.add(pinGroup)

  const flagItem: FlagItem = {
    id: Date.now() + Math.random(),
    u,
    v,
    vcore,
    vio,
    freq,
    status,
    statusText,
    pos3D: new THREE.Vector3(posX, surfaceY + poleHeight, posZ),
    obj3D: pinGroup,
    screenX: 0,
    screenY: 0,
    screenVisible: true
  }

  flags.value.push(flagItem)
}

// 移除标记
function removeFlag(id: number) {
  const index = flags.value.findIndex(f => f.id === id)
  if (index !== -1) {
    const item = flags.value[index]
    flagsGroup.remove(item.obj3D)
    flags.value.splice(index, 1)
    ElMessage.success('已移除该标记')
  }
}

// 射线拾取计算
function getRaycastHit(event: MouseEvent) {
  if (!canvasViewportRef.value) return null
  const rect = canvasViewportRef.value.getBoundingClientRect()
  pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointerNDC, camera)
  const intersects = raycaster.intersectObject(surfaceMesh)
  if (intersects.length > 0) {
    const hit = intersects[0]
    // 转换为曲面本体坐标系，避免场景旋转导致坐标换算错误
    const localPoint = surfaceMesh.worldToLocal(hit.point.clone())
    const uNorm = Math.min(Math.max((localPoint.x + de / 2) / de, 0), 1)
    const vNorm = Math.min(Math.max((localPoint.z + fe / 2) / fe, 0), 1)
    const freq = Math.round((localPoint.y / pn) * 800)
    const vcore = (0.3 + uNorm * 1.2).toFixed(2)
    const vio = (0.6 + vNorm * 1.2).toFixed(2)
    return { uNorm, vNorm, localY: localPoint.y, freq, vcore, vio }
  }
  return null
}

// 鼠标交互事件绑定
let downX = 0
let downY = 0

function bindInteractions() {
  const dom = renderer.domElement

  dom.addEventListener('pointermove', (e: MouseEvent) => {
    const hit = getRaycastHit(e)
    if (hit) {
      const rect = canvasViewportRef.value!.getBoundingClientRect()
      tooltip.visible = true
      tooltip.x = e.clientX - rect.left + 15
      tooltip.y = e.clientY - rect.top - 15
      tooltip.freq = hit.freq
      tooltip.vcore = hit.vcore
      tooltip.vio = hit.vio
    } else {
      tooltip.visible = false
    }
  })

  dom.addEventListener('pointerleave', () => {
    tooltip.visible = false
  })

  dom.addEventListener('pointerdown', (e: MouseEvent) => {
    downX = e.clientX
    downY = e.clientY
  })

  dom.addEventListener('pointerup', (e: MouseEvent) => {
    // 拖拽位移大于 5px 视为旋转视图，不触发打标
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return

    const hit = getRaycastHit(e)
    if (hit) {
      addFlag(hit.uNorm, hit.vNorm, hit.localY)
      ElMessage.success(`已添加打标：F=${hit.freq}MHz (Core:${hit.vcore}V, IO:${hit.vio}V)`)
      if (isAddMode.value) isAddMode.value = false
    }
  })
}

// 更新 2D 旗帜屏幕投影坐标
function updateFlagsScreenPosition() {
  if (!canvasViewportRef.value || !camera) return
  const rect = canvasViewportRef.value.getBoundingClientRect()
  const halfW = rect.width / 2
  const halfH = rect.height / 2

  flags.value.forEach(flag => {
    // 将模型局部坐标通过 scene.matrixWorld 转为世界坐标后投影
    tempVec.copy(flag.pos3D).applyMatrix4(scene.matrixWorld)
    tempVec.project(camera)

    // 在视锥之外或位于相机后方时不显示
    if (tempVec.z > 1 || tempVec.z < -1) {
      flag.screenVisible = false
      return
    }

    flag.screenVisible = true
    flag.screenX = tempVec.x * halfW + halfW
    flag.screenY = -tempVec.y * halfH + halfH
  })
}

// 动画主循环
function animate() {
  animationFrameId = requestAnimationFrame(animate)

  if (autoRotate.value && scene) {
    scene.rotation.y += 0.003
  }

  controls.update()
  updateFlagsScreenPosition()
  renderer.render(scene, camera)
}

// 容器尺寸调整
function handleResize() {
  if (!canvasViewportRef.value || !camera || !renderer) return
  const w = canvasViewportRef.value.clientWidth
  const h = canvasViewportRef.value.clientHeight
  if (w === 0 || h === 0) return

  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

// 控制面板方法
function onWireframeChange(val: boolean | string | number) {
  if (wireframeMesh) wireframeMesh.visible = !!val
}

function onColormapChange(val: boolean | string | number) {
  if (surfaceMesh) {
    const mat = surfaceMesh.material
    mat.vertexColors = !!val
    mat.color.set(val ? 0xffffff : 0x334155)
    mat.needsUpdate = true
  }
}

function onFlagsVisibleChange(val: boolean | string | number) {
  if (flagsGroup) flagsGroup.visible = !!val
}

function toggleAddMode() {
  isAddMode.value = !isAddMode.value
  if (isAddMode.value) {
    ElMessage.info('请在 3D 曲面上单击鼠标任意位置以放置打标旗帜')
  }
}

function resetView() {
  if (!camera || !controls) return
  camera.position.set(130, 90, 140)
  controls.target.set(0, 25, 0)
  controls.update()
  ElMessage.success('视图视角已重置')
}

onMounted(() => {
  initThree()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
  if (resizeObserver) resizeObserver.disconnect()
  if (renderer) renderer.dispose()
})
</script>

<style scoped>
.surface-plot-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 620px;
  background-color: #0d0f14;
  overflow: hidden;
  user-select: none;
  border-radius: 8px;
}

.canvas-viewport {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* 顶部标题 */
.surface-header {
  position: absolute;
  top: 20px;
  left: 24px;
  z-index: 10;
  pointer-events: none;
}

.surface-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.surface-header p {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 控制面板 */
.surface-controls {
  position: absolute;
  top: 20px;
  right: 24px;
  z-index: 20;
}

.controls-card {
  background: rgba(18, 22, 31, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 16px;
  width: 250px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.controls-title {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.control-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 13px;
  color: #cbd5e1;
}

.action-btn {
  width: 100%;
  margin-top: 10px;
  margin-left: 0 !important;
}

/* 底部提示 */
.surface-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: #94a3b8;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.75);
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
  z-index: 10;
}

/* 悬浮 Tooltip */
.hover-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.88);
  border: 1px solid #38bdf8;
  color: #f8fafc;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

/* 2D 旗帜标签 */
.flags-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.flag-marker {
  position: absolute;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  transition: transform 0.15s ease-out, filter 0.2s ease;
  z-index: 15;
}

.flag-marker:hover {
  transform: translate(-50%, -105%) scale(1.08);
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
  z-index: 30;
}

.flag-content {
  background: rgba(15, 20, 28, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.35;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
}

.flag-title {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.flag-icon {
  width: 8px;
  height: 8px;
  display: inline-block;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.flag-pass {
  color: #4ade80;
}
.flag-pass .flag-icon {
  background: #22c55e;
}

.flag-warn {
  color: #facc15;
}
.flag-warn .flag-icon {
  background: #eab308;
}

.flag-fail {
  color: #f87171;
}
.flag-fail .flag-icon {
  background: #ef4444;
}

.flag-value {
  color: #cbd5e1;
  font-size: 10px;
}
</style>
