import { decompressLz4 } from './lz4Decompress'
import type { VcdMetadata, VcdScopeNode, VcdSignal, VcdSignalData, VcdTransition } from '../types'
import bundledWasmUrl from './filehandler.wasm?url'

// 辅助函数：解析 timescale
function parseTimescale(scaleStr: string): { unit: string; multiplier: number } {
  const match = scaleStr.trim().match(/(\d+)\s*([a-zA-Z]+)/)
  if (match) {
    return {
      multiplier: parseInt(match[1], 10) || 1,
      unit: match[2].toLowerCase()
    }
  }
  return { multiplier: 1, unit: 'ns' }
}

// 纯原生 WebAssembly (wellen.wasm) 高性能 VCD 解析器 (自包含、零外部 CDN，内网一键复制即可运行)
async function parseWithWasm(
  buffer: ArrayBuffer,
  fileName: string,
  onProgress?: (percent: number, msg?: string) => void
): Promise<{
  metadata: VcdMetadata
  rootScope: VcdScopeNode
  signalsList: VcdSignal[]
  signalsData: VcdSignalData[]
}> {
  if (onProgress) onProgress(10, '正在加载 VaporView (wellen.wasm) 高性能解析模块...')

  let wasmBytes: ArrayBuffer | null = null

  // 1. 优先从随文件夹打包携带的本地 WASM 资源加载 (100% 自包含内网运行)
  try {
    const res = await fetch(bundledWasmUrl)
    if (res.ok) {
      wasmBytes = await res.arrayBuffer()
    }
  } catch (err) {
    console.warn('[VaporView] Failed to load bundled wasmUrl, trying public fallback:', err)
  }

  // 2. 备用兜底：尝试从 public/wasm 路径获取
  if (!wasmBytes) {
    try {
      const publicUrl = new URL('/wasm/filehandler.wasm', self.location.origin).href
      const res = await fetch(publicUrl)
      if (res.ok) {
        wasmBytes = await res.arrayBuffer()
      }
    } catch (err) {
      console.warn('[VaporView] Public wasm fallback failed:', err)
    }
  }

  if (!wasmBytes) {
    throw new Error('无法加载 WASM 核心模块 (打包路径与 public 路径均不可用)')
  }

  if (onProgress) onProgress(25, '正在初始化 WASM 内存映射与零拷贝流...')

  const vcdBytes = new Uint8Array(buffer)
  let wasmMemory: WebAssembly.Memory
  const decoder = new TextDecoder('utf-8')

  const metadata: VcdMetadata = {
    date: new Date().toLocaleString(),
    version: 'VaporView wellen.wasm',
    timescale: '1ns',
    timeUnit: 'ns',
    timeScaleMultiplier: 1,
    minTime: 0,
    maxTime: 0,
    signalCount: 0,
    fileSize: buffer.byteLength,
    fileName: fileName || 'simulation.vcd',
    engine: 'wellen.wasm (VaporView 核心)'
  }

  const topScopes: { name: string; id: number; type: string }[] = []
  const transitionsMap: Record<number, VcdTransition[]> = {}
  const signalChunkBuffers: Record<number, string[]> = {}
  const compressedChunkBuffers: Record<number, { chunks: Uint8Array[]; loaded: number }> = {}

  const imports = {
    '$root': {
      outputlog: (ptr: number, len: number) => {
        const msg = decoder.decode(new Uint8Array(wasmMemory.buffer, ptr, len))
        console.log('[wellen.wasm log]:', msg)
      },
      fsreadptr: (_fd: number, offset: bigint, ptr: number, length: number): number => {
        const byteOffset = Number(offset)
        const memView = new Uint8Array(wasmMemory.buffer)
        const available = Math.min(length, vcdBytes.byteLength - byteOffset)
        if (available <= 0) return 0
        memView.set(vcdBytes.subarray(byteOffset, byteOffset + available), ptr)
        return available
      },
      setmetadata: (_scopecount: number, varcount: number, timescale: number, u_ptr: number, u_len: number) => {
        const timeunit = decoder.decode(new Uint8Array(wasmMemory.buffer, u_ptr, u_len))
        metadata.signalCount = varcount
        metadata.timescale = `${timescale}${timeunit}`
        metadata.timeUnit = timeunit || 'ns'
        metadata.timeScaleMultiplier = timescale || 1
      },
      setscopetop: (n_ptr: number, n_len: number, id: number, t_ptr: number, t_len: number) => {
        const name = decoder.decode(new Uint8Array(wasmMemory.buffer, n_ptr, n_len))
        const type = decoder.decode(new Uint8Array(wasmMemory.buffer, t_ptr, t_len))
        topScopes.push({ name, id, type })
      },
      setchunksize: (_chunksize: bigint, timeend: bigint, _timetablelength: bigint) => {
        metadata.maxTime = Number(timeend)
      },
      setvartop: () => {},
      sendtransitiondatachunk: (signalid: number, totalchunks: number, chunknum: number, _min: number, _max: number, data_ptr: number, data_len: number) => {
        try {
          const chunkStr = decoder.decode(new Uint8Array(wasmMemory.buffer, data_ptr, data_len))
          if (totalchunks <= 1) {
            const rawTransitions = JSON.parse(chunkStr) as [number, string | number][]
            if (!transitionsMap[signalid]) transitionsMap[signalid] = []
            for (let i = 0; i < rawTransitions.length; i++) {
              transitionsMap[signalid].push({
                time: rawTransitions[i][0],
                value: String(rawTransitions[i][1])
              })
            }
          } else {
            // 大信号跳变数据分片传输：必须拼接完完整 JSON 字符串后再行解析
            if (!signalChunkBuffers[signalid]) {
              signalChunkBuffers[signalid] = new Array(totalchunks)
            }
            signalChunkBuffers[signalid][chunknum] = chunkStr

            let completeCount = 0
            for (let c = 0; c < totalchunks; c++) {
              if (signalChunkBuffers[signalid][c] !== undefined) {
                completeCount++
              }
            }

            if (completeCount === totalchunks) {
              const fullStr = signalChunkBuffers[signalid].join('')
              delete signalChunkBuffers[signalid]
              const rawTransitions = JSON.parse(fullStr) as [number, string | number][]
              if (!transitionsMap[signalid]) transitionsMap[signalid] = []
              for (let i = 0; i < rawTransitions.length; i++) {
                transitionsMap[signalid].push({
                  time: rawTransitions[i][0],
                  value: String(rawTransitions[i][1])
                })
              }
            }
          }
        } catch (err) {
          console.error('Failed to parse transition chunk for signal', signalid, err)
        }
      },
      sendcompressedtransitiondata: (signalid: number, signalwidth: number, totalchunks: number, chunknum: number, _min: number, _max: number, compresseddata_ptr: number, compresseddata_len: number, originalsize: number) => {
        try {
          const chunkSlice = new Uint8Array(wasmMemory.buffer, compresseddata_ptr, compresseddata_len)
          let fullCompressed: Uint8Array | null = null

          if (totalchunks <= 1) {
            fullCompressed = chunkSlice
          } else {
            if (!compressedChunkBuffers[signalid]) {
              compressedChunkBuffers[signalid] = {
                chunks: new Array(totalchunks),
                loaded: 0
              }
            }
            const entry = compressedChunkBuffers[signalid]
            if (!entry.chunks[chunknum]) {
              entry.chunks[chunknum] = new Uint8Array(chunkSlice)
              entry.loaded++
            }
            if (entry.loaded === totalchunks) {
              const totalLen = entry.chunks.reduce((acc, c) => acc + c.byteLength, 0)
              fullCompressed = new Uint8Array(totalLen)
              let offset = 0
              for (const c of entry.chunks) {
                fullCompressed.set(c, offset)
                offset += c.byteLength
              }
              delete compressedChunkBuffers[signalid]
            }
          }

          if (!fullCompressed) return

          const decompressed = decompressLz4(fullCompressed, originalsize)
          const dataView = new DataView(decompressed.buffer, decompressed.byteOffset, decompressed.byteLength)
          const byteIncrement = 8 + signalwidth
          const totalItems = Math.floor(decompressed.length / byteIncrement)
          const list = new Array<VcdTransition>(totalItems)
          let time = 0

          if (signalwidth === 1) {
            for (let idx = 0, i = 0; idx < totalItems; idx++, i += byteIncrement) {
              time += Number(dataView.getBigUint64(i, true))
              const code = decompressed[i + 8]
              const val = code === 49 ? '1' : code === 48 ? '0' : String.fromCharCode(code)
              list[idx] = { time, value: val }
            }
          } else {
            for (let idx = 0, i = 0; idx < totalItems; idx++, i += byteIncrement) {
              time += Number(dataView.getBigUint64(i, true))
              const val = String.fromCharCode.apply(
                null,
                decompressed.subarray(i + 8, i + 8 + signalwidth) as unknown as number[]
              )
              list[idx] = { time, value: val }
            }
          }
          transitionsMap[signalid] = list
        } catch (err) {
          console.error('Failed to decompress transition data for signal', signalid, err)
        }
      },
      sendenumdata: () => {}
    }
  }

  const { instance } = await WebAssembly.instantiate(wasmBytes, imports)
  wasmMemory = instance.exports.memory as WebAssembly.Memory

  if (onProgress) onProgress(45, 'WASM 引擎就绪，正在进行流式解析头部与层级...')

  // 加载并解析 VCD 头部与变量：对大于 8MB 的文件启用流式 BufReader (loadStatic=0)，避免 WASM 线性内存重复分配整块 100MB 缓冲区
  const loadStatic = vcdBytes.byteLength <= 8 * 1024 * 1024 ? 1 : 0
  ;(instance.exports.loadfile as Function)(BigInt(vcdBytes.byteLength), 0, loadStatic, 60 * 1024)
  if (onProgress) onProgress(60, '正在提取信号层次树与索引表...')
  ;(instance.exports.readbody as Function)()

  // 递归遍历 Scopes 获取完整层次结构
  const rootScope: VcdScopeNode = {
    name: 'ROOT',
    fullName: 'ROOT',
    children: [],
    signals: []
  }

  const signalsList: VcdSignal[] = []

  function getScopeChildren(scopeId: number, startIndex: number): any {
    const ret = (instance.exports.getchildren as Function)(scopeId, startIndex)
    const view = new DataView(wasmMemory.buffer, ret, 8)
    const strPtr = view.getUint32(0, true)
    const strLen = view.getUint32(4, true)
    const jsonStr = decoder.decode(new Uint8Array(wasmMemory.buffer, strPtr, strLen))
    if (instance.exports.cabi_post_getchildren) {
      ;(instance.exports.cabi_post_getchildren as Function)(ret)
    }
    return JSON.parse(jsonStr)
  }

  function traverseScope(scopeId: number, scopeName: string, parentPath: string): VcdScopeNode {
    const fullName = parentPath === 'ROOT' ? scopeName : `${parentPath}.${scopeName}`
    const node: VcdScopeNode = {
      name: scopeName,
      fullName,
      children: [],
      signals: []
    }

    try {
      let startIndex = 0
      let remaining = 1
      let loopCount = 0

      while (remaining > 0 && loopCount < 50) {
        loopCount++
        const data = getScopeChildren(scopeId, startIndex)
        if (!data) break

        if (data.vars) {
          for (const v of data.vars) {
            const fullSigName = `${fullName}.${v.name}`
            const sig: VcdSignal = {
              id: fullSigName, // 全局唯一层级标识，避免同网 Alias 信号在 UI 树中主键冲突
              netId: String(v.signalId),
              name: v.name,
              size: v.width || 1,
              type: v.type || 'wire',
              scope: fullName,
              fullName: fullSigName
            }
            node.signals.push(sig)
            signalsList.push(sig)
          }
        }

        if (data.scopes) {
          for (const childScope of data.scopes) {
            const childNode = traverseScope(childScope.id, childScope.name, fullName)
            node.children.push(childNode)
          }
        }

        remaining = data.remainingItems || 0
        startIndex += data.totalReturned || 0
      }
    } catch (e) {
      console.warn('Error reading children for scope', scopeId, e)
    }

    return node
  }

  for (const top of topScopes) {
    const topNode = traverseScope(top.id, top.name, 'ROOT')
    rootScope.children.push(topNode)
  }

  if (onProgress) onProgress(75, `已解析 ${signalsList.length} 个信号，正在拉取波形跳变数据...`)

  // 批量拉取波形跳变数据 (使用 Set 避免对同网 alias 信号重复发起 wasm 查询，以 8 个信号为一批流式解压降低峰值内存)
  const allSignalIds = Array.from(new Set(signalsList.map(s => Number(s.netId)).filter(id => !isNaN(id))))
  const BATCH_SIZE = 8
  for (let i = 0; i < allSignalIds.length; i += BATCH_SIZE) {
    const batch = allSignalIds.slice(i, i + BATCH_SIZE)
    const sigPtr = (instance.exports.cabi_realloc as Function)(0, 0, 4, batch.length * 4)
    new Uint32Array(wasmMemory.buffer, sigPtr, batch.length).set(batch)
    ;(instance.exports.getsignaldata as Function)(sigPtr, batch.length)

    if (onProgress) {
      const pct = Math.floor(75 + ((i + batch.length) / allSignalIds.length) * 20)
      onProgress(pct, `正在解压波形数据 (${i + batch.length}/${allSignalIds.length})...`)
    }
  }

  const signalsData: VcdSignalData[] = signalsList.map(sig => ({
    ...sig,
    transitions: transitionsMap[Number(sig.netId)] || []
  }))

  if (onProgress) onProgress(100, '波形解析与构建完成！')

  return {
    metadata,
    rootScope,
    signalsList,
    signalsData
  }
}

