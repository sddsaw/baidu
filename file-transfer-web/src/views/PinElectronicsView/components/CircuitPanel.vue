<script setup lang="ts">
import { computed } from 'vue'
import ParameterField from './ParameterField.vue'
import type { Settings, SettingKey, SettingValue, DialogKind, NumberKey } from '../model'
const props = defineProps<{ settings: Readonly<Settings>; channel: string }>()
const emit = defineEmits<{ change: [key: SettingKey, value: SettingValue]; open: [kind: DialogKind] }>()
const mode = computed(() => props.settings.driverMode === 'Drive' ? props.settings.initialState : props.settings.driverMode)
const voltages: { field: NumberKey; top: number }[] = [
  { field: 'vt', top: 19 }, { field: 'vch', top: 50 }, { field: 'vih', top: 81 },
  { field: 'vil', top: 170 }, { field: 'vcl', top: 203 }, { field: 'voh', top: 248 }, { field: 'vol', top: 336 },
]
</script>

<template>
  <section class="pe-electronics" aria-labelledby="pe-electronics-title">
    <h2 id="pe-electronics-title">Pin Electronics</h2>
    <p class="pe-circuit-hint">Swipe horizontally to view the full circuit.</p>
    <div class="pe-circuit-scroll" tabindex="0" aria-label="Pin electronics circuit and parameters">
      <div class="pe-circuit" :data-driver="settings.driverMode">
        <svg class="pe-schematic" viewBox="0 260 874 380" aria-label="Pin electronics circuit diagram" role="img">
          <g class="pe-wire">
            <path d="M182 293h7l3-6 5 12 5-12 5 12 5-12 5 12 5-12 5 6h1V567" />
            <path d="M186 327h13v28m0 15v65m0 14v27h-13" />
            <path d="M194 355h10m-5 0-6 14h12z M194 449h10m-5 0-6-14h12z" />
            <path d="M132 369v24m0 19v18 M132 536v23m0 18v19" />
            <path d="M92 403h18 M154 403H427 M453 403H543" />
            <path class="pe-main-relay" :d="settings.mainRelayClosed ? 'M427 403H453' : 'M427 403l22-12'" stroke-width="1.8" />
            <path d="M199 369v66" />
            <path d="M408 463h61v-15m0-22v-23" />
            <path class="pe-ppmu-relay" :d="settings.ppmuRelayClosed ? 'M469 448v-22' : 'M469 448l-9-22'" stroke-width="1.8" />
            <path d="M156 567H280" />
          </g>
          <path class="pe-drive-symbol" d="M110 383v39l44-19z" />
          <path class="pe-compare-symbol" d="M156 548v39l-44-19z" />
          <path d="M555 379v21m0 16v19" stroke="#3976e9" stroke-width="10" />
          <path d="M543 400h17l7 7-7 7h-17l-4-7z" fill="#fff" stroke="#607591" stroke-width="1.5" />
          <g class="pe-node"><circle cx="199" cy="403" r="3.1" /><circle cx="228" cy="403" r="3.1" /><circle cx="469" cy="403" r="3" /><circle cx="228" cy="567" r="3" /></g>
          <g class="pe-contacts"><circle cx="427" cy="403" r="2" /><circle cx="453" cy="403" r="2" /><circle cx="469" cy="426" r="2" /><circle cx="469" cy="448" r="2" /></g>
          <text class="pe-circuit-mode" x="196" y="282">{{ mode }}</text>
        </svg>
        <el-button type="primary" class="pe-relay-toggle pe-main-toggle" :aria-pressed="settings.mainRelayClosed" :aria-label="`Main relay: ${settings.mainRelayClosed ? 'closed' : 'open'}`" :title="settings.mainRelayClosed ? '点击断开主线路' : '点击闭合主线路'" @click="emit('change', 'mainRelayClosed', !settings.mainRelayClosed)" />
        <el-button type="primary" class="pe-relay-toggle pe-ppmu-toggle" :aria-pressed="settings.ppmuRelayClosed" :aria-label="`PPMU relay: ${settings.ppmuRelayClosed ? 'closed' : 'open'}`" :title="settings.ppmuRelayClosed ? '点击断开 PPMU 线路' : '点击闭合 PPMU 线路'" @click="emit('change', 'ppmuRelayClosed', !settings.ppmuRelayClosed)" />
        <ParameterField v-for="row in voltages" :key="row.field" class="pe-voltage" :style="{ top: `${row.top}px` }" :field="row.field" :settings="settings" @change="(key, value) => emit('change', key, value)" />
        <span class="pe-drive-label">Drive</span>
        <el-button class="pe-ppmu-button" type="primary" plain aria-haspopup="dialog" @click="emit('open', 'ppmu')">PPMU</el-button>
        <el-button class="pe-counter-button" type="primary" plain aria-haspopup="dialog" @click="emit('open', 'counter')">Counter</el-button>
        <ParameterField class="pe-driver" field="driverMode" :settings="settings" @change="(key, value) => emit('change', key, value)" />
        <ParameterField class="pe-pin" field="pinName" :settings="settings" @change="(key, value) => emit('change', key, value)" />
        <div class="pe-channel">Channel: <strong>{{ channel }}</strong><p>(Channel for first pin in pingroup)</p></div>
        <fieldset class="pe-active-load">
          <legend>Active Load</legend>
          <ParameterField v-for="field in (['ioh', 'iol'] as const)" :key="field" :field="field" :settings="settings" @change="(key, value) => emit('change', key, value)" />
        </fieldset>
      </div>
    </div>
  </section>
</template>
