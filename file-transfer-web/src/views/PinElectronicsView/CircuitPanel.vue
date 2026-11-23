<script setup lang="ts">
import { computed } from 'vue'
import { numberFields, selectFields, type DialogKind, type NumberKey, type Settings, type SettingKey, type SettingValue } from './model'

const props = defineProps<{
  settings: Readonly<Settings>
  channel: string
}>()
const emit = defineEmits<{ change: [key: SettingKey, value: SettingValue]; open: [kind: DialogKind] }>()

const mode = computed(() => props.settings.driverMode === 'Drive' ? props.settings.initialState : props.settings.driverMode)

const voltages: { field: NumberKey; top: number }[] = [
  { field: 'vt', top: 19 },
  { field: 'vch', top: 50 },
  { field: 'vih', top: 81 },
  { field: 'vil', top: 170 },
  { field: 'vcl', top: 203 },
  { field: 'voh', top: 248 },
  { field: 'vol', top: 336 },
]

function updateNumber(key: NumberKey, value: number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) emit('change', key, value)
}
</script>

<template>
  <section class="pe-electronics" aria-labelledby="pe-electronics-title">
    <div class="pe-electronics-header">
      <div class="pe-section-heading">
        <h2 id="pe-electronics-title">Pin Electronics</h2>
      </div>
    </div>

    <div class="pe-circuit-stage">
      <div class="pe-circuit-scroll" tabindex="0" aria-label="Pin electronics circuit and parameters">
        <div
          class="pe-circuit"
          :data-driver="settings.driverMode"
          :data-main-closed="settings.mainRelayClosed"
          :data-ppmu-closed="settings.ppmuRelayClosed"
        >
          <!-- 严格保留原有电路图 SVG 连接路径，仅对齐 DUT 接头与蓝色柱子中心 -->
          <svg class="pe-schematic" viewBox="0 260 874 380" aria-label="Pin electronics circuit diagram" role="img">
            <g class="pe-wire">
              <path d="M182 293h7l3-6 5 12 5-12 5 12 5-12 5 12 5-12 5 6h1V567" />
              <path d="M186 327h13v28m0 15v65m0 14v27h-13" />
              <path d="M194 355h10m-5 0-6 14h12z M194 449h10m-5 0-6-14h12z" />
              <path d="M132 369v24m0 19v18 M132 536v23m0 18v19" />
              <path :class="{ 'pe-wire-live': settings.mainRelayClosed && settings.driverMode === 'Drive' }" d="M92 403h18 M154 403H427 M453 403H543" />
              <path class="pe-main-relay" :class="{ 'is-closed': settings.mainRelayClosed }" :d="settings.mainRelayClosed ? 'M427 403H453' : 'M427 403l22-12'" stroke-width="1.8" />
              <path d="M199 369v66" />
              <path :class="{ 'pe-wire-ppmu': settings.ppmuRelayClosed }" d="M408 463h61v-15m0-22v-23" />
              <path class="pe-ppmu-relay" :class="{ 'is-closed': settings.ppmuRelayClosed }" :d="settings.ppmuRelayClosed ? 'M469 448v-22' : 'M469 448l-9-22'" stroke-width="1.8" />
              <path :class="{ 'pe-wire-muted': settings.disableCompare }" d="M156 567H280" />
            </g>
            <path class="pe-drive-symbol" :class="{ 'is-active': settings.driverMode === 'Drive' }" d="M110 383v39l44-19z" />
            <path class="pe-compare-symbol" :class="{ 'is-muted': settings.disableCompare }" d="M156 548v39l-44-19z" />
            <path class="pe-dut-bar" d="M555 375v21m0 14v21" stroke-width="10" />
            <path class="pe-dut-pin" d="M543 396h17l7 7-7 7h-17l-4-7z" stroke-width="1.5" />
            <g class="pe-node">
              <circle cx="199" cy="403" r="3.1" />
              <circle cx="228" cy="403" r="3.1" />
              <circle cx="469" cy="403" r="3" />
              <circle cx="228" cy="567" r="3" />
            </g>
            <g class="pe-contacts">
              <circle cx="427" cy="403" r="2" />
              <circle cx="453" cy="403" r="2" />
              <circle cx="469" cy="426" r="2" />
              <circle cx="469" cy="448" r="2" />
            </g>
            <text class="pe-circuit-mode" x="196" y="282">{{ mode }}</text>
          </svg>

          <!-- 继电器交互热区 -->
          <el-button
            type="primary"
            class="pe-relay-toggle pe-main-toggle"
            :aria-pressed="settings.mainRelayClosed"
            :aria-label="`Main relay: ${settings.mainRelayClosed ? 'closed' : 'open'}`"
            @click="emit('change', 'mainRelayClosed', !settings.mainRelayClosed)"
          />
          <el-button
            type="primary"
            class="pe-relay-toggle pe-ppmu-toggle"
            :aria-pressed="settings.ppmuRelayClosed"
            :aria-label="`PPMU relay: ${settings.ppmuRelayClosed ? 'closed' : 'open'}`"
            @click="emit('change', 'ppmuRelayClosed', !settings.ppmuRelayClosed)"
          />

          <!-- 左侧 7 路电压电平输入（无左侧圆点状态） -->
          <div
            v-for="row in voltages"
            :key="row.field"
            class="pe-field pe-voltage"
            :class="{ 'pe-field-disabled': (row.field === 'voh' || row.field === 'vol') && settings.disableCompare }"
            :style="{ top: `${row.top}px` }"
          >
            <label :for="`pe-${row.field}`">{{ numberFields[row.field].label }}:</label>
            <el-input-number
              :id="`pe-${row.field}`"
              :model-value="settings[row.field]"
              :min="numberFields[row.field].min"
              :max="numberFields[row.field].max"
              :precision="3"
              :step="0.001"
              :controls="false"
              :disabled="(row.field === 'voh' || row.field === 'vol') && settings.disableCompare"
              @update:model-value="updateNumber(row.field, $event)"
            />
            <span class="pe-unit">{{ numberFields[row.field].unit }}</span>
          </div>

          <span class="pe-drive-label">Drive</span>

          <el-button
            class="pe-ppmu-button"
            :class="{ 'is-live': settings.driverMode === 'PPMU' || settings.ppmuRelayClosed }"
            type="primary"
            plain
            aria-haspopup="dialog"
            @click="emit('open', 'ppmu')"
          >
            PPMU
          </el-button>

          <el-button
            class="pe-counter-button"
            type="primary"
            plain
            aria-haspopup="dialog"
            @click="emit('open', 'counter')"
          >
            Counter
          </el-button>

          <!-- Driver Mode & Pin Name -->
          <div class="pe-field pe-driver">
            <label for="pe-driverMode">{{ selectFields.driverMode.label }}:</label>
            <el-select
              id="pe-driverMode"
              :model-value="settings.driverMode"
              :teleported="false"
              @update:model-value="emit('change', 'driverMode', $event)"
            >
              <el-option v-for="opt in selectFields.driverMode.options" :key="opt" :label="opt" :value="opt" />
            </el-select>
          </div>

          <div class="pe-field pe-pin">
            <label for="pe-pinName">{{ selectFields.pinName.label }}:</label>
            <el-select
              id="pe-pinName"
              :model-value="settings.pinName"
              :teleported="false"
              @update:model-value="emit('change', 'pinName', $event)"
            >
              <el-option v-for="opt in selectFields.pinName.options" :key="opt" :label="opt" :value="opt" />
            </el-select>
          </div>

          <div class="pe-channel">
            <div class="pe-channel-row">
              <span>DUT Channel</span>
              <strong>{{ channel }}</strong>
            </div>
          </div>

          <fieldset class="pe-active-load">
            <legend>Active Load</legend>
            <div v-for="field in (['ioh', 'iol'] as const)" :key="field" class="pe-field">
              <label :for="`pe-${field}`">{{ numberFields[field].label }}:</label>
              <el-input-number
                :id="`pe-${field}`"
                :model-value="settings[field]"
                :min="numberFields[field].min"
                :max="numberFields[field].max"
                :precision="3"
                :step="0.001"
                :controls="false"
                @update:model-value="updateNumber(field, $event)"
              />
              <span class="pe-unit">{{ numberFields[field].unit }}</span>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  </section>
</template>