// 纯 JS 解析器（作为备用方案）
function parseVcdContentJs(text: string, onProgress?: (percent: number, msg?: string) => void): {
  metadata: VcdMetadata
  rootScope: VcdScopeNode
  signalsList: VcdSignal[]
  signalsData: VcdSignalData[]
} {
  const lines = text.split(/\r?\n/)
  const totalLines = lines.length

  const metadata: VcdMetadata = {
    timeUnit: 'ns',
    timeScaleMultiplier: 1,
    minTime: 0,
    maxTime: 0,
    signalCount: 0
  }

  const rootScope: VcdScopeNode = {
    name: 'ROOT',
    fullName: 'ROOT',
    children: [],
    signals: []
  }

  const scopeStack: VcdScopeNode[] = [rootScope]
  const signalMap = new Map<string, VcdSignal>()
  const signalsList: VcdSignal[] = []
  const signalsDataMap: Record<string, VcdTransition[]> = {}

  let inHeader = true
  let currentTime = 0
  let lineIdx = 0

  while (lineIdx < totalLines && inHeader) {
    const rawLine = lines[lineIdx].trim()
    lineIdx++

    if (!rawLine || rawLine.startsWith('$comment')) continue

    if (rawLine.startsWith('$date')) {
      metadata.date = rawLine.replace('$date', '').replace('$end', '').trim()
    } else if (rawLine.startsWith('$version')) {
      metadata.version = rawLine.replace('$version', '').replace('$end', '').trim()
    } else if (rawLine.startsWith('$timescale')) {
      const tsContent = rawLine.replace('$timescale', '').replace('$end', '').trim()
      const { unit, multiplier } = parseTimescale(tsContent)
      metadata.timescale = `${multiplier}${unit}`
      metadata.timeUnit = unit
      metadata.timeScaleMultiplier = multiplier
    } else if (rawLine.startsWith('$scope')) {
      const parts = rawLine.split(/\s+/)
      const scopeName = parts[2] || 'module'
      const parent = scopeStack[scopeStack.length - 1]
      const fullName = parent.fullName === 'ROOT' ? scopeName : `${parent.fullName}.${scopeName}`
      const newScope: VcdScopeNode = {
        name: scopeName,
        fullName,
        children: [],
        signals: []
      }
      parent.children.push(newScope)
      scopeStack.push(newScope)
    } else if (rawLine.startsWith('$upscope')) {
      if (scopeStack.length > 1) {
        scopeStack.pop()
      }
    } else if (rawLine.startsWith('$var')) {
      const parts = rawLine.split(/\s+/)
      if (parts.length >= 5) {
        const type = parts[1]
        const size = parseInt(parts[2], 10) || 1
        const netId = parts[3]
        const nameWithBus = parts.slice(4).join(' ').replace('$end', '').trim()
        const currentScope = scopeStack[scopeStack.length - 1]
        const fullName = currentScope.fullName === 'ROOT' ? nameWithBus : `${currentScope.fullName}.${nameWithBus}`

        const sig: VcdSignal = {
          id: fullName, // 全局唯一 UI 标识
          netId, // 原始 VCD 标识符，如 '&'
          name: nameWithBus,
          size,
          type,
          scope: currentScope.fullName,
          fullName
        }

        signalMap.set(netId, sig)
        signalsList.push(sig)
        currentScope.signals.push(sig)
        if (!signalsDataMap[netId]) {
          signalsDataMap[netId] = []
        }
      }
    } else if (rawLine.startsWith('$enddefinitions')) {
      inHeader = false
      break
    }
  }

  metadata.signalCount = signalsList.length

  const reportStep = Math.max(10000, Math.floor((totalLines - lineIdx) / 10))

  for (; lineIdx < totalLines; lineIdx++) {
    const line = lines[lineIdx].trim()
    if (!line || line.startsWith('$dump') || line.startsWith('$end')) continue

    if (line.charCodeAt(0) === 35) { // '#'
      currentTime = parseInt(line.substring(1), 10) || 0
      if (currentTime > metadata.maxTime) {
        metadata.maxTime = currentTime
      }
      continue
    }

    const firstChar = line.charAt(0)
    if (firstChar === 'b' || firstChar === 'B' || firstChar === 'r' || firstChar === 'R') {
      const spaceIdx = line.indexOf(' ')
      if (spaceIdx > 0) {
        const val = line.substring(1, spaceIdx).trim()
        const id = line.substring(spaceIdx + 1).trim()
        const target = signalsDataMap[id]
        if (target) {
          target.push({ time: currentTime, value: val })
        }
      }
      continue
    }

    if (line.length >= 2) {
      const val = line.charAt(0)
      const id = line.substring(1).trim()
      const target = signalsDataMap[id]
      if (target) {
        target.push({ time: currentTime, value: val })
      }
    }

    if (lineIdx % reportStep === 0 && onProgress) {
      const percent = Math.floor(20 + ((lineIdx / totalLines) * 75))
      onProgress(percent, `正在解析波形跳变 (${percent}%)...`)
    }
  }

  const signalsData: VcdSignalData[] = signalsList.map(sig => ({
    ...sig,
    transitions: signalsDataMap[sig.netId || sig.id] || []
  }))

  return {
    metadata,
    rootScope,
    signalsList,
    signalsData
  }
}

