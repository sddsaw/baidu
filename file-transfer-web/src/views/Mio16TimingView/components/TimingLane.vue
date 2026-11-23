<script setup lang="ts">
import { computed } from 'vue'
import { formatSchematic } from '../formatSchematic'
import { compareMarks, driveEvents, driveMarks, isDDR, type Pin, type TimingEvent } from '../model'
const props = defineProps<{
  pin: Pin; period: number; periods: number; mode: 'format' | 'data'
  x: (time: number) => number; width: number; selected: boolean; errors: string[]
}>()
const emit = defineEmits<{ select: [id: string] }>()
const total = computed(() => props.period * props.periods)
const cycles = computed(() => Array.from({ length: props.periods }, (_, i) => i))
const x = (time: number) => props.x(time)
const y = (value: number) => value ? 44 : 76
function fmt(value: number) { return Number(value.toPrecision(7)).toString() }
const marks = computed(() => compareMarks(props.pin, props.period, props.periods))
const lanes = computed(() => [driveEvents(props.pin, props.period, props.periods)])
function path(events: TimingEvent[], invert = false) {
  let value: number | null = props.mode === 'format' || props.pin.initial === 'X' ? null : Number(props.pin.initial)
  if (invert && value !== null) value = 1 - value
  let d = value === null || !events.length ? '' : `M ${x(events[0]!.time)} ${y(value)}`
  for (const event of events) {
    if (value === null) d += ` M ${x(event.time)} ${y(event.value)}`
    else d += ` H ${x(event.time)} V ${y(event.value)}`
    value = event.value
  }
  if (value !== null) d += ` H ${x(total.value)}`
  return d
}
const schematic = computed(() => props.mode === 'format' && props.pin.operation === 'Drive' && !props.errors.length
  ? formatSchematic(props.pin, props.period, props.periods, x) : null)
const nrEnvelope = computed(() => props.pin.format === 'NR' && props.mode === 'format' && props.pin.operation === 'Drive')
const driveLabels = computed(() => driveMarks(props.pin, props.period, props.periods)
  .filter(mark => !nrEnvelope.value || mark.key !== 'D1' || mark.cycle === 1))
const priorEnd = computed(() => lanes.value[0]?.[0]?.time ?? total.value)
const priorY = computed(() => props.mode === 'format' || props.pin.initial === 'X' ? 60 : y(Number(props.pin.initial)))
</script>
<template>
  <g class="pin-lane" :data-pin="pin.id" :aria-label="`${pin.id} ${pin.format}`" @click="emit('select', pin.id)">
    <rect :width="width" height="132" :fill="selected ? '#1b303c' : '#111e2c'" />
    <line :x2="width" y1="131" y2="131" stroke="#304052" />
    <text x="12" y="50" class="lane-pin-label">{{ pin.id }}</text>
    <text x="12" y="69" class="lane-format-label">{{ pin.format }}</text>
    <title>{{ pin.id }} · {{ pin.format }}{{ errors.length ? ' · ' + errors.join('；') : '' }}</title>
    <text v-if="errors.length" :x="x(0) + 8" y="60" class="lane-error">参数待修正：{{ errors.join('；') }}</text>
    <template v-else>
      <g v-for="cycle in cycles" :key="cycle">
        <line :x1="x(cycle * period)" :x2="x(cycle * period)" y1="0" y2="131" class="period-line" />
        <template v-if="isDDR(pin.format)">
          <line :x1="x((cycle + .5) * period)" :x2="x((cycle + .5) * period)" y1="0" y2="131" class="half-line" />
          <text :x="x((cycle + .25) * period)" y="12" text-anchor="middle" class="lane-half-label">A</text>
          <text :x="x((cycle + .75) * period)" y="12" text-anchor="middle" class="lane-half-label">B</text>
        </template>
      </g>
      <template v-if="pin.operation === 'Drive'">
        <g v-if="schematic">
          <path :d="schematic.lead" class="prior-path"/>
          <path :d="schematic.solid" class="drive-path"/>
          <path v-if="schematic.alternative" :d="schematic.alternative" class="alternative-path"/>
          <text v-if="schematic.note" :x="x(0) + 6" y="117" class="tick-label">{{ schematic.note }}</text>
        </g>
        <template v-else>
          <path :d="`M ${x(0)} ${priorY} H ${x(priorEnd)}`" class="prior-path"/>
          <path v-for="(events, index) in lanes" :key="index" :d="path(events, index === 1)" :class="index === 0 ? 'drive-path' : 'alternative-path'"/>
        </template>
        <g v-for="label in driveLabels" :key="`${label.time}-${label.key}-${label.half}`" class="drive-marker" :data-edge="label.key" :data-time="label.time">
          <line :x1="x(label.time)" :x2="x(label.time)" :y1="label.key === 'D1' ? 35 : 25" :y2="label.key === 'D1' ? 40 : 30" stroke="#56d7c4"/>
          <text :x="x(label.time)" :y="label.key === 'D1' ? 32 : 22" text-anchor="middle" class="drive-label">{{ label.key }}{{ label.half ? ` ${label.half}` : '' }}</text>
          <title>{{ label.key }} {{ label.half }} · {{ fmt(label.time) }} ns</title>
        </g>
      </template>
      <g v-else>
        <path :d="`M ${x(0)} 60 H ${x(total)}`" stroke="#8294aa" fill="none"/>
        <text :x="x(total / 2)" y="45" text-anchor="middle" class="tick-label">Compare</text>
        <g v-for="cycle in !isDDR(pin.format) ? cycles : []" :key="cycle">
          <line :x1="x(cycle * period + pin.a.d3)" :x2="x(cycle * period + pin.a.d3)" y1="38" y2="86" stroke="#9cacc1"/>
          <text :x="x(cycle * period + pin.a.d3)" y="26" text-anchor="middle" class="tick-label">D3</text>
        </g>
      </g>
      <g v-for="(mark, i) in marks" :key="i">
        <line :x1="x(mark.time)" :x2="x(mark.time)" y1="38" y2="86" :class="mark.key === 'R0' ? 'r0-line' : 'r1-line'"/>
        <text :x="x(mark.time)" :y="mark.key === 'R0' ? 104 : 120" text-anchor="middle" :class="mark.key === 'R0' ? 'r0-label' : 'r1-label'">{{ mark.key }}{{ mark.half ? `·${mark.half}` : '' }}</text>
        <title>P{{ mark.cycle }} {{ mark.key }}{{ mark.half }} · {{ fmt(mark.time) }} ns</title>
      </g>
    </template>
  </g>
</template>
