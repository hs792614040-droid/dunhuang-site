import * as THREE from 'three'
import { buildStatue } from './sculpture3d.js'

const V = (x, y, z) => new THREE.Vector3(x, y, z)
const clamp = THREE.MathUtils.clamp
const viewpoints = {
  room: [V(0, 2.32, 8.5), V(0, 2.35, -4.9)],
  flight: [V(-.9, 2.34, .45), V(-5.6, 2.44, -2.25)],
  statue: [V(0, 1.95, -.27), V(0, 1.93, -4.9)],
  face: [V(.07, 2.86, -3.12), V(0, 2.86, -4.8)],
  lotus: [V(.16, 1.26, -2.53), V(0, .95, -4.75)],
  scroll: [V(.9, 2.34, .45), V(5.6, 2.44, -2.25)],
  ceiling: [V(0, 4.55, 2), V(0, 5.76, -.1)],
  space: [V(-3.8, 3.05, 7.5), V(0, 2.8, -2.5)]
}

function stoneTexture(base, worn, tiled = false) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')
  let seed = 47
  const random = () => (seed = seed * 16807 % 2147483647) / 2147483647
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 270; i++) {
    const x = random() * 512, y = random() * 512, radius = 9 + random() * 95
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
    g.addColorStop(0, i % 3 ? worn : '#0c070835')
    g.addColorStop(1, '#00000000')
    ctx.fillStyle = g
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }
  for (let i = 0; i < 16000; i++) {
    ctx.fillStyle = i % 2 ? '#140b0929' : '#f9daab26'
    ctx.fillRect(random() * 512, random() * 512, 1 + random() * 2, 1 + random() * 2)
  }
  if (tiled) {
    ctx.strokeStyle = '#170f0cd0'
    ctx.lineWidth = 4
    ctx.strokeRect(1, 1, 510, 510)
    ctx.strokeStyle = '#f2d6a631'
    ctx.lineWidth = 1
    ctx.strokeRect(4, 4, 504, 504)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

export function createGalleryScene(canvas, onMarkers, onLost) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.28
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x241710)
  scene.fog = new THREE.FogExp2(0x241710, .045)
  const camera = new THREE.PerspectiveCamera(54, 1, .05, 47)
  const assets = new Set()
  const stone = stoneTexture('#533a30', '#c7895529')
  const tiles = stoneTexture('#55463c', '#aa88592e', true)
  tiles.repeat.set(13, 17)
  const rugTexture = stoneTexture('#6b352b', '#e09a502e')
  rugTexture.repeat.set(2, 6)
  const matte = (color, map) => new THREE.MeshStandardMaterial({ color, map, roughness: .89 })
  const wall = matte(0xddaa8b, stone)
  const column = matte(0x9e7b62, stone)
  const dark = matte(0x34241f)
  const gold = new THREE.MeshStandardMaterial({ color: 0xc89956, metalness: .33, roughness: .55 })
  const inlay = matte(0x935943)
  const jade = matte(0x4a3a2c)
  const carpet = matte(0xdb8c6b, rugTexture)
  const bulb = new THREE.MeshBasicMaterial({ color: 0xffcf81 })
  const warmShade = new THREE.MeshBasicMaterial({ color: 0xb66636, transparent: true, opacity: .96 })
  const box = (w, h, d, x, y, z, material, parent = scene) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z)
    parent.add(mesh)
    return mesh
  }
  const disc = (top, bottom, height, x, y, z, material, parent = scene) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 56), material)
    mesh.position.set(x, y, z)
    parent.add(mesh)
    return mesh
  }
  const imageMaterial = (file, exposure = .35) => {
    const material = new THREE.MeshStandardMaterial({ roughness: .92, emissive: 0xffffff, emissiveIntensity: exposure })
    const texture = new THREE.TextureLoader().load('/images/' + file, () => { if (!disposed) schedule() })
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
    material.map = material.emissiveMap = texture
    assets.add(texture)
    return material
  }

  box(13, .2, 17.4, 0, -.105, 1.63, matte(0xffffff, tiles))
  box(13, .22, 17.4, 0, 5.92, 1.63, wall)
  box(.32, 6, 17.4, -6.28, 3, 1.63, wall)
  box(.32, 6, 17.4, 6.28, 3, 1.63, wall)
  box(13, 6, .35, 0, 3, -6.95, wall)
  box(13, 6, .28, 0, 3, 10.3, wall)

  // Painted canopy and repeated timber beams.
  box(5.2, .04, 5.35, 0, 5.76, -.1, imageMaterial('gallery-ceiling.webp', .19))
  for (const x of [-2.71, 2.71]) box(.12, .14, 14.2, x, 5.72, 1.4, gold)
  for (const z of [-5.9, -3.03, 2.82, 6.65, 9.3]) {
    box(12.4, .24, .23, 0, 5.61, z, dark)
    box(12.4, .025, .046, 0, 5.46, z, gold)
  }
  for (const side of [-1, 1]) {
    const x = side * 6.05
    box(.19, .28, 17.3, x, .14, 1.67, dark)
    box(.06, .027, 17.3, x - side * .11, .31, 1.67, gold)
    box(.22, .14, 17.3, x, 4.96, 1.67, jade)
    box(.23, .02, 17.3, x, 4.86, 1.67, gold)
    for (const z of [-6.27, -5.42, .94, 5.42, 9.7]) {
      box(.54, 5.7, .48, x - side * .26, 2.85, z, column)
      for (const y of [.28, .57, 4.74, 5.38]) box(.63, .073, .63, x - side * .26, y, z, y === .28 ? gold : dark)
    }
    for (const z of [1.57, 6.12, -5.69]) {
      const lx = side * 5.67
      box(.22, .68, .23, lx, 3.64, z, warmShade)
      for (const y of [3.27, 3.99]) box(.33, .09, .35, lx, y, z, dark)
      box(.233, .5, .033, lx - side * .09, 3.65, z, bulb)
      const light = new THREE.PointLight(0xffaa60, 9, 6, 2)
      light.position.set(lx - side * .48, 3.62, z)
      scene.add(light)
    }
  }

  // Central carpet and brass inlays on the stone floor.
  box(2.65, .009, 12.1, 0, .003, 2, carpet)
  for (const x of [-1.27, 1.27, -1.18, 1.18]) box(.018, .01, 12, x, .008, 2, gold)
  for (const z of [-3.95, 7.95]) box(2.5, .01, .021, 0, .008, z, gold)
  for (let i = 0; i < 13; i++) {
    const tile = box(.2, .011, .2, 0, .009, -3.5 + i * .88, inlay)
    tile.rotation.y = Math.PI / 4
  }

  function mural(side, file) {
    const group = new THREE.Group()
    group.position.set(side * 5.91, 2.6, -2.25)
    group.rotation.y = -side * Math.PI / 2
    scene.add(group)
    box(5.15, 3.45, .12, 0, 0, 0, dark, group)
    box(4.98, 3.28, .14, 0, 0, .07, gold, group)
    box(4.89, 3.19, .11, 0, 0, .125, jade, group)
    box(4.68, 2.87, .065, 0, .055, .205, imageMaterial(file, .58), group)
    box(1.39, .14, .065, 0, -1.48, .20, gold, group)
    const light = new THREE.PointLight(0xffd1a1, 16, 8, 2)
    light.position.set(side * 3.95, 4.24, -2.25)
    scene.add(light)
  }
  mural(-1, 'gallery-flight.webp')
  mural(1, 'gallery-scroll.webp')

  const niche = new THREE.Group()
  niche.position.set(0, 0, -6.66)
  scene.add(niche)
  box(4.43, 4.78, .18, 0, 2.54, 0, dark, niche)
  box(4.21, 4.58, .15, 0, 2.54, .13, jade, niche)
  for (const x of [-2.14, 2.14]) {
    box(.065, 4.66, .09, x, 2.54, .245, gold, niche)
    box(.27, 4.8, .34, x * 1.13, 2.4, .20, column, niche)
  }
  for (const y of [.24, 4.85]) box(4.3, .055, .09, 0, y, .245, gold, niche)
  const haloCenter = 2.94
  const haloBacking = new THREE.Mesh(new THREE.CircleGeometry(1.46, 80), matte(0x5e5d42))
  haloBacking.position.set(0, haloCenter, .246)
  niche.add(haloBacking)
  for (const radius of [1.48, 1.42, 1.3, 1.14, .91]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius === 1.48 ? .022 : .009, 6, 84), gold)
    rim.position.set(0, haloCenter, .26)
    niche.add(rim)
  }
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12
    const mark = box(.047, .095, .018, 1.36 * Math.sin(a), haloCenter + 1.36 * Math.cos(a), .282, gold, niche)
    mark.rotation.z = -a
  }

  box(3.95, .14, 2.86, 0, .072, -4.76, dark)
  box(3.74, .035, 2.63, 0, .155, -4.77, gold)
  box(3.67, .084, 2.55, 0, .215, -4.78, column)
  disc(1.05, 1.15, .22, 0, .365, -4.9, jade)
  disc(1.07, 1.07, .031, 0, .477, -4.9, gold)
  const statue = buildStatue()
  statue.position.set(0, 2.26, -4.9)
  scene.add(statue)
  const ambient = new THREE.HemisphereLight(0xffdbab, 0x546557, 1.05)
  scene.add(ambient)
  const key = new THREE.SpotLight(0xffdfb7, 64, 13, .48, .68, 1.72)
  key.position.set(-2.38, 5.37, -1.31)
  key.target.position.set(0, 1.63, -4.9)
  const rim = new THREE.PointLight(0xd5b58f, 10, 9, 2)
  rim.position.set(2.38, 3.78, -4.3)
  const front = new THREE.PointLight(0xffc694, 25, 15, 2)
  front.position.set(0, 4.76, 5.94)
  scene.add(key, key.target, rim, front)

  const markers = {
    flight: V(-5.53, 2.72, -2.25),
    statue: V(1.14, 2.3, -4.27),
    scroll: V(5.53, 2.72, -2.25),
    ceiling: V(0, 4.55, 1.2),
    space: V(0, 3.1, 4.7)
  }
  const projected = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const lookAt = new THREE.Vector3()
  let yaw = 0
  let pitch = 0
  let from = null
  let width = 0
  let height = 0
  let frame = 0
  let disposed = false
  let last = 0
  let current = 'room'
  const movement = new Set()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const limited = window.matchMedia('(max-width: 700px)')

  function schedule() {
    if (!frame && !disposed) frame = requestAnimationFrame(draw)
  }
  function orient(target) {
    camera.lookAt(target)
    camera.getWorldDirection(direction)
    yaw = Math.atan2(direction.x, -direction.z)
    pitch = Math.asin(clamp(direction.y, -1, 1))
  }
  function applyFacing() {
    const c = Math.cos(pitch)
    lookAt.copy(camera.position).add(V(Math.sin(yaw) * c, Math.sin(pitch), -Math.cos(yaw) * c))
    camera.lookAt(lookAt)
  }
  function selectView(id, instant = false) {
    const [position, target] = viewpoints[id] || viewpoints.room
    camera.getWorldDirection(direction)
    current = id
    const destination = position.clone()
    // Deliver the whole sculpture on narrow devices, even on the first tour stop.
    if (limited.matches && id === 'statue') destination.z += .52
    if (instant || reducedMotion.matches) {
      from = null
      camera.position.copy(destination)
      orient(target)
    } else {
      const targetDirection = target.clone().sub(destination).normalize()
      const targetYaw = Math.atan2(targetDirection.x, -targetDirection.z)
      from = {
        start: performance.now(), position: camera.position.clone(), destination,
        yaw, pitch, turn: Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw)),
        targetPitch: Math.asin(targetDirection.y)
      }
    }
    if (id !== 'statue' && id !== 'face' && id !== 'lotus') statue.rotation.y = 0
    schedule()
  }
  function move(stepX, stepZ) {
    from = null
    current = 'free'
    const x = camera.position.x + (Math.cos(yaw) * stepX + Math.sin(yaw) * stepZ)
    let z = camera.position.z + (Math.sin(yaw) * stepX - Math.cos(yaw) * stepZ)
    if (Math.abs(x) < 2.13 && z < -3.15 && camera.position.z >= -3.15) z = -3.15
    camera.position.x = clamp(Math.abs(x) < 2.13 && z < -3.15 ? Math.sign(camera.position.x || 1) * 2.13 : x, -5.24, 5.24)
    camera.position.z = clamp(z, -6.08, 9.45)
    camera.position.y = 2.26
    applyFacing()
    schedule()
  }
  function turn(dx, dy) {
    from = null
    current = 'free'
    yaw -= dx * .005
    pitch = clamp(pitch + dy * .005, -1.05, 1.22)
    applyFacing()
    schedule()
  }
  function draw(now) {
    frame = 0
    const step = Math.min((now - last) / 1000, .056) * 2.75
    last = now
    if (movement.size) {
      const x = Number(movement.has('d')) - Number(movement.has('a'))
      const z = Number(movement.has('w')) - Number(movement.has('s'))
      const length = Math.max(1, Math.hypot(x, z))
      move(x * step / length, z * step / length)
    } else if (from) {
      const t = clamp((now - from.start) / 870, 0, 1)
      const eased = t * t * (3 - 2 * t)
      camera.position.lerpVectors(from.position, from.destination, eased)
      yaw = from.yaw + from.turn * eased
      pitch = THREE.MathUtils.lerp(from.pitch, from.targetPitch, eased)
      applyFacing()
      if (t < 1) schedule()
      else from = null
    }
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w < 1 || h < 1) return
    if (w !== width || h !== height) {
      width = w
      height = h
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(54 / 2)) * Math.max(1, 1.04 / camera.aspect)))
      camera.updateProjectionMatrix()
    }
    renderer.render(scene, camera)
    const coordinates = {}
    if (current === 'room' || current === 'free') {
      for (const [id, point] of Object.entries(markers)) {
        projected.copy(point).project(camera)
        if (projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < .91 && Math.abs(projected.y) < .74) {
          coordinates[id] = [(projected.x + 1) * 50, (1 - projected.y) * 50]
        }
      }
    }
    onMarkers(coordinates)
  }

  const resize = new ResizeObserver(schedule)
  resize.observe(canvas)
  canvas.addEventListener('webglcontextlost', onLost)
  selectView('room', true)
  return {
    selectView, turn, move,
    spin(degrees) { statue.rotation.y = THREE.MathUtils.degToRad(degrees); schedule() },
    hold(key, down) { if (down) movement.add(key); else movement.delete(key); schedule() },
    stop() { movement.clear() },
    dispose() {
      disposed = true
      resize.disconnect()
      cancelAnimationFrame(frame)
      canvas.removeEventListener('webglcontextlost', onLost)
      const geometries = new Set(), materials = new Set()
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry)
        if (object.material) materials.add(object.material)
      })
      geometries.forEach(g => g.dispose())
      materials.forEach(material => {
        for (const property of ['map', 'emissiveMap', 'bumpMap']) {
          if (material[property]) assets.add(material[property])
        }
        material.dispose()
      })
      assets.forEach(texture => texture.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }
}