// 生成真实芯片仿真 Demo 数据
function generateDemoVcd(): {
  metadata: VcdMetadata
  rootScope: VcdScopeNode
  signalsList: VcdSignal[]
  signalsData: VcdSignalData[]
} {
  const result = parseVcdContentJs(createDemoVcdText())
  result.metadata.fileName = 'riscv_soc_core_demo.vcd'
  result.metadata.version = 'ChipSimulation VCD Demo 2.0 (RISC-V SoC Architecture)'
  return result
}

function createDemoVcdText(): string {
  let vcd = `$date
   ${new Date().toLocaleString()}
$end
$version
   VaporView wellen.wasm Real VCD Simulation
$end
$timescale 1ns $end
$scope module tb_top $end

$scope module u_clk_rst_gen $end
$var wire 1 a clk_100mhz $end
$var wire 1 b clk_50mhz $end
$var wire 1 c rst_n $end
$var wire 1 d pll_locked $end
$upscope $end

$scope module u_cpu_core $end
$var wire 1 e clk $end
$var wire 1 f rst_n $end
$var wire 32 g pc[31:0] $end
$var wire 32 h instruction[31:0] $end
$var wire 1 i trap_flag $end

$scope module u_fetch_stage $end
$var wire 32 j pc_curr[31:0] $end
$var wire 32 k pc_next[31:0] $end
$var wire 1 l fetch_valid $end
$upscope $end

$scope module u_decode_stage $end
$var wire 7 m opcode[6:0] $end
$var wire 5 n rd[4:0] $end
$var wire 5 o rs1[4:0] $end
$var wire 5 p rs2[4:0] $end
$var wire 32 q imm[31:0] $end
$upscope $end

$scope module u_alu_unit $end
$var wire 4 r alu_op[3:0] $end
$var wire 32 s alu_src_a[31:0] $end
$var wire 32 t alu_src_b[31:0] $end
$var wire 32 u alu_result[31:0] $end
$var wire 1 v alu_zero $end
$upscope $end

$scope module u_reg_file $end
$var wire 1 w reg_we $end
$var wire 32 x reg_ra[31:0] $end
$var wire 32 y reg_sp[31:0] $end
$var wire 32 z reg_a0[31:0] $end
$var wire 32 A reg_t0[31:0] $end
$upscope $end

$upscope $end

$scope module u_axi_bus $end
$var wire 32 B axi_awaddr[31:0] $end
$var wire 1 C axi_awvalid $end
$var wire 32 D axi_wdata[31:0] $end
$var wire 1 E axi_wvalid $end
$var wire 1 F axi_bready $end
$upscope $end

$scope module u_sram_controller $end
$var wire 1 G mem_cs $end
$var wire 1 H mem_we $end
$var wire 16 I mem_addr[15:0] $end
$var wire 32 J mem_wdata[31:0] $end
$var wire 32 K mem_rdata[31:0] $end
$upscope $end

$scope module u_uart_peripheral $end
$var wire 1 L uart_tx $end
$var wire 1 M uart_rx $end
$var wire 1 N baud_clk $end
$var wire 1 O tx_busy $end
$upscope $end

$upscope $end
$enddefinitions $end
#0
$dumpvars
0a
0b
0c
0d
0e
0f
b00000000000000000000000000000000 g
b00000000000000000000000000000000 h
0i
b00000000000000000000000000000000 j
b00000000000000000000000000000100 k
0l
b0000000 m
b00000 n
b00000 o
b00000 p
b00000000000000000000000000000000 q
b0000 r
b00000000000000000000000000000000 s
b00000000000000000000000000000000 t
b00000000000000000000000000000000 u
1v
0w
b00000000000000000000000000000000 x
b00000000000000010000000000000000 y
b00000000000000000000000000000000 z
b00000000000000000000000000000000 A
b00000000000000000000000000000000 B
0C
b00000000000000000000000000000000 D
0E
1F
0G
0H
b0000000000000000 I
b00000000000000000000000000000000 J
b00000000000000000000000000000000 K
1L
1M
0N
0O
$end
`
  const instructions = [
    { pc: '00000000000000000000000000000100', next: '00000000000000000000000000001000', inst: '00000000000100000000000010010011', op: '0001', res: '00000000000000000000000000000001', imm: '00000000000000000000000000000001' },
    { pc: '00000000000000000000000000001000', next: '00000000000000000000000000001100', inst: '00000000001000000000000100010011', op: '0001', res: '00000000000000000000000000000010', imm: '00000000000000000000000000000010' },
    { pc: '00000000000000000000000000001100', next: '00000000000000000000000000010000', inst: '00000000001000001000000110110011', op: '0000', res: '00000000000000000000000000000011', imm: '00000000000000000000000000000000' },
    { pc: '00000000000000000000000000010000', next: '00000000000000000000000000010100', inst: '00000000001100010010000000100011', op: '0000', res: '00000000000000000000000000000011', imm: '00000000000000000000000000000000' },
    { pc: '00000000000000000000000000010100', next: '00000000000000000000000000011000', inst: '00000000000000010010001000000011', op: '0000', res: '00000000000000000000000000000011', imm: '00000000000000000000000000000000' },
    { pc: '00000000000000000000000000011000', next: '00000000000000000000000000011100', inst: '00000000010000001000001010110011', op: '0010', res: '00000000000000000000000000000000', imm: '00000000000000000000000000000000' },
    { pc: '00000000000000000000000000011100', next: '00000000000000000000000000100000', inst: '00000000000000000000000001101111', op: '0000', res: '00000000000000000000000000000000', imm: '00000000000000000000000000000100' }
  ]

  // VCD 标准要求时间戳严格递增，按时间顺序归并所有仿真事件
  const eventMap = new Map<number, string[]>()
  const addEv = (t: number, line: string) => {
    let list = eventMap.get(t)
    if (!list) {
      list = []
      eventMap.set(t, list)
    }
    list.push(line)
  }

  for (let t = 10; t <= 2000; t += 10) {
    const clk100 = (t / 10) % 2 === 1 ? '1' : '0'
    const clk50 = Math.floor(t / 20) % 2 === 1 ? '1' : '0'
    const baud = Math.floor(t / 80) % 2 === 1 ? '1' : '0'
    addEv(t, `${clk100}a`)
    addEv(t, `${clk50}b`)
    addEv(t, `${clk100}e`)
    addEv(t, `${baud}N`)
  }

  addEv(50, '1c')
  addEv(50, '1d')
  addEv(50, '1f')

  for (let cycle = 0; cycle < 45; cycle++) {
    const t = 70 + cycle * 40
    if (t > 2000) break
    const i = cycle % instructions.length
    const item = instructions[i]
    const pcVal = ((cycle + 1) * 4).toString(2).padStart(32, '0')
    const nextVal = ((cycle + 2) * 4).toString(2).padStart(32, '0')
    addEv(t, `b${pcVal} g`)
    addEv(t, `b${pcVal} j`)
    addEv(t, `b${nextVal} k`)
    addEv(t, `b${item.inst} h`)
    addEv(t, `b${item.op} r`)
    addEv(t, `b${item.res} u`)
    addEv(t, `b${item.imm} q`)
    addEv(t, '1l')
    addEv(t, cycle % 3 === 0 ? '0w' : '1w')
    if (i === 3) {
      addEv(t, 'b00000000000000000000000000000010 I')
      addEv(t, 'b00000000000000000000000000000011 J')
      addEv(t, '1G')
      addEv(t, '1H')
      addEv(t, '1C')
      addEv(t, '1E')
    } else if (i === 4) {
      addEv(t, '0H')
      addEv(t, 'b00000000000000000000000000000011 K')
    } else {
      addEv(t, '0G')
      addEv(t, '0C')
      addEv(t, '0E')
    }
    addEv(t, item.op === '0010' ? '1v' : '0v')
  }

  addEv(600, '0L')
  addEv(600, '1O')
  addEv(800, '1L')
  addEv(800, '0O')
  addEv(1400, '0L')
  addEv(1400, '1O')
  addEv(1600, '1L')
  addEv(1600, '0O')

  const sortedTimes = Array.from(eventMap.keys()).sort((a, b) => a - b)
  for (const t of sortedTimes) {
    vcd += `#${t}\n${eventMap.get(t)!.join('\n')}\n`
  }
  return vcd
}

