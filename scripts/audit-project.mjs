import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const relative = file => path.relative(root, file).split(path.sep).join('/')
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? files(file) : [file]
  })
}
const reachable = new Set()
const missing = new Set()
function visit(file) {
  if (reachable.has(file)) return
  reachable.add(file)
  if (!/\.(vue|js|mjs|css|json)$/.test(file)) return
  const source = fs.readFileSync(file, 'utf8')
  const imports = /\b(?:import|export)\s+(?:[^'"\n]*?\s+from\s*)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|<style\b[^>]*\bsrc=['"]([^'"]+)['"]|@import\s+['"]([^'"]+)['"]/g
  for (const match of source.matchAll(imports)) {
    const specifier = match.slice(1).find(Boolean).split('?')[0]
    if (!specifier.startsWith('.')) continue
    const base = path.resolve(path.dirname(file), specifier)
    const resolved = [base, base + '.js', base + '.vue', base + '.css', path.join(base, 'index.js')]
      .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
    if (resolved) visit(resolved)
    else missing.add(relative(file) + ' -> ' + specifier)
  }
}
visit(path.join(root, 'src/main.js'))
const sourceFiles = files(path.join(root, 'src'))
// Include data filenames, CSS URLs, WebGL texture filenames and source records.
// Basename matching is deliberately conservative for dynamically built image URLs.
const text = [...reachable].filter(file => /\.(vue|js|mjs|css|json)$/.test(file))
  .map(file => fs.readFileSync(file, 'utf8')).join('\n') + fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const localReferences = text.replace(/https?:\/\/[^\s'"<>`]+/g, '')
const assets = files(path.join(root, 'public'))
const unusedAssets = assets.filter(file => {
  if (file.endsWith('.json')) return false
  const escaped = path.basename(file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return !new RegExp(`(?<![a-zA-Z0-9_.-])${escaped}(?![a-zA-Z0-9_.-])`).test(localReferences)
})
const missingAssets = new Set()
for (const match of localReferences.matchAll(/["'`](\/?(?:images\/|editorial\/|products\/)?[\w.-]+\.(?:png|jpe?g|webp|gif|mp4|svg|ico))["'`]/g)) {
  const reference = match[1].replace(/^\/?images\//, '')
  if (![path.join(root, 'public/images', reference), path.join(root, 'public/images/editorial', reference), path.join(root, 'src/assets', reference)].some(file => fs.existsSync(file))) missingAssets.add(reference)
}
const report = {
  reachable: [...reachable].map(relative).sort(),
  unusedSource: sourceFiles.filter(file => !reachable.has(file)).map(relative).sort(),
  unusedAssets: unusedAssets.map(relative).sort(),
  missingImports: [...missing].sort(),
  missingAssets: [...missingAssets].sort(),
  unusedAssetBytes: unusedAssets.reduce((sum, file) => sum + fs.statSync(file).size, 0)
}
console.log(JSON.stringify(report, null, 2))
if (missing.size || missingAssets.size) process.exitCode = 1
