<script setup lang="ts">
import { onDeactivated, shallowRef } from 'vue'
import TimingPanel from './components/TimingPanel.vue'
import CircuitPanel from './components/CircuitPanel.vue'
import InstrumentDialog from './components/InstrumentDialog.vue'
import { usePinSettings } from './usePinSettings'
import type { DialogKind } from './model'
import './pin-electronics.css'

const { settings, status, storageError, channel, update, apply, reset, exportSettings } = usePinSettings()
const dialog = shallowRef<DialogKind | null>(null)
onDeactivated(() => { dialog.value = null })
</script>

<template>
  <div class="pe-page">
    <el-config-provider size="default">
      <div class="pe-workspace">
        <header class="pe-page-header">
          <div class="pe-identity"><span class="pe-brand" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><path d="M2 15h6l3-9 6 16 3-9h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></span><div><p class="pe-eyebrow">PRECISION WORKSPACE</p><h1>Pin Electronics</h1></div></div>
          <el-tag effect="plain">Lab</el-tag>
        </header>
        <section class="pe-workbench" aria-label="Pin configuration workspace">
          <div class="pe-toolbar"><span>PIN CONFIGURATION</span><span>I/O CONTROL / LOCAL</span></div>
          <TimingPanel :settings="settings" @change="update" />
          <CircuitPanel :settings="settings" :channel="channel" @change="update" @open="dialog = $event" />
          <footer class="pe-footer"><span role="status" aria-live="polite" :class="{ 'pe-warning': storageError }">{{ status }}</span><div><el-button @click="reset">Reset</el-button><el-button type="primary" plain @click="exportSettings">Export JSON ↗</el-button></div></footer>
        </section>
        <p class="pe-workspace-note">Local configuration · no instrument connected</p>
      </div>
      <InstrumentDialog :kind="dialog" :settings="settings" @close="dialog = null" @apply="apply" />
    </el-config-provider>
  </div>
</template>
