/**
 * 内置纯 TypeScript LZ4 Frame 解压模块 (自包含零外部依赖，专用于 wellen.wasm 压缩流解压)
 */

const MAGIC_NUM = 0x184d2204
const FD_CONTENT_CHKSUM = 0x04
const FD_CONTENT_SIZE = 0x08
const FD_BLOCK_CHKSUM = 0x10
const FD_VERSION = 0x40
const FD_VERSION_MASK = 0xc0
const BS_UNCOMPRESSED = 0x80000000
const BS_SHIFT = 4
const BS_MASK = 7
const MIN_MATCH = 4

const BS_MAP: Record<number, number> = {
  4: 0x10000,
  5: 0x40000,
  6: 0x100000,
  7: 0x400000
}

function readU32(b: Uint8Array, n: number): number {
  let x = 0
  x |= b[n++] << 0
  x |= b[n++] << 8
  x |= b[n++] << 16
  x |= b[n++] << 24
  return x
}

function readU64(b: Uint8Array, n: number): number {
  let x = 0
  x |= b[n++] << 0
  x |= b[n++] << 8
  x |= b[n++] << 16
  x |= b[n++] << 24
  x |= b[n++] << 32
  x |= b[n++] << 40
  x |= b[n++] << 48
  x |= b[n++] << 56
  return x
}

function decompressBound(src: Uint8Array): number {
  let sIndex = 0
  if (readU32(src, sIndex) !== MAGIC_NUM) {
    throw new Error('LZ4: invalid magic number')
  }
  sIndex += 4

  const descriptor = src[sIndex++]
  if ((descriptor & FD_VERSION_MASK) !== FD_VERSION) {
    throw new Error('LZ4: incompatible descriptor version')
  }

  const useBlockSum = (descriptor & FD_BLOCK_CHKSUM) !== 0
  const useContentSize = (descriptor & FD_CONTENT_SIZE) !== 0
  const bsIdx = (src[sIndex++] >> BS_SHIFT) & BS_MASK
  const maxBlockSize = BS_MAP[bsIdx]
  if (maxBlockSize === undefined) {
    throw new Error(`LZ4: invalid block size ${bsIdx}`)
  }

  if (useContentSize) {
    return readU64(src, sIndex)
  }

  sIndex++
  let maxSize = 0
  while (sIndex < src.length) {
    let blockSize = readU32(src, sIndex)
    sIndex += 4
    if (blockSize & BS_UNCOMPRESSED) {
      blockSize &= ~BS_UNCOMPRESSED
      maxSize += blockSize
    } else {
      maxSize += maxBlockSize
    }
    if (blockSize === 0) {
      return maxSize
    }
    if (useBlockSum) {
      sIndex += 4
    }
    sIndex += blockSize
  }
  return maxSize
}

function decompressBlock(
  src: Uint8Array,
  dst: Uint8Array,
  sIndex: number,
  sLength: number,
  dIndex: number
): number {
  const sEnd = sIndex + sLength
  while (sIndex < sEnd) {
    const token = src[sIndex++]
    let literalCount = token >> 4
    if (literalCount > 0) {
      if (literalCount === 0x0f) {
        while (true) {
          literalCount += src[sIndex]
          if (src[sIndex++] !== 0xff) break
        }
      }
      for (const n = sIndex + literalCount; sIndex < n; ) {
        dst[dIndex++] = src[sIndex++]
      }
    }
    if (sIndex >= sEnd) break

    let mLength = token & 0x0f
    const mOffset = src[sIndex++] | (src[sIndex++] << 8)
    if (mLength === 0x0f) {
      while (true) {
        mLength += src[sIndex]
        if (src[sIndex++] !== 0xff) break
      }
    }
    mLength += MIN_MATCH
    for (let i = dIndex - mOffset, n = i + mLength; i < n; ) {
      dst[dIndex++] = dst[i++] | 0
    }
  }
  return dIndex
}

function decompressFrame(src: Uint8Array, dst: Uint8Array): number {
  let sIndex = 0
  let dIndex = 0

  if (readU32(src, sIndex) !== MAGIC_NUM) {
    throw new Error('LZ4: invalid magic number')
  }
  sIndex += 4

  const descriptor = src[sIndex++]
  if ((descriptor & FD_VERSION_MASK) !== FD_VERSION) {
    throw new Error('LZ4: incompatible descriptor version')
  }

  const useBlockSum = (descriptor & FD_BLOCK_CHKSUM) !== 0
  const useContentSum = (descriptor & FD_CONTENT_CHKSUM) !== 0
  const useContentSize = (descriptor & FD_CONTENT_SIZE) !== 0
  const bsIdx = (src[sIndex++] >> BS_SHIFT) & BS_MASK

  if (BS_MAP[bsIdx] === undefined) {
    throw new Error('LZ4: invalid block size')
  }

  if (useContentSize) {
    sIndex += 8
  }
  sIndex++

  while (sIndex < src.length) {
    let compSize = readU32(src, sIndex)
    sIndex += 4
    if (compSize === 0) break

    if (useBlockSum) {
      sIndex += 4
    }

    if ((compSize & BS_UNCOMPRESSED) !== 0) {
      compSize &= ~BS_UNCOMPRESSED
      for (let j = 0; j < compSize; j++) {
        dst[dIndex++] = src[sIndex++]
      }
    } else {
      dIndex = decompressBlock(src, dst, sIndex, compSize, dIndex)
      sIndex += compSize
    }
  }

  if (useContentSum) {
    sIndex += 4
  }

  return dIndex
}

export function decompressLz4(src: Uint8Array, maxSize?: number): Uint8Array {
  const bound = maxSize !== undefined && maxSize > 0 ? maxSize : decompressBound(src)
  const dst = new Uint8Array(bound)
  const size = decompressFrame(src, dst)
  return size !== bound ? dst.slice(0, size) : dst
}
