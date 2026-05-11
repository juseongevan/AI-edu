import { createWriteStream, existsSync, statSync, readdirSync, readFileSync } from 'fs'
import { join, relative } from 'path'
import { createGzip } from 'zlib'

// Simple tar.gz writer
const BASE = 'C:/Users/JU_SEONG/Desktop/R-BG AI'
const OUT  = 'C:/Users/JU_SEONG/Desktop/vibe-gallery-source.tar.gz'

const INCLUDE = ['src', 'firebase.json', 'firestore.rules', 'storage.rules', '.firebaserc', 'package.json', 'vite.config.js', 'index.html']

function collectFiles(root) {
  const results = []
  function walk(p) {
    const stat = statSync(p)
    if (stat.isDirectory()) {
      for (const f of readdirSync(p)) walk(join(p, f))
    } else {
      results.push({ abs: p, rel: relative(BASE, p).replace(/\\/g, '/'), size: stat.size })
    }
  }
  walk(root)
  return results
}

function padLeft(buf, len) {
  const b = Buffer.alloc(len, 0)
  buf.copy(b)
  return b
}

function tarHeader(name, size) {
  const h = Buffer.alloc(512, 0)
  const nameBytes = Buffer.from(name)
  nameBytes.copy(h, 0)
  Buffer.from('0000644\0').copy(h, 100)  // mode
  Buffer.from('0000000\0').copy(h, 108)  // uid
  Buffer.from('0000000\0').copy(h, 116)  // gid
  Buffer.from(size.toString(8).padStart(11,'0') + '\0').copy(h, 124)  // size
  Buffer.from(Math.floor(Date.now()/1000).toString(8).padStart(11,'0') + '\0').copy(h, 136) // mtime
  Buffer.from(' '.repeat(8)).copy(h, 148) // checksum placeholder
  h[156] = 0x30  // type: regular file
  Buffer.from('ustar\0').copy(h, 257)
  Buffer.from('00').copy(h, 263)
  // compute checksum
  let sum = 0
  for (let i = 0; i < 512; i++) sum += h[i]
  Buffer.from(sum.toString(8).padStart(6,'0') + '\0 ').copy(h, 148)
  return h
}

const gzip = createGzip()
const out  = createWriteStream(OUT)
gzip.pipe(out)

const files = []
for (const item of INCLUDE) {
  const abs = join(BASE, item)
  if (!existsSync(abs)) continue
  const s = statSync(abs)
  if (s.isDirectory()) files.push(...collectFiles(abs))
  else files.push({ abs, rel: item, size: s.size })
}

for (const f of files) {
  const data = readFileSync(f.abs)
  gzip.write(tarHeader(f.rel, f.size))
  gzip.write(data)
  const pad = (512 - (f.size % 512)) % 512
  if (pad > 0) gzip.write(Buffer.alloc(pad, 0))
}
gzip.write(Buffer.alloc(1024, 0)) // end of archive
gzip.end()

out.on('finish', () => {
  const sz = statSync(OUT).size
  console.log(`✅ Created: ${OUT} (${(sz/1024).toFixed(1)} KB)`)
})
out.on('error', e => console.error('Error:', e.message))
