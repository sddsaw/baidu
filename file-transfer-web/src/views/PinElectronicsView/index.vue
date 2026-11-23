<script setup lang="ts">
import { computed, onDeactivated, ref, shallowRef } from 'vue'
import CircuitPanel from './CircuitPanel.vue'
import { usePinSettings } from './usePinSettings'
import {
  createSettings,
  edgeDisableKeys,
  formatFrequency,
  isEdgeDisabled,
  levelPresets,
  numberFields,
  selectFields,
  type DialogKind,
  type EdgeKey,
  type NumberKey,
} from './model'
import './pin-electronics.css'

const {
  settings,
  channel,
  update,
  apply,
  applyPreset,
  reset,
  exportSettings,
  copySettings,
} = usePinSettings()

const theme = shallowRef<'dark' | 'light'>('dark')
const dialog = shallowRef<DialogKind | null>(null)
const draft = ref(createSettings())
onDeactivated(() => { dialog.value = null })

const frequency = computed(() => formatFrequency(settings.value.period))
const isPpmu = computed(() => dialog.value === 'ppmu')
const dialogTitle = computed(() => isPpmu.value ? `PPMU · ${settings.value.pinName}` : `Counter · ${settings.value.pinName}`)

function openDialog(kind: DialogKind) {
  draft.value = { ...settings.value }
  dialog.value = kind
}

function submitDialog() {
  const { forceMode, forceValue, compliance, ppmuRelayClosed, counterEdge, gateTime } = draft.value
  apply(isPpmu.value
    ? { forceMode, forceValue, compliance, ppmuRelayClosed, driverMode: 'PPMU' }
    : { counterEdge, gateTime })
  dialog.value = null
}

function updateNumber(key: NumberKey, value: number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) update(key, value)
}

function isCompareLocked(edge: EdgeKey) {
  return (edge === 'r0' || edge === 'r1') && settings.value.disableCompare
}
</script>

