<script setup lang="ts">
import { computed } from 'vue'
import ParameterField from './ParameterField.vue'
import { edgeDisableKeys, isEdgeDisabled, type EdgeKey, type Settings, type SettingKey, type SettingValue } from '../model'

const props = defineProps<{ edge: EdgeKey; settings: Readonly<Settings> }>()
const emit = defineEmits<{ change: [key: SettingKey, value: SettingValue] }>()
const disabled = computed(() => isEdgeDisabled(props.settings, props.edge))
const compareLocked = computed(() => (props.edge === 'r0' || props.edge === 'r1') && props.settings.disableCompare)
</script>

<template>
  <div class="pe-edge-row">
    <ParameterField :field="edge" :settings="settings" :disabled="disabled" @change="(key, value) => emit('change', key, value)" />
    <el-checkbox class="pe-edge-dis" :model-value="disabled" :disabled="compareLocked" :aria-label="`${edge.toUpperCase()} Dis`" :title="compareLocked ? 'Disable Compare 已启用，请先关闭总开关' : `禁用 ${edge.toUpperCase()}，保留原数值`" @update:model-value="emit('change', edgeDisableKeys[edge], Boolean($event))">Dis</el-checkbox>
  </div>
</template>
