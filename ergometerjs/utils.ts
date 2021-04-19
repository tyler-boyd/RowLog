// Reads a list of bytes as a little-endian integer (the way CSAFE does it)
export function readBytesAsInt(...bytes: number[]): number {
  return bytes.reduce((c, n, idx) => {
    return c + (n << (8*idx))
  }, 0)
}

// Converts an integer to a little-endian byte array
export function writeIntAsBytes(n: number, bytes: number): number[] {
  const ret: number[] = []
  for(let i = 0; i < bytes; i++) {
    ret.push((n >> (8*i)) & 0xFF)
  }

  return ret
}
