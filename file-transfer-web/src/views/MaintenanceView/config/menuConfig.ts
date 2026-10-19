export interface MenuItemConfig {
  id?: string
  label?: string
  shortcut?: string
  isDivider?: boolean
  danger?: boolean
  success?: boolean
  amber?: boolean
  bold?: boolean
  semibold?: boolean
  type?: 'checkbox' | 'radio'
  bindKey?: 'showTree' | 'showTable' | 'showConsole' | 'autoSaveLogs'
  group?: string
  value?: string
  badge?: string
  badgeClass?: string
  subArrow?: boolean
}

export interface MenuGroupConfig {
  id: string
  label: string
  alignRight?: boolean
  items: MenuItemConfig[]
}

export const menuList: MenuGroupConfig[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'open_suite', label: 'Open Test Suite / Configuration...', shortcut: 'Ctrl+O' },
      { id: 'save_cfg', label: 'Save Configuration', shortcut: 'Ctrl+S' },
      { id: 'save_cfg_as', label: 'Save Configuration As...' },
      { id: 'recent_cfg', label: 'Recent Configurations', subArrow: true },
      { isDivider: true },
      { id: 'import_baseline', label: 'Import Cal Baseline...' },
      { id: 'export_report', label: 'Export Calibration Report...' },
      { id: 'export_bundle', label: 'Export Diagnostic Bundle (.zip)...' },
      { isDivider: true },
      { id: 'print_summary', label: 'Print Calibration Summary...', shortcut: 'Ctrl+P' },
      { id: 'exit', label: 'Exit Maintenance', shortcut: 'Alt+F4', danger: true }
    ]
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'toggle_tree', label: 'System Boards Tree', type: 'checkbox', bindKey: 'showTree' },
      { id: 'toggle_table', label: 'Monitor Table (TreeGrid)', type: 'checkbox', bindKey: 'showTable' },
      { id: 'toggle_console', label: 'Output Log Console', type: 'checkbox', bindKey: 'showConsole' },
      { isDivider: true },
      { id: 'view_rack', label: 'Hardware Topology (Rack & Slot)...' },
      { id: 'view_thermal', label: 'Thermal & Power Rails Monitor...' },
      { id: 'view_relay', label: 'Relay Life Counter Dashboard...' },
      { isDivider: true },
      { id: 'reset_layout', label: 'Reset Layout to Default' },
      { id: 'toggle_fullscreen', label: 'Full Screen Mode', shortcut: 'F11' }
    ]
  },
  {
    id: 'options',
    label: 'Options',
    items: [
      { id: 'mode_single', label: 'Mode: Single Pass (Default)', type: 'radio', group: 'execMode', value: 'single' },
      { id: 'mode_loop', label: 'Mode: Continuous Loop', type: 'radio', group: 'execMode', value: 'loop' },
      { id: 'mode_halt', label: 'Mode: Halt on First Fail', type: 'radio', group: 'execMode', value: 'halt' },
      { isDivider: true },
      { id: 'cov_quick', label: 'Coverage: Quick Diagnostic' },
      { id: 'cov_full', label: 'Coverage: Full Factory Calibration', bold: true },
      { id: 'cov_cal_only', label: 'Coverage: Verification Only' },
      { isDivider: true },
      { id: 'mutex_strict', label: 'Hardware Mutex: Strict Exclusive', badge: '[LOCKED]', badgeClass: 'tag-badge text-success' },
      { id: 'limits_setup', label: 'Limits & Tolerances Setup...' },
      { id: 'toggle_autosave', label: 'Auto-Save Logs on Test End', type: 'checkbox', bindKey: 'autoSaveLogs' }
    ]
  },
  {
    id: 'run',
    label: 'Run',
    items: [
      { id: 'run_selected', label: 'Run Selected Instances', shortcut: 'F5', success: true, semibold: true },
      { id: 'run_full', label: 'Run Full Calibration', shortcut: 'Ctrl+F5' },
      { id: 'pause', label: 'Pause Execution', shortcut: 'F6' },
      { id: 'stop', label: 'Abort / Stop Test', shortcut: 'F7 / Esc', danger: true },
      { isDivider: true },
      { id: 'step_next', label: 'Step Next Instance', shortcut: 'F10' },
      { id: 'retry_failed', label: 'Retry Failed Instances Only', shortcut: 'Ctrl+R', amber: true, semibold: true },
      { id: 'reset_baseline', label: 'Reset All Status & Baseline' }
    ]
  },
  {
    id: 'debug',
    label: 'Debug',
    items: [
      { id: 'debug_terminal', label: 'Interactive Board Terminal...' },
      { id: 'debug_registers', label: 'Read / Write Hardware Registers...' },
      { id: 'debug_force_pin', label: 'Force Channel / Pin State...' },
      { id: 'debug_ppmu', label: 'PPMU Interactive Instrument...' },
      { isDivider: true },
      { id: 'debug_relay_matrix', label: 'Relay Matrix Interactive Map...' },
      { id: 'debug_tdr', label: 'TDR Cable Alignment / Deskew...' },
      { id: 'debug_memory_dump', label: 'Dump Hardware EEPROM / SRAM...' }
    ]
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'sys_rescan_bus', label: 'Rescan PCIe / PXIe Bus' },
      { id: 'sys_power_on', label: 'System Power ON (Main 48V)', success: true },
      { id: 'sys_power_standby', label: 'System Power Standby' },
      { id: 'sys_cold_reset', label: 'Safe Discharge & Cold Reset...', danger: true, semibold: true },
      { isDivider: true },
      { id: 'sys_dib_interlock', label: 'DIB Interlock Status Check' },
      { id: 'sys_chassis_status', label: 'Chassis Cooling & Fan Status' },
      { id: 'sys_flash_firmware', label: 'Firmware & FPGA Flash Tool...' }
    ]
  },
  {
    id: 'calibration',
    label: 'Calibration',
    items: [
      { id: 'cal_wizard', label: 'Calibration Wizard...', semibold: true },
      { id: 'cal_dmm_setup', label: 'External Standard DMM (3458A)...' },
      { isDivider: true },
      { id: 'cal_commit_eeprom', label: 'Commit Cal Constants to EEPROM...', danger: true, semibold: true },
      { id: 'cal_rollback', label: 'Rollback Cal Constants...' },
      { id: 'cal_restore_baseline', label: 'Restore Factory Baseline' },
      { isDivider: true },
      { id: 'cal_expiry_mgmt', label: 'Cal Expiry & Validity Setup...' }
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    alignRight: true,
    items: [
      { id: 'tools_loopback_test', label: 'Loopback Fixture Self-Test' },
      { id: 'tools_fru_viewer', label: 'Board FRU Info (SN / Rev)...' },
      { id: 'tools_scope_meter', label: 'Internal Scope & DMM Meter...' },
      { isDivider: true },
      { id: 'tools_noise_sweep', label: 'Noise Floor & Cross-Talk Sweep' },
      { id: 'tools_thermal_profile', label: 'Thermal Chamber Profile...' },
      { id: 'tools_log_diff', label: 'Log Comparison & Diff Tool...' }
    ]
  },
  {
    id: 'help',
    label: 'Help',
    alignRight: true,
    items: [
      { id: 'help_manual', label: 'Maintenance Manual', shortcut: 'F1' },
      { id: 'help_pinouts', label: 'Hardware Pinout Reference' },
      { id: 'help_error_lookup', label: 'Error Code Lookup Guide...' },
      { isDivider: true },
      { id: 'help_collect_diag', label: 'Collect Diagnostic Package...' },
      { id: 'help_license', label: 'Hardware License Info' },
      { id: 'help_about', label: 'About Proxima Maintenance...', semibold: true }
    ]
  }
]