<template>
  <div class="pe-page" :class="theme === 'light' ? 'pe-theme-light' : 'pe-theme-dark'">
    <el-config-provider size="small">
      <div class="pe-workspace">
        <!-- 顶部 ATE 上下文与快捷控制条 -->
        <header class="pe-command-bar">
          <div class="pe-identity">
            <span class="pe-brand" aria-hidden="true">
              <svg viewBox="0 0 28 28" fill="none">
                <path d="M2 15h6l3-9 6 16 3-9h6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <div class="pe-title-group">
              <h1>Pin Electronics</h1>
              <div class="pe-target-strip">
                <label class="pe-inline-pin">
                  <span>Pin</span>
                  <el-select
                    :model-value="settings.pinName"
                    :teleported="false"
                    class="pe-pin-quick"
                    @update:model-value="update('pinName', $event)"
                  >
                    <el-option v-for="pin in selectFields.pinName.options" :key="pin" :label="pin" :value="pin" />
                  </el-select>
                </label>
                <span class="pe-channel-chip">{{ channel }}</span>
              </div>
            </div>
          </div>

          <div class="pe-quick-controls">
            <div class="pe-mode-switch" role="group" aria-label="Driver Mode">
              <span class="pe-ctrl-caption">MODE</span>
              <div class="pe-segmented">
                <button
                  v-for="m in selectFields.driverMode.options"
                  :key="m"
                  type="button"
                  class="pe-seg-btn"
                  :class="{ 'is-active': settings.driverMode === m, [`is-${m.toLowerCase()}`]: settings.driverMode === m }"
                  @click="update('driverMode', m)"
                >
                  {{ m }}
                </button>
              </div>
            </div>

            <div class="pe-presets" role="group" aria-label="Logic level presets">
              <span class="pe-ctrl-caption">PRESET</span>
              <div class="pe-preset-list">
                <button
                  v-for="preset in levelPresets"
                  :key="preset.id"
                  type="button"
                  class="pe-preset-btn"
                  :class="{ 'is-safe': preset.id === 'safe-hiz' }"
                  @click="applyPreset(preset)"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <button
              type="button"
              class="pe-theme-btn"
              @click="theme = theme === 'dark' ? 'light' : 'dark'"
            >
              {{ theme === 'dark' ? 'Lab Light' : 'ATE Dark' }}
            </button>
          </div>
        </header>

        <!-- 核心仪器工作台 -->
        <section class="pe-workbench" aria-label="Pin configuration workspace">
          <!-- 1. Format / Timing 区 -->
          <section class="pe-timing" aria-labelledby="pe-timing-title">
            <div class="pe-timeset-card">
              <div class="pe-card-kicker">TIMESET & CYCLE</div>
              <div class="pe-timeset-fields">
                <div class="pe-field">
                  <label for="pe-timesetName">{{ selectFields.timesetName.label }}:</label>
                  <el-select
                    id="pe-timesetName"
                    :model-value="settings.timesetName"
                    :teleported="false"
                    @update:model-value="update('timesetName', $event)"
                  >
                    <el-option v-for="opt in selectFields.timesetName.options" :key="opt" :label="opt" :value="opt" />
                  </el-select>
                </div>
                <div class="pe-field">
                  <label for="pe-timeset">{{ selectFields.timeset.label }}:</label>
                  <el-select
                    id="pe-timeset"
                    :model-value="settings.timeset"
                    :teleported="false"
                    @update:model-value="update('timeset', $event)"
                  >
                    <el-option v-for="opt in selectFields.timeset.options" :key="opt" :label="opt" :value="opt" />
                  </el-select>
                </div>
              </div>
              <div class="pe-period-box">
                <div class="pe-field pe-period">
                  <label for="pe-period">Period:</label>
                  <el-input-number
                    id="pe-period"
                    :model-value="settings.period"
                    :min="numberFields.period.min"
                    :precision="3"
                    :step="0.001"
                    :controls="false"
                    @update:model-value="updateNumber('period', $event)"
                  />
                  <span class="pe-unit">{{ numberFields.period.unit }}</span>
                </div>
                <div class="pe-freq-readout">
                  <span>Rate</span>
                  <strong>{{ frequency }}</strong>
                </div>
              </div>
            </div>

            <div class="pe-format-card">
              <div class="pe-format-topbar">
                <div class="pe-section-heading">
                  <h2 id="pe-timing-title">Format / Timing</h2>
                  <span class="pe-chip">Channel Setup: <strong>I/O</strong></span>
                </div>
                <div class="pe-compare-controls">
                  <div class="pe-field" :class="{ 'pe-field-disabled': settings.disableCompare }">
                    <label for="pe-compareMode">{{ selectFields.compareMode.label }}:</label>
                    <el-select
                      id="pe-compareMode"
                      :model-value="settings.compareMode"
                      :disabled="settings.disableCompare"
                      :teleported="false"
                      @update:model-value="update('compareMode', $event)"
                    >
                      <el-option v-for="opt in selectFields.compareMode.options" :key="opt" :label="opt" :value="opt" />
                    </el-select>
                  </div>
                  <el-checkbox
                    class="pe-disable-compare"
                    :model-value="settings.disableCompare"
                    @update:model-value="update('disableCompare', Boolean($event))"
                  >
                    Disable Compare
                  </el-checkbox>
                </div>
              </div>

              <div class="pe-format-columns">
                <div class="pe-col-group">
                  <div class="pe-col-label">DRIVE FORMAT</div>
                  <div class="pe-field-stack">
                    <div v-for="field in (['initialState', 'startState', 'driveFormat'] as const)" :key="field" class="pe-field">
                      <label :for="`pe-${field}`">{{ selectFields[field].label }}:</label>
                      <el-select
                        :id="`pe-${field}`"
                        :model-value="settings[field]"
                        :teleported="false"
                        @update:model-value="update(field, $event)"
                      >
                        <el-option v-for="opt in selectFields[field].options" :key="opt" :label="opt" :value="opt" />
                      </el-select>
                    </div>
                  </div>
                </div>

                <div class="pe-col-group">
                  <div class="pe-col-label pe-col-drive">DRIVE EDGES (ps)</div>
                  <div class="pe-field-stack">
                    <div
                      v-for="edge in (['d0', 'd1', 'd2', 'd3'] as const)"
                      :key="edge"
                      class="pe-edge-row pe-edge-drive"
                      :class="{ 'pe-edge-muted': isEdgeDisabled(settings, edge) }"
                    >
                      <div class="pe-field" :class="{ 'pe-field-disabled': isEdgeDisabled(settings, edge) }">
                        <label :for="`pe-${edge}`">{{ numberFields[edge].label }}:</label>
                        <el-input-number
                          :id="`pe-${edge}`"
                          :model-value="settings[edge]"
                          :min="0"
                          :precision="3"
                          :step="0.001"
                          :controls="false"
                          :disabled="isEdgeDisabled(settings, edge)"
                          @update:model-value="updateNumber(edge, $event)"
                        />
                        <span class="pe-unit">{{ numberFields[edge].unit }}</span>
                      </div>
                      <el-checkbox
                        class="pe-edge-dis"
                        :model-value="isEdgeDisabled(settings, edge)"
                        @update:model-value="update(edgeDisableKeys[edge], Boolean($event))"
                      >
                        Dis
                      </el-checkbox>
                    </div>
                  </div>
                </div>

                <div class="pe-col-group">
                  <div class="pe-col-label pe-col-compare">COMPARE STROBES (ns)</div>
                  <div class="pe-field-stack">
                    <div
                      v-for="edge in (['r0', 'r1'] as const)"
                      :key="edge"
                      class="pe-edge-row pe-edge-compare"
                      :class="{ 'pe-edge-muted': isEdgeDisabled(settings, edge) }"
                    >
                      <div class="pe-field" :class="{ 'pe-field-disabled': isEdgeDisabled(settings, edge) }">
                        <label :for="`pe-${edge}`">{{ numberFields[edge].label }}:</label>
                        <el-input-number
                          :id="`pe-${edge}`"
                          :model-value="settings[edge]"
                          :min="0"
                          :precision="3"
                          :step="0.001"
                          :controls="false"
                          :disabled="isEdgeDisabled(settings, edge)"
                          @update:model-value="updateNumber(edge, $event)"
                        />
                        <span class="pe-unit">{{ numberFields[edge].unit }}</span>
                      </div>
                      <el-checkbox
                        class="pe-edge-dis"
                        :model-value="isEdgeDisabled(settings, edge)"
                        :disabled="isCompareLocked(edge)"
                        @update:model-value="update(edgeDisableKeys[edge], Boolean($event))"
                      >
                        Dis
                      </el-checkbox>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="pe-divider" />

          <!-- 2. Pin Electronics 电路图组件 -->
          <CircuitPanel :settings="settings" :channel="channel" @change="update" @open="openDialog" />

          <footer class="pe-footer">
            <div class="pe-footer-actions">
              <el-button @click="copySettings">Copy JSON</el-button>
              <el-button @click="reset">Reset</el-button>
              <el-button type="primary" @click="exportSettings">Export JSON ↗</el-button>
            </div>
          </footer>
        </section>
      </div>

      <!-- PPMU / Counter 仪器弹窗 -->
      <el-dialog
        :model-value="dialog !== null"
        :title="dialogTitle"
        width="400px"
        class="pe-dialog"
        :close-on-click-modal="false"
        @update:model-value="!$event && (dialog = null)"
      >
        <el-form class="pe-dialog-form" @submit.prevent="submitDialog">
          <template v-if="isPpmu">
            <div class="pe-field">
              <label for="pe-forceMode">{{ selectFields.forceMode.label }}:</label>
              <el-select id="pe-forceMode" v-model="draft.forceMode" :teleported="false">
                <el-option v-for="opt in selectFields.forceMode.options" :key="opt" :label="opt" :value="opt" />
              </el-select>
            </div>
            <div class="pe-field">
              <label for="pe-forceValue">{{ numberFields.forceValue.label }}:</label>
              <el-input-number id="pe-forceValue" v-model="draft.forceValue" :min="-10" :max="10" :precision="3" :step="0.001" :controls="false" />
              <span class="pe-unit">{{ draft.forceMode === 'Current' ? 'mA' : 'V' }}</span>
            </div>
            <div class="pe-field">
              <label for="pe-compliance">{{ numberFields.compliance.label }}:</label>
              <el-input-number id="pe-compliance" v-model="draft.compliance" :min="0.001" :max="100" :precision="3" :step="0.001" :controls="false" />
              <span class="pe-unit">{{ draft.forceMode === 'Current' ? 'V' : 'mA' }}</span>
            </div>
            <div class="pe-dialog-check">
              <el-checkbox v-model="draft.ppmuRelayClosed">Close PPMU Relay</el-checkbox>
            </div>
          </template>
          <template v-else>
            <output class="pe-counter-reading" aria-label="Counter reading"><strong>—</strong></output>
            <div class="pe-field">
              <label for="pe-counterEdge">{{ selectFields.counterEdge.label }}:</label>
              <el-select id="pe-counterEdge" v-model="draft.counterEdge" :teleported="false">
                <el-option v-for="opt in selectFields.counterEdge.options" :key="opt" :label="opt" :value="opt" />
              </el-select>
            </div>
            <div class="pe-field">
              <label for="pe-gateTime">{{ numberFields.gateTime.label }}:</label>
              <el-input-number id="pe-gateTime" v-model="draft.gateTime" :min="1" :max="10000" :precision="0" :step="1" :controls="false" />
              <span class="pe-unit">{{ numberFields.gateTime.unit }}</span>
            </div>
          </template>
          <div class="pe-dialog-actions">
            <el-button @click="dialog = null">Cancel</el-button>
            <el-button type="primary" native-type="submit">Apply</el-button>
          </div>
        </el-form>
      </el-dialog>
    </el-config-provider>
  </div>
</template>
