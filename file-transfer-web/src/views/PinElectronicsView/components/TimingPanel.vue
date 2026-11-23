<script setup lang="ts">
import ParameterField from './ParameterField.vue'
import TimingEdge from './TimingEdge.vue'
import type { Settings, SettingKey, SettingValue } from '../model'
defineProps<{ settings: Readonly<Settings> }>()
const emit = defineEmits<{ change: [key: SettingKey, value: SettingValue] }>()
const change = (key: SettingKey, value: SettingValue) => emit('change', key, value)
</script>

<template>
  <section class="pe-timing" aria-labelledby="pe-timing-title">
    <div class="pe-timeset">
      <ParameterField field="timesetName" :settings="settings" @change="change" />
      <ParameterField field="timeset" :settings="settings" @change="change" />
    </div>
    <div class="pe-format">
      <h2 id="pe-timing-title">Format / Timing</h2>
      <div class="pe-format-header">
        <p class="pe-readout">Channel Setup: <strong>i/o</strong></p>
        <ParameterField field="compareMode" :settings="settings" :disabled="settings.disableCompare" @change="change" />
        <el-checkbox :model-value="settings.disableCompare" @update:model-value="change('disableCompare', Boolean($event))">Disable Compare</el-checkbox>
      </div>
      <div class="pe-format-columns">
        <div class="pe-field-stack">
          <ParameterField v-for="field in (['initialState', 'startState', 'driveFormat'] as const)" :key="field" :field="field" :settings="settings" @change="change" />
        </div>
        <div class="pe-field-stack pe-edges">
          <TimingEdge v-for="edge in (['d0', 'd1', 'd2', 'd3'] as const)" :key="edge" :edge="edge" :settings="settings" @change="change" />
        </div>
        <div class="pe-field-stack pe-edges">
          <TimingEdge v-for="edge in (['r0', 'r1'] as const)" :key="edge" :edge="edge" :settings="settings" @change="change" />
          <ParameterField class="pe-period" field="period" :settings="settings" @change="change" />
        </div>
      </div>
    </div>
  </section>
</template>