// 监听主线程消息
self.onmessage = async (e: MessageEvent) => {
  const { type, buffer, fileName } = e.data

  if (type === 'GENERATE_DEMO') {
    const t0 = performance.now()
    try {
      const demoVcdText = createDemoVcdText()
      const encoder = new TextEncoder()
      const buf = encoder.encode(demoVcdText).buffer
      const result = await parseWithWasm(buf, 'riscv_soc_core_demo.vcd')
      result.metadata.parseDuration = Math.round(performance.now() - t0)
      result.metadata.engine = 'wellen.wasm (VaporView 核心)'
      console.log(`%c[VaporView wellen.wasm]%c 芯片仿真示例已通过 WASM 引擎解析完成！耗时: ${result.metadata.parseDuration}ms, 信号数: ${result.signalsList.length}`, 'color:#67c23a;font-weight:bold', '')
      self.postMessage({
        type: 'PARSE_COMPLETE',
        payload: result
      })
      return
    } catch (err: any) {
      console.warn('WASM demo failed, fallback to mock demo', err)
      const demo = generateDemoVcd()
      self.postMessage({
        type: 'PARSE_COMPLETE',
        payload: demo
      })
      return
    }
  }

  if (type === 'PARSE_VCD' && buffer) {
    try {
      self.postMessage({ type: 'PROGRESS', percent: 5, message: '正在启动 WebAssembly (wellen) 核心解析引擎...' })

      const t0 = performance.now()
      let result
      try {
        result = await parseWithWasm(buffer, fileName, (percent, msg) => {
          self.postMessage({ type: 'PROGRESS', percent, message: msg })
        })
        result.metadata.parseDuration = Math.round(performance.now() - t0)
        result.metadata.engine = 'wellen.wasm (VaporView 核心)'
        console.log(`%c[VaporView wellen.wasm]%c 本地大文件 VCD 已通过 WASM 引擎解析完成！耗时: ${result.metadata.parseDuration}ms, 信号数: ${result.signalsList.length}`, 'color:#67c23a;font-weight:bold', '')
      } catch (wasmErr: any) {
        console.warn('WASM 解析失败，自动切换至备用 JS 解析器:', wasmErr)
        self.postMessage({ type: 'PROGRESS', percent: 30, message: 'WASM 引擎异常，正在切换至备用流式解析器...' })
        const decoder = new TextDecoder('utf-8')
        const text = decoder.decode(buffer)
        result = parseVcdContentJs(text, (percent, msg) => {
          self.postMessage({ type: 'PROGRESS', percent, message: msg })
        })
        result.metadata.engine = 'JS Fallback'
      }

      self.postMessage({
        type: 'PARSE_COMPLETE',
        payload: result
      })
    } catch (err: any) {
      console.error('VCD 解析失败:', err)
      self.postMessage({
        type: 'PARSE_ERROR',
        error: `VCD 解析失败: ${err.message}`
      })
    }
  }
}
