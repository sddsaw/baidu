#!/usr/bin/env node
/**
 * 100MB 真实感 RISC-V SoC VCD 波形文件生成器
 * 用法：
 *   node scripts/generate-vcd.mjs [目标大小MB] [输出路径]
 * 示例：
 *   node scripts/generate-vcd.mjs 100 ./test_100mb_soc.vcd
 */

import fs from 'node:fs'
import path from 'node:path'

const targetMB = Number(process.argv[2]) || 100
const outputPath = path.resolve(process.argv[3] || `./test_${targetMB}mb_soc.vcd`)
const targetBytes = targetMB * 1024 * 1024

console.log(`正在生成 ${targetMB}MB VCD 波形文件: ${outputPath} ...`)
const startTime = Date.now()

const stream = fs.createWriteStream(outputPath, { highWaterMark: 1024 * 1024 })

function toBin(val, width) {
  return (val >>> 0).toString(2).padStart(width, '0')
}

// 构建多层级 SoC 信号定义 (CPU Core + AXI Interconnect + DDR Controller + Peripherals)
const headerLines = [
  '$date',
  `   ${new Date().toUTCString()}`,
  '$end',
  '$version',
  '   Verilator 5.024 + RISC-V SoC Benchmark Generator',
  '$end',
  '$timescale 1ns $end',
  '$scope module soc_top $end',
  '$var wire 1 ! sys_clk $end',
  '$var wire 1 " sys_rst_n $end',
  '$var wire 1 # irq_timer $end',
  '$var wire 1 $ irq_ext $end',
  '',
  '$scope module u_riscv_core $end',
  '$var wire 32 % pc [31:0] $end',
  '$var wire 32 & instr [31:0] $end',
  '$var wire 4 \' alu_op [3:0] $end',
  '$var wire 32 ( alu_out [31:0] $end',
  '$var wire 32 ) reg_rs1 [31:0] $end',
  '$var wire 32 * reg_rs2 [31:0] $end',
  '$var wire 5 + rd_idx [4:0] $end',
  '$var wire 1 , reg_we $end',
  '$var wire 1 - branch_taken $end',
  '$var wire 1 . pipeline_stall $end',
  '$var wire 3 / core_state [2:0] $end',
  '$upscope $end',
  '',
  '$scope module u_axi_bus $end',
  '$var wire 1 0 awvalid $end',
  '$var wire 1 1 awready $end',
  '$var wire 32 2 awaddr [31:0] $end',
  '$var wire 8 3 awlen [7:0] $end',
  '$var wire 1 4 wvalid $end',
  '$var wire 1 5 wready $end',
  '$var wire 64 6 wdata [63:0] $end',
  '$var wire 8 7 wstrb [7:0] $end',
  '$var wire 1 8 arvalid $end',
  '$var wire 1 9 arready $end',
  '$var wire 32 : araddr [31:0] $end',
  '$var wire 1 ; rvalid $end',
  '$var wire 64 < rdata [63:0] $end',
  '$var wire 2 = rresp [1:0] $end',
  '$upscope $end',
  '',
  '$scope module u_l1_dcache $end',
  '$var wire 1 > cache_req $end',
  '$var wire 1 ? cache_hit $end',
  '$var wire 1 @ cache_miss $end',
  '$var wire 16 A tag_ram_dout [15:0] $end',
  '$var wire 32 B miss_counter [31:0] $end',
  '$upscope $end',
  '',
  '$scope module u_dma_engine $end',
  '$var wire 1 C dma_busy $end',
  '$var wire 1 D dma_done $end',
  '$var wire 32 E dma_src_addr [31:0] $end',
  '$var wire 32 F dma_dst_addr [31:0] $end',
  '$var wire 16 G dma_rem_bytes [15:0] $end',
  '$upscope $end',
  '$upscope $end',
  '$enddefinitions $end',
  '$dumpvars',
  '0!',
  '0"',
  '0#',
  '0$',
  'b00000000000000000000000000000000 %',
  'b00000000000000000000000000010011 &',
  'b0000 \'',
  'b00000000000000000000000000000000 (',
  'b00000000000000000000000000000000 )',
  'b00000000000000000000000000000000 *',
  'b00000 +',
  '0,',
  '0-',
  '0.',
  'b000 /',
  '00',
  '11',
  'b00000000000000000000000000000000 2',
  'b00000000 3',
  '04',
  '15',
  'b0000000000000000000000000000000000000000000000000000000000000000 6',
  'b11111111 7',
  '08',
  '19',
  'b00000000000000000000000000000000 :',
  '0;',
  'b0000000000000000000000000000000000000000000000000000000000000000 <',
  'b00 =',
  '0>',
  '0?',
  '0@',
  'b0000000000000000 A',
  'b00000000000000000000000000000000 B',
  '0C',
  '0D',
  'b10000000000000000000000000000000 E',
  'b10000001000000000000000000000000 F',
  'b0001000000000000 G',
  '$end',
  '',
]

let bytesWritten = 0
let timestamp = 0
let cycle = 0
let pc = 0x80000000 >>> 0
let missCount = 0

