import { computed, readonly, shallowRef } from 'vue'
import {
  channels,
  createSettings,
  restoreSettings,
  validSetting,
  type LevelPreset,
  type Settings,
  type SettingKey,
  type SettingValue,
} from './model'

const storageKey = 'file-transfer-pin-electronics-v1'

export function usePinSettings() {
  const settings = shallowRef(createSettings())
  try {
    settings.value = restoreSettings(JSON.parse(localStorage.getItem(storageKey) || 'null'))
  } catch {
    settings.value = createSettings()
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings.value))
    } catch {
      // Ignore storage quota / private mode errors
    }
  }

  function update(key: SettingKey, value: SettingValue) {
    if (!validSetting(key, value)) return
    settings.value = { ...settings.value, [key]: value }
    save()
  }

  function apply(patch: Partial<Settings>) {
    settings.value = restoreSettings({ ...settings.value, ...patch })
    save()
  }

  function applyPreset(preset: LevelPreset) {
    apply(preset.patch)
  }

  function reset() {
    settings.value = createSettings()
    save()
  }

  function buildPayload() {
    return JSON.stringify({ version: 1, pin: settings.value.pinName, settings: settings.value }, null, 2)
  }

  function exportSettings() {
    const blob = new Blob([buildPayload()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pin-${settings.value.pinName}-settings.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function copySettings() {
    try {
      await navigator.clipboard.writeText(buildPayload())
    } catch {
      // Ignore clipboard errors
    }
  }

  return {
    settings: readonly(settings),
    channel: computed(() => channels[settings.value.pinName]),
    update,
    apply,
    applyPreset,
    reset,
    exportSettings,
    copySettings,
  }
}
