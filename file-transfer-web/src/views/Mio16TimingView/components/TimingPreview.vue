<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { scaleLinear } from 'd3-scale'
import TimingLane from './TimingLane.vue'
import { validatePin, type TimingConfig } from '../model'
const props = defineProps<{ config: TimingConfig; selected: string; mode: 'format' | 'data' }>()
const emit = defineEmits<{ select: [id: string]; 'update:mode': [mode: 'format' | 'data'] }>()
const periods = ref(1)
const zoom = ref(1)
const fitToViewport = ref(false)
const scroll = ref<HTMLDivElement>()
const viewportWidth = ref(600)
watch(scroll, (element, _old, cleanup) => {
  if (!element) return
  const observer = new ResizeObserver(() => { viewportWidth.value = element.clientWidth })
  observer.observe(element)
  cleanup(() => observer.disconnect())
})
const periodValid = computed(() => Number.isFinite(props.config.period) && props.config.period > 0 && Number.isFinite(props.config.period * 32))
const total = computed(() => periodValid.value ? props.config.period * periods.value : 1)
const baseWidth = computed(() => fitToViewport.value
  ? viewportWidth.value
  : Math.max(360, viewportWidth.value, 120 + periods.value * 240))
const width = computed(() => baseWidth.value * zoom.value)
const scale = computed(() => scaleLinear().domain([0, total.value]).range([112, width.value - 24]))
const x = (time: number) => scale.value(time)
const ticks = computed(() => scale.value.ticks(Math.min(40, Math.max(4, Math.floor(width.value / 100)))).filter(t => t < total.value).concat(total.value))
const cycles = computed(() => Array.from({ length: periods.value }, (_, i) => i))
const lanes = computed(() => props.config.pins.map(pin => ({ pin, errors: periodValid.value ? validatePin(pin, props.config.period, props.config.mux) : ['Period 必须为大于 0 的有效数值'] })))
async function setZoom(next: number) {
  const el = scroll.value
  const anchor = el ? scale.value.invert(el.scrollLeft + el.clientWidth / 2) : 0
  zoom.value = Math.min(8, Math.max(1, next))
  await nextTick()
  if (el) el.scrollLeft = x(anchor) - el.clientWidth / 2
}
async function fitAllPeriods() {
  fitToViewport.value = true
  zoom.value = 1
  await nextTick()
  if (scroll.value) scroll.value.scrollLeft = 0
}
function onWheel(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  void setZoom(zoom.value * (event.deltaY < 0 ? 2 : .5))
}
function fmt(value: number) { return Number(value.toPrecision(7)).toString() }
</script>
<template>
  <section class="mio-panel preview-panel">
    <header class="panel-heading">
      <div><span class="section-index">02</span><h2>全部 PIN 时序</h2><span class="muted">{{ config.pins.length }} channels</span></div>
      <span class="muted">共用时间轴 · ns</span>
    </header>
    <div class="preview-toolbar">
      <label>Periods <select v-model.number="periods" aria-label="Periods"><option v-for="n in [1, 2, 3, 4, 8, 16]" :key="n" :value="n">{{ n }}</option></select></label>
      <div class="segmented"><button :aria-pressed="mode === 'format'" @click="emit('update:mode', 'format')">格式示意</button><button :aria-pressed="mode === 'data'" @click="emit('update:mode', 'data')">数据波形</button></div>
      <div class="zoom-controls"><button aria-label="缩小" :disabled="zoom === 1" @click="setZoom(zoom / 2)">−</button><span>{{ zoom }}×</span><button aria-label="放大" :disabled="zoom === 8" @click="setZoom(zoom * 2)">＋</button><button :aria-pressed="fitToViewport && zoom === 1" @click="fitAllPeriods">适配</button></div>
    </div>
    <div ref="scroll" class="wave-scroll" tabindex="0" aria-label="全部 PIN 波形画布，可横向和纵向滚动；Ctrl 加滚轮缩放" @wheel="onWheel">
      <div :style="{ width: `${width}px` }" class="wave-canvas">
        <svg class="shared-time-axis" :width="width" height="58" :viewBox="`0 0 ${width} 58`" role="img" aria-label="全部 PIN 共用时间轴">
          <rect :width="width" height="58" fill="#1c2b3d"/>
          <text x="12" y="23" class="tick-label">PIN / ns</text>
          <template v-if="periodValid">
            <g v-for="tick in ticks" :key="tick"><text :x="x(tick)" y="23" :text-anchor="tick === total ? 'end' : 'middle'" class="tick-label">{{ fmt(tick) }}</text><line :x1="x(tick)" :x2="x(tick)" y1="29" y2="35" stroke="#71849d"/></g>
            <text v-for="cycle in cycles" :key="cycle" :x="x((cycle + .5) * config.period)" y="49" text-anchor="middle" class="cycle-label">P{{ cycle + 1 }}</text>
          </template>
        </svg>
        <svg class="all-pin-waves" :width="width" :height="lanes.length * 132" :viewBox="`0 0 ${width} ${lanes.length * 132}`" role="img" :aria-label="`全部 ${lanes.length} 个 PIN · ${periods} 周期${mode === 'format' ? '格式示意' : '数据波形'}`">
          <TimingLane v-for="({ pin, errors }, index) in lanes" :key="pin.id" :transform="`translate(0 ${index * 132})`" :pin="pin" :period="config.period" :periods="periods" :mode="mode" :x="x" :width="width" :selected="selected === pin.id" :errors="errors" @select="emit('select', $event)"/>
        </svg>
        <div class="wave-pin-labels" :style="{ marginTop: `-${lanes.length * 132}px` }" aria-hidden="true">
          <div v-for="{ pin } in lanes" :key="pin.id" class="wave-pin-label" :class="{ active: selected === pin.id }">{{ pin.id }}<small>{{ pin.format }}</small></div>
        </div>
      </div>
    </div>
    <div class="legend"><span><i class="legend-drive"></i>{{ mode === 'format' ? '双状态示意' : 'Pattern 数据' }}</span><span><i class="legend-prior"></i>前态</span><span><i class="legend-r0"></i>R0</span><span><i class="legend-r1"></i>R1</span></div>
    <p class="preview-note">所有 PIN 同时绘制，点击仅高亮。{{ mode === 'data' ? '在左侧表格编辑各 PIN 的 Pattern 与初态。' : '格式示意叠加两种数据状态。' }}短刻度表示配置沿的位置。SDR 的 R 标记仅展示比较配置位置。</p>
  </section>
</template>