const headerStr = headerLines.join('\n')
stream.write(headerStr)
bytesWritten += Buffer.byteLength(headerStr)

function generateBatch() {
  const chunks = []
  let batchBytes = 0

  while (batchBytes < 512 * 1024 && bytesWritten + batchBytes < targetBytes) {
    timestamp += 5
    const clk = (timestamp / 5) & 1
    let line = `#${timestamp}\n${clk}!\n`

    if (timestamp === 25) {
      line += '1"\n' // 释放复位 sys_rst_n = 1
    }

    // 上升沿触发同步信号跳变
    if (clk === 1 && timestamp >= 25) {
      cycle++
      const stall = cycle % 19 === 0 ? 1 : 0
      const branch = !stall && cycle % 11 === 0 ? 1 : 0

      if (!stall) {
        pc = branch ? (pc + 0x40) >>> 0 : (pc + 4) >>> 0
      }

      const instr = ((cycle * 0x1f3d5b79) ^ (pc >>> 2)) >>> 0
      const aluOp = cycle & 0xf
      const rs1 = (cycle * 0x01010101) >>> 0
      const rs2 = (cycle * 0x12345678) >>> 0
      const aluOut = (rs1 + rs2) >>> 0
      const rdIdx = (cycle + 1) & 0x1f
      const regWe = stall ? 0 : 1
      const state = stall ? 4 : cycle % 5

      line += `b${toBin(pc, 32)} %\n`
      line += `b${toBin(instr, 32)} &\n`
      line += `b${toBin(aluOp, 4)} '\n`
      line += `b${toBin(aluOut, 32)} (\n`
      line += `b${toBin(rs1, 32)} )\n`
      line += `b${toBin(rs2, 32)} *\n`
      line += `b${toBin(rdIdx, 5)} +\n`
      line += `${regWe},\n`
      line += `${branch}-\n`
      line += `${stall}.\n`
      line += `b${toBin(state, 3)} /\n`

      // AXI 读写事务
      if (cycle % 4 === 0) {
        const awvalid = cycle % 8 === 0 ? 1 : 0
        const wvalid = awvalid
        const arvalid = cycle % 8 === 4 ? 1 : 0
        const rvalid = cycle % 8 === 6 ? 1 : 0
        const addr = (0x10000000 + ((cycle * 64) & 0xfffff)) >>> 0
        const dataHi = toBin((cycle * 0xdeadbeef) >>> 0, 32)
        const dataLo = toBin((cycle * 0xcafebabe) >>> 0, 32)

        line += `${awvalid}0\n`
        line += `b${toBin(addr, 32)} 2\n`
        line += `b${toBin(cycle & 0xff, 8)} 3\n`
        line += `${wvalid}4\n`
        line += `b${dataHi}${dataLo} 6\n`
        line += `${arvalid}8\n`
        line += `b${toBin(addr ^ 0x4000, 32)} :\n`
        line += `${rvalid};\n`
        line += `b${dataLo}${dataHi} <\n`

        // 偶尔插入 X/Z 状态以测试高阻态与不定态高亮渲染 (rresp 位宽为 2 bit)
        if (cycle % 200 === 0) {
          line += 'bxz =\n'
        } else if (cycle % 200 === 4) {
          line += 'b00 =\n'
        }
      }

      // L1 Cache & DMA 状态
      if (cycle % 7 === 0) {
        const isMiss = cycle % 35 === 0 ? 1 : 0
        if (isMiss) missCount++
        line += `1>\n${isMiss ? 0 : 1}?\n${isMiss}@\n`
        line += `b${toBin((cycle * 17) & 0xffff, 16)} A\n`
        if (isMiss) {
          line += `b${toBin(missCount, 32)} B\n`
        }
      }

      if (cycle % 16 === 0) {
        const dmaBusy = (cycle >> 4) & 1
        line += `${dmaBusy}C\n${dmaBusy ^ 1}D\n`
        line += `b${toBin(0x80000000 + (cycle << 2), 32)} E\n`
        line += `b${toBin(0x81000000 + (cycle << 2), 32)} F\n`
        line += `b${toBin(4096 - ((cycle * 8) & 0xfff), 16)} G\n`
      }

      if (cycle % 100 === 0) {
        line += `${(cycle / 100) & 1}#\n`
      }
    }

    chunks.push(line)
    batchBytes += Buffer.byteLength(line)
  }

  const payload = chunks.join('')
  bytesWritten += Buffer.byteLength(payload)

  if (bytesWritten >= targetBytes) {
    stream.end(payload, () => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
      const actualMB = (bytesWritten / (1024 * 1024)).toFixed(2)
      console.log(
        `✅ 生成完成！文件大小: ${actualMB} MB | 总时钟周期: ${cycle} | 耗时: ${elapsed}s\n路径: ${outputPath}`,
      )
    })
  } else {
    if (!stream.write(payload)) {
      stream.once('drain', generateBatch)
    } else {
      setImmediate(generateBatch)
    }
  }
}

generateBatch()
