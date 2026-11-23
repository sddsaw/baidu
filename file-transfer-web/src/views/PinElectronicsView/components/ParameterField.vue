<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { numberFields, selectFields, type FieldKey, type NumberKey, type SelectKey, type Settings, type SettingValue } from '../model'

const props = defineProps<{ field: FieldKey; settings: Readonly<Settings>; disabled?: boolean; unit?: string }>()
const emit = defineEmits<{ change: [key: FieldKey, value: SettingValue] }>()
const numeric = computed(() => props.field in numberFields ? numberFields[props.field as NumberKey] : undefined)
const selection = computed(() => props.field in selectFields ? selectFields[props.field as SelectKey] : undefined)
const id = computed(() => `pe-${props.field}`)
const draft = shallowRef<number | null>()
watch(() => props.settings[props.field], value => { draft.value = typeof value === 'number' ? value : undefined }, { immediate: true })

function changeNumber(value: number | null | undefined) {
  // Element Plus clamps ranges. Clearing a required field restores the last accepted value on blur.
  if (typeof value === 'number' && Number.isFinite(value)) emit('change', props.field, value)
}
function restoreEmpty() {
  if (draft.value == null) draft.value = props.settings[props.field] as number
}
</script>

<template>
  <div class="pe-field" :class="{ 'pe-field-disabled': disabled }">
    <label :for="id">{{ numeric?.label ?? selection?.label }}:</label>
    <el-select v-if="selection" :id="id" :model-value="settings[field] as string" :disabled="disabled" :teleported="false" :aria-label="selection.label" @update:model-value="emit('change', field, $event)">
      <el-option v-for="option in selection.options" :key="option" :label="option" :value="option" />
    </el-select>
    <template v-else-if="numeric">
      <el-input-number :id="id" v-model="draft" :min="numeric.min" :max="numeric.max" :precision="field === 'gateTime' ? 0 : 3" :step="field === 'gateTime' ? 1 : 0.001" :controls="false" :disabled="disabled" :aria-label="numeric.label" @change="changeNumber" @blur="restoreEmpty" />
      <span class="pe-unit">{{ unit ?? numeric.unit }}</span>
    </template>
  </div>
</template>
