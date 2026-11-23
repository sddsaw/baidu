<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { scaleLinear } from 'd3-scale'

defineOptions({
  name: 'TimesetBasic',
})

type TimingKey = 'd0' | 'd1' | 'd2' | 'd3' | 'r0' | 'r1'
type CompareMode = 'Edge' | 'Window' | 'Off'
type PinFormat = 'NR' | 'RL' | 'RH' | 'RZ'
interface TimingRow {
  id: number
  pin: string
  compareMode: CompareMode
  format: PinFormat
  d0: number
  d1: number
  d2: number
  d3: number
  r0: number
  r1: number
}

// Keep the editor self-contained so this single Vue file can be reused independently.
const timingColumns: { key: TimingKey; label: string }[] = [
  { key: 'd0', label: 'D0' }, { key: 'd1', label: 'D1' },
  { key: 'd2', label: 'D2' }, { key: 'd3', label: 'D3' },
  { key: 'r0', label: 'R0' }, { key: 'r1', label: 'R1' },
]
const compareModes: CompareMode[] = ['Edge', 'Window', 'Off']
const compareKeys: Record<CompareMode, readonly ('r0' | 'r1')[]> = {
  Edge: ['r0'], Window: ['r0', 'r1'], Off: [],
}
const formats: PinFormat[] = ['NR', 'RL', 'RH', 'RZ']
const rows = ref<TimingRow[]>(['a1', 'a0', 'a0', 'a0', 'a0'].map((pin, id) => ({
  id, pin, compareMode: 'Edge', format: id === 0 ? 'NR' : 'RL',
  d0: 20, d1: 50, d2: 0, d3: 75, r0: 80, r1: 0,
})))
const period = shallowRef(100)
const periods = shallowRef(1)
const zoom = shallowRef(1)
const maxZoom = 8
const chartScroll = useTemplateRef<HTMLDivElement>('chartScroll')
const plotWidth = computed(() => 500 * zoom.value)
const chartWidth = computed(() => 100 + plotWidth.value)
const previewDuration = computed(() => periods.value * period.value)
const scale = computed(() => scaleLinear()
  .domain([0, previewDuration.value])
  .range([52, 52 + plotWidth.value]))
const timeX = (time: number) => scale.value(time)
const cycleWidth = computed(() => timeX(period.value) - timeX(0))
const cycles = computed(() => Array.from({ length: periods.value }, (_, index) => ({
  index,
  offsetX: index * cycleWidth.value,
  startTime: index * period.value,
})))
const periodDraft = shallowRef('100')
const selectedRow = shallowRef(0)
const activeCell = shallowRef<{ rowId: number; key: TimingKey } | null>(null)
const cellDraft = shallowRef('')
const cellError = shallowRef('')
const workspace = useTemplateRef<HTMLElement>('workspace')
const cellInput = shallowRef<HTMLInputElement | null>(null)
const rate = computed(() => {
  const mhz = 1000 / period.value
  return mhz >= 1 ? `${mhz.toFixed(2)} MHz` : `${(mhz * 1000).toFixed(2)} kHz`
})
const maximumTiming = computed(() => Math.max(...rows.value.flatMap(row =>
  timingColumns.map(column => row[column.key]),
)))
const periodError = computed(() => {
  const value = Number(periodDraft.value)
  if (periodDraft.value.trim() === '' || !Number.isFinite(value) || value <= 0) {
    return 'Period 必须是大于 0 的有效数值，单位为 ns。'
  }
  if (value < maximumTiming.value) return `Period 不能小于当前最大时序值 ${maximumTiming.value} ns。`
  return ''
})
const ticks = computed(() => {
  const times = scale.value.ticks(5 * zoom.value)
  const end = previewDuration.value
  // Reserve room for the exact endpoint even when D3 chooses a rounded interval.
  const visible = times.filter(time => time === 0 || timeX(end) - timeX(time) >= 42)
  return [...visible, end].map(time => ({ x: timeX(time), label: formatNumber(time) }))
})

