export interface VcdSignal {
  id: string
  netId?: string
  name: string
  size: number
  type: string
  scope: string
  fullName: string
}

export interface VcdTransition {
  time: number
  value: string
}

export interface VcdSignalData extends VcdSignal {
  transitions: VcdTransition[]
}

export interface VcdScopeNode {
  name: string
  fullName: string
  children: VcdScopeNode[]
  signals: VcdSignal[]
}

export interface VcdMetadata {
  date?: string
  version?: string
  timescale?: string
  timeUnit: string
  timeScaleMultiplier: number
  minTime: number
  maxTime: number
  signalCount: number
  fileSize?: number
  fileName?: string
  engine?: string
  parseDuration?: number
}

export interface NetlistTreeNode {
  id: string
  name: string
  fullName: string
  isScope: boolean
  isSignal: boolean
  size: number
  type?: string
  signalId?: string
  children?: NetlistTreeNode[]
}

export interface CursorState {
  time1: number | null
  time2: number | null
}
