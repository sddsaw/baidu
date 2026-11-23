<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ParameterField from './ParameterField.vue'
import { createSettings, type DialogKind, type Settings, type FieldKey, type SettingValue } from '../model'
const props = defineProps<{ kind: DialogKind | null; settings: Readonly<Settings> }>()
const emit = defineEmits<{ close: []; apply: [patch: Partial<Settings>] }>()
const draft = ref(createSettings())
watch(() => props.kind, kind => { if (kind) draft.value = { ...props.settings } })
const isPpmu = computed(() => props.kind === 'ppmu')
const title = computed(() => isPpmu.value ? `PPMU · Pin ${props.settings.pinName}` : 'Counter')
const change = (key: FieldKey, value: SettingValue) => { draft.value = { ...draft.value, [key]: value } }
function apply() {
  const { forceMode, forceValue, compliance, counterEdge, gateTime } = draft.value
  emit('apply', isPpmu.value ? { forceMode, forceValue, compliance, driverMode: 'PPMU' } : { counterEdge, gateTime })
  emit('close')
}
</script>

<template>
  <el-dialog :model-value="kind !== null" :title="title" width="420px" class="pe-dialog" :close-on-click-modal="false" @update:model-value="!$event && emit('close')">
    <el-form class="pe-dialog-form" @submit.prevent="apply">
      <template v-if="isPpmu">
        <ParameterField field="forceMode" :settings="draft" @change="change" />
        <ParameterField field="forceValue" :settings="draft" :unit="draft.forceMode === 'Current' ? 'mA' : 'V'" @change="change" />
        <ParameterField field="compliance" :settings="draft" :unit="draft.forceMode === 'Current' ? 'V' : 'mA'" @change="change" />
        <p>Apply these settings to the selected pin.</p>
      </template>
      <template v-else>
        <output class="pe-counter-reading" aria-label="Counter reading">—</output>
        <ParameterField field="counterEdge" :settings="draft" @change="change" />
        <ParameterField field="gateTime" :settings="draft" @change="change" />
        <p>No instrument connected. Counter settings can be configured locally.</p>
      </template>
      <div class="pe-dialog-actions"><el-button @click="emit('close')">Cancel</el-button><el-button type="primary" native-type="submit">Apply</el-button></div>
    </el-form>
  </el-dialog>
</template>