async function setZoom(next: number) {
  const viewport = chartScroll.value
  if (!viewport || next === zoom.value) return
  const oldWidth = viewport.scrollWidth
  const unitsPerPixel = chartWidth.value / oldWidth
  const center = viewport.clientWidth / 2
  const anchorTime = scale.value.invert((viewport.scrollLeft + center) * unitsPerPixel)
  zoom.value = Math.max(1, Math.min(maxZoom, next))
  await nextTick()
  viewport.scrollLeft = timeX(anchorTime) * viewport.scrollWidth / chartWidth.value - center
}

// A pending Period can also become valid after the pin timings are reduced.
watch([periodDraft, maximumTiming], () => {
  if (!periodError.value) period.value = Number(periodDraft.value)
}, { flush: 'sync' })

function formatNumber(value: number) {
  return Number(value.toPrecision(10)).toString()
}

function updatePeriod(event: Event) {
  periodDraft.value = (event.target as HTMLInputElement).value
}

function resetPeriod() {
  periodDraft.value = String(period.value)
}

function isEditing(rowId: number, key: TimingKey) {
  return activeCell.value?.rowId === rowId && activeCell.value.key === key
}

function setCellInput(element: unknown) {
  cellInput.value = element instanceof HTMLInputElement ? element : null
}

function updateCellDraft(event: Event) {
  cellDraft.value = (event.target as HTMLInputElement).value
  cellError.value = ''
}

async function startEditing(row: TimingRow, key: TimingKey) {
  if (activeCell.value && !commitCell()) return
  selectedRow.value = row.id
  cellDraft.value = String(row[key])
  cellError.value = ''
  activeCell.value = { rowId: row.id, key }
  await nextTick()
  cellInput.value?.focus()
  cellInput.value?.select()
}

function restoreCellFocus(cell: { rowId: number; key: TimingKey }) {
  nextTick(() => workspace.value?.querySelector<HTMLButtonElement>(
    `[data-cell="${cell.rowId}-${cell.key}"]`,
  )?.focus())
}

function commitCell(restoreFocus = false) {
  const cell = activeCell.value
  if (!cell) return true
  const value = Number(cellDraft.value)
  if (cellDraft.value.trim() === '' || !Number.isFinite(value) || value < 0 || value > period.value) {
    cellError.value = `${cell.key.toUpperCase()} 请输入 0 至 ${formatNumber(period.value)} ns 之间的数值。`
    return false
  }
  const row = rows.value.find(item => item.id === cell.rowId)
  if (row) row[cell.key] = value
  activeCell.value = null
  cellError.value = ''
  if (restoreFocus) restoreCellFocus(cell)
  return true
}

function cancelEditing() {
  const cell = activeCell.value
  activeCell.value = null
  cellError.value = ''
  if (cell) restoreCellFocus(cell)
}

const laneY = (index: number) => 100 + index * 104

// Preview the non-NR formats; NR uses its own dual-line paths below.
function drivePath(row: TimingRow, index: number) {
  const y = laneY(index)
  const start = timeX(Math.min(row.d0, row.d1))
  const end = timeX(Math.max(row.d0, row.d1))
  const baseline = row.format === 'RH' ? y - 9 : y + 9
  const level = row.format === 'RH' ? y + 9 : y - 9
  if (row.format === 'RZ') {
    return `M 52 ${y} H ${start} V ${level} H ${end} V ${y} H ${timeX(period.value)}`
  }
  return `M 52 ${baseline} H ${start} V ${level} H ${end} V ${baseline} H ${timeX(period.value)}`
}

// NR 仅在首周期的 D1 交叉一次，此后保持两条实线直到预览终点。
function nrTrace(row: TimingRow, index: number) {
  const y = laneY(index)
  const d1 = timeX(row.d1)
  const start = timeX(0)
  const end = timeX(previewDuration.value)
  const halfWidth = Math.min(6, d1 - start, end - d1)
  const left = d1 - halfWidth
  const right = d1 + halfWidth
  const top = y - 6
  const bottom = y + 6
  const lead = `M ${left} ${top} H ${start} M ${left} ${bottom} H ${start}`
  const drive = halfWidth > 0
    ? `M ${left} ${top} L ${right} ${bottom} H ${end} M ${left} ${bottom} L ${right} ${top} H ${end}`
    : `M ${d1} ${top} H ${end} M ${d1} ${bottom} H ${end}`
  return { lead, drive }
}
const nrTraces = computed(() => rows.value.map((row, index) => nrTrace(row, index)))
</script>

<template>
  <section ref="workspace" class="timeset-basic" aria-labelledby="timeset-title">
    <header class="workspace-header">
      <div class="page-heading">
        <svg class="heading-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2 16h5V7h5v9h5V7h5" stroke="currentColor" stroke-width="1.8" />
        </svg>
        <h1 id="timeset-title">Timeset Basic</h1>
        <span class="heading-divider"></span>
        <span class="heading-caption">基础时序配置</span>
      </div>
      <span class="unit-caption">TIME UNIT <strong>ns</strong></span>
    </header>

    <div class="editor-layout">
      <section class="configuration-panel" aria-label="时序参数配置">
        <div class="period-settings">
          <div class="setting-row">
            <label for="timeset-period" class="setting-label">Period</label>
            <div class="period-control" :class="{ 'has-error': periodError }">
              <input
                id="timeset-period"
                :value="periodDraft"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                :aria-invalid="Boolean(periodError)"
                :aria-describedby="periodError ? 'period-error' : 'period-help'"
                @input="updatePeriod"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
                @keydown.esc="resetPeriod"
              />
              <span class="input-unit">ns</span>
            </div>
          </div>
          <div class="setting-row rate-row">
            <span class="setting-label">Rate</span>
            <output for="timeset-period" class="rate-value" aria-live="polite">{{ rate }}</output>
          </div>
          <p v-if="periodError" id="period-error" class="validation-message" role="alert">{{ periodError }}</p>
          <p v-else id="period-help" class="setting-help">Period 为当前周期终点，所有时序值均以 ns 为单位。</p>
        </div>

        <div class="table-scroll">
          <table class="timing-table">
            <caption class="sr-only">引脚时序参数。PIN 只读，其余参数可编辑。</caption>
            <colgroup>
              <col class="pin-column" />
              <col class="compare-column" />
              <col class="format-column" />
              <col v-for="column in timingColumns" :key="column.key" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" class="pin-cell">PIN <span class="readonly-mark" title="PIN 只读" aria-label="只读">⌑</span></th>
                <th scope="col">COMPARE MODE</th>
                <th scope="col">FORMAT</th>
                <th v-for="column in timingColumns" :key="column.key" scope="col">{{ column.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in rows" :key="row.id" :class="{ 'is-selected': selectedRow === row.id }" @click="selectedRow = row.id">
                <th scope="row" class="pin-cell"><span class="pin-name">{{ row.pin }}</span></th>
                <td>
                  <select v-model="row.compareMode" class="cell-select" :aria-label="`第 ${index + 1} 行 ${row.pin} Compare Mode`" @focus="selectedRow = row.id">
                    <option v-for="mode in compareModes" :key="mode" :value="mode">{{ mode }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="row.format" class="cell-select format-select" :aria-label="`第 ${index + 1} 行 ${row.pin} FORMAT`" @focus="selectedRow = row.id">
                    <option v-for="format in formats" :key="format" :value="format">{{ format }}</option>
                  </select>
                </td>
                <td v-for="column in timingColumns" :key="column.key" :class="{ 'editing-cell': isEditing(row.id, column.key), 'invalid-cell': isEditing(row.id, column.key) && cellError }">
                  <input
                    v-if="isEditing(row.id, column.key)"
                    :ref="setCellInput"
                    :value="cellDraft"
                    class="cell-input"
                    type="number"
                    min="0"
                    :max="period"
                    step="any"
                    inputmode="decimal"
                    :aria-label="`第 ${index + 1} 行 ${row.pin} ${column.label}，单位 ns`"
                    :aria-invalid="Boolean(cellError)"
                    :aria-describedby="cellError ? 'cell-error' : undefined"
                    @input="updateCellDraft"
                    @blur="commitCell()"
                    @keydown.enter.prevent="commitCell(true)"
                    @keydown.esc.prevent="cancelEditing"
                  />
                  <button
                    v-else
                    type="button"
                    class="cell-value"
                    :data-cell="`${row.id}-${column.key}`"
                    :aria-label="`第 ${index + 1} 行 ${row.pin} ${column.label}，${row[column.key]} ns，点击编辑`"
                    @click="startEditing(row, column.key)"
                  >{{ formatNumber(row[column.key]) }}<span class="cell-unit">ns</span></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="cellError" id="cell-error" class="validation-message cell-error" role="alert">{{ cellError }}</p>
        <div class="table-help">
          <span>PIN 只读 · 点击单元格编辑</span>
          <span><kbd>Enter</kbd> 确认 <kbd>Esc</kbd> 取消</span>
        </div>
      </section>

      <section class="waveform-panel" aria-labelledby="waveform-title">
        <div class="waveform-heading">
          <h2 id="waveform-title">时序预览</h2>
          <label class="periods-control">
            periods
            <select v-model="periods">
              <option v-for="count in [1, 2, 3]" :key="count" :value="count">{{ count }}</option>
            </select>
          </label>
          <div class="zoom-controls" role="group" aria-label="时间轴缩放">
            <button type="button" aria-label="缩小时间轴" :disabled="zoom === 1" @click="setZoom(zoom / 2)">−</button>
            <output>{{ zoom }}×</output>
            <button type="button" aria-label="放大时间轴" :disabled="zoom === maxZoom" @click="setZoom(zoom * 2)">+</button>
          </div>
          <span class="preview-range">0 — {{ formatNumber(previewDuration) }} ns</span>
        </div>
        <div ref="chartScroll" class="waveform-scroll" tabindex="0" role="region" aria-label="可横向滚动的时序图">
          <svg class="waveform-svg" :viewBox="`0 0 ${chartWidth} 568`" :style="{width: `${chartWidth / 600 * 100}%`, minWidth: `${380 * chartWidth / 600}px`}" role="img" :aria-label="`${rows.length} 个引脚的时序预览，${periods} 个周期，共 ${formatNumber(previewDuration)} ns`">
            <g class="time-grid">
              <g v-for="tick in ticks" :key="tick.x">
                <line :x1="tick.x" :x2="tick.x" y1="42" y2="556" />
                <text :x="tick.x" y="27" text-anchor="middle">{{ tick.label }}</text>
              </g>
              <text :x="chartWidth - 15" y="27" text-anchor="end">ns</text>
            </g>
            <line v-for="cycle in cycles" :key="cycle.index" class="period-end" :x1="timeX(period) + cycle.offsetX" :x2="timeX(period) + cycle.offsetX" y1="42" y2="556" />
            <g v-for="(row, index) in rows" :key="row.id" class="wave-lane" :class="{ 'selected-lane': selectedRow === row.id }">
              <rect class="lane-background" x="0" :y="laneY(index) - 51" :width="chartWidth" height="104" />
              <line class="lane-separator" x1="0" :x2="chartWidth" :y1="laneY(index) + 52" :y2="laneY(index) + 52" />
              <text class="wave-pin" x="14" :y="laneY(index) - 24">{{ row.pin }}</text>
              <g v-if="row.format === 'NR'" class="nr-wave">
                <path class="nr-wave-dashed" :d="nrTraces[index].lead" />
                <path :d="nrTraces[index].drive" />
              </g>
              <g v-for="cycle in cycles" :key="cycle.index" :transform="`translate(${cycle.offsetX} 0)`">
                <line v-if="row.format !== 'NR'" class="wave-baseline" x1="52" :x2="timeX(period)" :y1="laneY(index)" :y2="laneY(index)" />
                <g v-if="row.format !== 'NR'" class="auxiliary-edges">
                  <line v-for="key in (['d2', 'd3'] as const)" :key="key" :x1="timeX(row[key])" :x2="timeX(row[key])" :y1="laneY(index) - 13" :y2="laneY(index) + 13">
                    <title>{{ key.toUpperCase() }}: {{ formatNumber(cycle.startTime + row[key]) }} ns</title>
                  </line>
                </g>
                <path v-if="row.format !== 'NR'" class="drive-wave" :d="drivePath(row, index)" />
                <text v-if="row.format !== 'NR' || cycle.index === 0" class="edge-label" :x="timeX(row.d0)" :y="laneY(index) - 20" :text-anchor="row.d0 > period * 0.8 ? 'end' : 'start'">D0 {{ formatNumber(cycle.startTime + row.d0) }}ns</text>
                <text v-if="row.format !== 'NR' || cycle.index === 0" class="edge-label" :x="timeX(row.d1)" :y="laneY(index) + 31" :text-anchor="row.d1 < period * 0.2 ? 'start' : 'end'">D1 {{ formatNumber(cycle.startTime + row.d1) }}ns</text>
                <g v-if="row.format === 'NR'" class="nr-compare">
                  <g v-for="key in compareKeys[row.compareMode]" :key="key" :transform="`translate(${timeX(row[key])} ${laneY(index)})`">
                    <title>{{ key.toUpperCase() }} · {{ formatNumber(cycle.startTime + row[key]) }} ns</title>
                    <line x1="0" x2="0" :y1="key === 'r0' ? -32 : -12" :y2="key === 'r1' ? 32 : 12" />
                    <text x="0" :y="key === 'r0' ? -36 : 44" text-anchor="middle">{{ key.toUpperCase() }}</text>
                  </g>
                </g>
                <g v-else-if="row.compareMode !== 'Off'" class="compare-edges">
                  <rect v-if="row.compareMode === 'Window'" class="compare-window" :x="timeX(Math.min(row.r0, row.r1))" :y="laneY(index) - 14" :width="Math.abs(timeX(row.r1) - timeX(row.r0))" height="28" />
                  <path v-for="key in compareKeys[row.compareMode]" :key="key" :d="`M ${timeX(row[key])} ${laneY(index) - 5} l 5 5 l -5 5 l -5 -5 Z`">
                    <title>{{ key.toUpperCase() }}: {{ formatNumber(cycle.startTime + row[key]) }} ns</title>
                  </path>
                </g>
              </g>
            </g>
          </svg>
        </div>
        <div class="waveform-legend">
          <span><i class="legend-drive"></i>D0 / D1</span>
          <span><i class="legend-auxiliary"></i>D2 / D3</span>
          <span><i class="legend-compare"></i>R0 / R1</span>
          <span class="legend-end">每周期 {{ formatNumber(period) }} ns</span>
        </div>
      </section>
    </div>
    <footer class="workspace-footer"><span>{{ rows.length }} PINS</span><span>时序值范围：0 — {{ formatNumber(period) }} ns</span></footer>
  </section>
</template>

<style scoped>
.timeset-basic {
  --bg: #292d32;
  --panel: #30353b;
  --header: #3c4249;
  --border: #505760;
  --text: #edf1f5;
  --muted: #b1bac4;
  --blue: #56b8ff;
  --auxiliary: #b1bac4;
  --compare: #edc47a;
  --error: #ffb3ad;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  background: var(--bg);
  color: var(--text);
  color-scheme: dark;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.workspace-header, .workspace-footer, .page-heading, .waveform-heading, .table-help, .waveform-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.workspace-header { min-height: 68px; padding: 16px 28px; border-bottom: 1px solid var(--border); gap: 16px; }
.page-heading { justify-content: flex-start; gap: 12px; }
.heading-icon { color: var(--blue); flex-shrink: 0; }
.page-heading h1 { font-size: 18px; line-height: 1.5; font-weight: 600; letter-spacing: 0.2px; }
.heading-divider { width: 1px; height: 18px; background: var(--border); margin: 0 4px; }
.heading-caption, .unit-caption { color: var(--muted); font-size: 12px; }
.unit-caption { letter-spacing: 1px; white-space: nowrap; }
.unit-caption strong { margin-left: 10px; color: var(--text); font-weight: 500; }
.editor-layout { display: grid; grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr); flex: 1; }
.configuration-panel { min-width: 0; padding: 26px 26px 32px; border-right: 1px solid var(--border); }
.period-settings { margin-bottom: 24px; }
.setting-row { display: flex; align-items: center; justify-content: space-between; min-height: 54px; gap: 16px; }
.setting-label { font-size: 16px; font-weight: 600; }
.period-control { display: flex; align-items: center; width: 216px; height: 44px; background: #25292e; border: 1px solid #747d88; border-radius: 4px; }
.period-control:focus-within { border-color: var(--blue); box-shadow: 0 0 0 2px #56b8ff26; }
.period-control.has-error { border-color: var(--error); }
.period-control input { width: 100%; min-width: 0; height: 100%; padding: 0 12px; border: 0; outline: none; background: transparent; color: var(--text); font-size: 20px; text-align: right; font-family: 'SFMono-Regular', Consolas, monospace; }
.input-unit { padding-right: 14px; color: var(--muted); font-size: 14px; }
.rate-value { font: 16px 'SFMono-Regular', Consolas, monospace; padding-right: 14px; }
.setting-help { margin-top: 6px; color: var(--muted); font-size: 12px; line-height: 1.6; }
.validation-message { color: var(--error); font-size: 12px; line-height: 1.6; margin-top: 6px; }
.table-scroll { overflow-x: auto; border: 1px solid var(--border); border-radius: 5px; }
.timing-table { width: 100%; min-width: 650px; border-collapse: collapse; table-layout: fixed; }
.pin-column { width: 9%; }
.compare-column { width: 22%; }
.format-column { width: 14%; }
.timing-table th, .timing-table td { padding: 0; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); text-align: center; height: 66px; font-size: 14px; }
.timing-table thead th { background: var(--header); height: 54px; font-size: 12px; letter-spacing: 0.3px; font-weight: 600; white-space: nowrap; }
.timing-table th:last-child, .timing-table td:last-child { border-right: none; }
.timing-table tbody tr:last-child th, .timing-table tbody tr:last-child td { border-bottom: none; }
.timing-table tbody tr { background: var(--panel); }
.timing-table tbody tr.is-selected { background: #35414b; }
.timing-table .pin-cell { text-align: left; padding-left: 14px; }
.pin-name { font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 600; }
.readonly-mark { color: var(--muted); font-size: 13px; margin-left: 3px; }
.cell-value, .cell-select, .cell-input { display: block; width: 100%; height: 65px; min-width: 0; border: 0; background: transparent; color: var(--text); font-size: 14px; text-align: center; }
.cell-value { cursor: text; font-family: 'SFMono-Regular', Consolas, monospace; white-space: nowrap; }
.cell-value:hover, .cell-select:hover { background-color: #ffffff09; }
.cell-unit { font-size: 12px; color: var(--muted); margin-left: 2px; }
.cell-select { cursor: pointer; padding: 0 8px; text-align-last: center; }
.cell-select option { background: var(--panel); color: var(--text); }
.format-select { color: #d8edb0; font-family: 'SFMono-Regular', Consolas, monospace; }
.cell-input { font-family: 'SFMono-Regular', Consolas, monospace; padding: 0 3px; background: #202a33; outline: 2px solid var(--blue); outline-offset: -2px; }
.invalid-cell .cell-input { outline-color: var(--error); }
.cell-input::-webkit-inner-spin-button, .period-control input::-webkit-inner-spin-button { appearance: none; margin: 0; }
.cell-input, .period-control input { -moz-appearance: textfield; }
.cell-value:focus-visible, .cell-select:focus-visible { outline: 2px solid var(--blue); outline-offset: -3px; }
.table-help { flex-wrap: wrap; gap: 12px; color: var(--muted); font-size: 11px; margin-top: 16px; }
.table-help kbd { display: inline-block; padding: 1px 4px; border: 1px solid var(--border); border-radius: 3px; font-size: 10px; margin: 0 3px; }
.waveform-panel { min-width: 0; padding: 26px 24px 28px; background: #282c31; }
.waveform-heading { min-height: 40px; flex-wrap: wrap; gap: 8px 12px; }
.zoom-controls { display: flex; align-items: center; gap: 4px; }
.zoom-controls button { width: 30px; height: 30px; border: 1px solid var(--border); border-radius: 4px; background: var(--panel); color: var(--text); font-size: 16px; cursor: pointer; }
.zoom-controls button:disabled { opacity: .45; cursor: default; }
.zoom-controls output { min-width: 24px; text-align: center; font-size: 12px; }
.periods-control { display: flex; align-items: center; gap: 6px; margin-left: auto; color: var(--muted); font-size: 13px; }
.periods-control select { padding: 4px 6px; border: 1px solid var(--border); border-radius: 4px; background: var(--panel); color: var(--text); font: inherit; cursor: pointer; }
.waveform-heading h2 { font-size: 14px; font-weight: 500; }
.preview-range { color: var(--muted); font: 12px 'SFMono-Regular', Consolas, monospace; }
.waveform-scroll { overflow-x: auto; }
.waveform-svg { display: block; width: 100%; min-width: 380px; height: auto; margin-top: 16px; overflow: visible; font-family: 'SFMono-Regular', Consolas, monospace; }
.time-grid line { stroke: #444a52; stroke-dasharray: 2 6; }
.time-grid text { fill: var(--muted); font-size: 11px; }
.period-end { stroke: #89939f; stroke-width: 1; stroke-dasharray: 4 5; }
.lane-background { fill: transparent; }
.selected-lane .lane-background { fill: #56b8ff08; }
.lane-separator { stroke: #41474f; }
.wave-pin { fill: var(--text); font-size: 13px; font-weight: 600; }
.wave-baseline { stroke: #99aaba; stroke-width: 1.5; stroke-dasharray: 3 5; opacity: 0.7; }
.drive-wave { stroke: var(--blue); stroke-width: 2.3; fill: #56b8ff0d; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.nr-wave path { fill: none; stroke: var(--blue); stroke-linejoin: round; stroke-width: 1.8; vector-effect: non-scaling-stroke; }
.nr-wave-dashed { stroke-dasharray: 5 3; }
.edge-label { fill: var(--blue); font-size: 11px; }
.auxiliary-edges line { stroke: var(--auxiliary); stroke-dasharray: 2 3; opacity: 0.75; }
.nr-compare line { stroke: var(--compare); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.nr-compare text { fill: var(--compare); font-size: 11px; }
.compare-edges path { stroke: var(--compare); fill: #282c31; stroke-width: 1.5; }
.compare-window { fill: #edc47a1a; stroke: var(--compare); stroke-dasharray: 3 3; }
.waveform-legend { justify-content: flex-start; flex-wrap: wrap; gap: 16px; margin-top: 16px; font-size: 10px; color: var(--muted); }
.waveform-legend > span { display: inline-flex; align-items: center; gap: 6px; }
.legend-drive { width: 16px; border-top: 2px solid var(--blue); }
.legend-auxiliary { width: 16px; border-top: 1px dashed var(--auxiliary); }
.legend-compare { width: 7px; height: 7px; border: 1px solid var(--compare); transform: rotate(45deg); }
.waveform-legend .legend-end { margin-left: auto; }
.workspace-footer { min-height: 38px; gap: 12px; padding: 10px 28px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }
.workspace-footer > span:first-child { font-family: 'SFMono-Regular', Consolas, monospace; letter-spacing: 0.6px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }

@media (min-width: 1700px) {
  .editor-layout { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); }
  .configuration-panel { padding: 32px; }
  .timing-table th, .timing-table td, .cell-value, .cell-select, .cell-input { height: 76px; font-size: 16px; }
  .timing-table thead th { height: 58px; font-size: 13px; }
}
@media (max-width: 1150px) {
  .editor-layout { grid-template-columns: 1fr; }
  .configuration-panel { border-right: none; border-bottom: 1px solid var(--border); }

}
@media (max-width: 600px) {
  .workspace-header { padding: 14px 16px; }
  .page-heading { gap: 8px; }
  .page-heading h1 { font-size: 16px; }
  .heading-divider, .heading-caption, .unit-caption { display: none; }
  .configuration-panel, .waveform-panel { padding: 18px 16px; }
  .period-control { width: 180px; }
  .workspace-footer { padding: 10px 16px; }
}
</style>
