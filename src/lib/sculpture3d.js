import * as THREE from 'three'

// ---- procedural weathered-paint textures (colour + bump) ----
function rand(seed) {
  let t = seed
  return () => (t = (t * 16807) % 2147483647) / 2147483647
}

function makeTextures(base, flakes, { seed = 1, hair = false } = {}) {
  const size = 512
  const r = rand(seed)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const b = document.createElement('canvas')
  b.width = b.height = size
  const h = b.getContext('2d')
  g.fillStyle = `rgb(${base})`
  g.fillRect(0, 0, size, size)
  h.fillStyle = '#888'
  h.fillRect(0, 0, size, size)
  for (let i = 0; i < 90; i++) {
    const x = r() * size, y = r() * size, rad = 12 + r() * 60
    const f = flakes[Math.floor(r() * flakes.length)]
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${f},${.25 + r() * .35})`)
    gr.addColorStop(1, `rgba(${f},0)`)
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    const hg = h.createRadialGradient(x, y, 0, x, y, rad * .7)
    hg.addColorStop(0, 'rgba(60,60,60,.35)')
    hg.addColorStop(1, 'rgba(60,60,60,0)')
    h.fillStyle = hg
    h.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let i = 0; i < 9000; i++) {
    const x = r() * size, y = r() * size, v = r() < .5 ? 0 : 255
    g.fillStyle = `rgba(${v},${v},${v},.05)`
    g.fillRect(x, y, 1 + r() * 2, 1 + r() * 2)
    const k = Math.floor(r() * 255)
    h.fillStyle = `rgba(${k},${k},${k},.35)`
    h.fillRect(x, y, 1 + r() * 2, 1 + r() * 2)
  }
  g.strokeStyle = 'rgba(40,20,10,.22)'
  g.lineWidth = 1
  for (let i = 0; i < 26; i++) {
    let x = r() * size, y = r() * size
    g.beginPath()
    g.moveTo(x, y)
    for (let k = 0; k < 7; k++) {
      x += (r() - .5) * 40
      y += (r() - .5) * 40
      g.lineTo(x, y)
    }
    g.stroke()
  }
  if (hair) {
    for (let x = 0; x < size; x += 4) {
      const v = r() < .5 ? 20 : 235
      h.fillStyle = `rgba(${v},${v},120,.5)`
      h.fillRect(x, 0, 2, size)
      g.fillStyle = `rgba(0,0,0,${r() * .25})`
      g.fillRect(x, 0, 2, size)
    }
  }
  const map = new THREE.CanvasTexture(c)
  const bump = new THREE.CanvasTexture(b)
  map.colorSpace = THREE.SRGBColorSpace
  for (const t of [map, bump]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
  }
  return { map, bump }
}

function paint(base, flakes, opts = {}) {
  const { map, bump } = makeTextures(base, flakes, opts)
  return new THREE.MeshStandardMaterial({
    map, bumpMap: bump,
    bumpScale: opts.bumpScale ?? .045,
    roughness: opts.roughness ?? .78,
    metalness: opts.metalness ?? 0
  })
}

export function buildStatue() {
  const group = new THREE.Group()
  const sphere = new THREE.SphereGeometry(1, 28, 20)
  const clay = [150, 118, 92], green = [110, 122, 92], red = [150, 54, 40], cream = [226, 204, 168]
  const M = {
    skin: paint([208, 142, 100], [clay, red, [226, 170, 120], green], { seed: 3 }),
    skinDark: paint([186, 120, 84], [clay, red], { seed: 4 }),
    vest: paint([196, 112, 96], [clay, cream, [120, 54, 46]], { seed: 5 }),
    robe: paint([168, 66, 48], [[110, 40, 30], clay, [210, 150, 100]], { seed: 6 }),
    cloth: paint([186, 164, 120], [clay, green, cream, [150, 90, 80]], { seed: 7 }),
    teal: paint([88, 112, 86], [clay, green, [60, 70, 60]], { seed: 8 }),
    stone: paint([176, 152, 120], [[120, 100, 82], cream, green], { seed: 9, roughness: .92, bumpScale: .075 }),
    petal: paint([200, 184, 150], [[110, 118, 100], [150, 70, 54], clay], { seed: 10, roughness: .88, bumpScale: .055 }),
    hair: paint([66, 74, 94], [[34, 38, 50], [100, 108, 124]], { seed: 11, hair: true, roughness: .55, bumpScale: .055 }),
    bead: new THREE.MeshStandardMaterial({ color: 0xe6d2a6, roughness: .5 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd6aa50, roughness: .47, metalness: .32 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x38241c, roughness: .6 }),
    lip: new THREE.MeshStandardMaterial({ color: 0x9a3a2e, roughness: .55 })
  }
  const add = (center, radii, mat, { roll = 0, yaw = 0, pitch = 0, geo = sphere } = {}) => {
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(...center)
    mesh.scale.set(...radii)
    mesh.rotation.set(pitch, yaw, roll, 'YZX')
    mesh.castShadow = mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }
  const mirror = (x, y, z, radii, mat, o = {}) =>
    [-1, 1].forEach(side => add([x * side, y, z], radii, mat, { ...o, roll: (o.roll || 0) * side, yaw: (o.yaw || 0) * side }))
  const curve = (points, thickness, material) => {
    const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)))
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 18, thickness, 6), material)
    group.add(mesh)
  }

  const chestZ = (x, y) => -.02 + .2 * Math.sqrt(Math.max(0, 1 - (x / .3) ** 2 - ((y + .05) / .5) ** 2)) + .01
  const necklace = (width, top, drop, count, size) => Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1) * 2 - 1, x = width * t, y = top - drop * (1 - t * t)
    add([x, y, chestZ(x, y)], [size, size, size], M.bead)
  })

  // Stone mouldings and two staggered rings of pointed lotus petals.
  const profile = [[0,-1.8],[.86,-1.8],[.91,-1.77],[.91,-1.69],[.85,-1.65],[.73,-1.64],[.71,-1.58],[.53,-1.48],[.52,-1.34],[.63,-1.27],[.83,-1.23],[.91,-1.17],[.93,-1.10],[.89,-1.06],[0,-1.06]]
  const plinth = new THREE.Mesh(new THREE.LatheGeometry(profile.map(pair => new THREE.Vector2(...pair)), 96), M.stone)
  plinth.castShadow = plinth.receiveShadow = true
  group.add(plinth)

  function lotusRow(count, bottom, radius, height, phase, material) {
    const geometry = new THREE.BufferGeometry()
    const vertices = [], indices = [], uvs = []
    for (let j = 0; j <= 12; j++) {
      const t = j / 12
      const width = Math.sin(Math.PI * t) ** .77 * .153 + .002
      for (let k = 0; k <= 10; k++) {
        const u = k / 5 - 1
        vertices.push(width * u, height * t, .19 * Math.sin(t * 2.3) + (1 - u * u) * Math.sin(Math.PI * t) * .075)
        uvs.push(k / 10, t)
        if (j < 12 && k < 10) {
          const a = j * 11 + k
          indices.push(a,a+1,a+11,a+1,a+12,a+11)
        }
      }
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    material.side = THREE.DoubleSide
    for (let i = 0; i < count; i++) {
      const angle = phase + i * Math.PI * 2 / count
      const petal = new THREE.Mesh(geometry, material)
      petal.position.set(radius * Math.sin(angle), bottom, radius * Math.cos(angle))
      petal.rotation.y = angle
      group.add(petal)
    }
  }
  lotusRow(19, -1.64, .60, .34, 0, M.teal)
  lotusRow(19, -1.47, .64, .38, Math.PI / 19, M.petal)
  for (const [y, radius] of [[-1.76,.908],[-1.67,.859],[-1.125,.916],[-1.078,.872]]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(radius,.012,8,80), M.gold)
    band.rotation.x = Math.PI / 2
    band.position.y = y
    group.add(band)
  }

  // Layered folds follow the bent knees and continue behind the figure.
  const folds = new THREE.SphereGeometry(1, 80, 42)
  const fabric = folds.attributes.position
  for (let i = 0; i < fabric.count; i++) {
    const x = fabric.getX(i), y = fabric.getY(i), z = fabric.getZ(i)
    const theta = Math.atan2(x, z)
    const wave = 1 + Math.sin(y * 17 + Math.sin(theta * 3) * 1.95) * .065 * (1 - y * y)
    fabric.setXYZ(i, x * wave, y + Math.sin(theta * 2) * (1 - y * y) * .17, z * wave)
  }
  folds.computeVertexNormals()
  add([0,-.83,.03],[.66,.253,.46], M.teal, { geo: folds })
  mirror(.36,-.844,.12,[.31,.191,.37],M.teal,{ geo:folds, yaw:.23, roll:.17 })
  add([0,-.70,.34],[.31,.105,.18],M.cloth,{ geo:folds })
  add([-.31,-.738,.37],[.166,.067,.126],M.skinDark,{ roll:-.14 })
  add([0,-.477,.03],[.34,.285,.247],M.robe,{ geo:folds })
  for (let j = 0; j < 5; j++) {
    const y = -.79 - j * .035
    curve([[-.56+j*.022,y+.045,.267],[-.32,y-.017,.411],[0,y-.038,.478],[.32,y-.009,.417],[.55-j*.023,y+.049,.276]], j === 4 ? .009 : .005, j === 4 ? M.gold : M.cloth)
  }

  // torso and drapery
  add([0, -.05, -.02], [.3, .5, .2], M.skin)
  add([.27, .12, 0], [.1, .36, .17], M.vest, { roll: .08 })
  add([-.25, .14, -.02], [.06, .3, .15], M.vest, { roll: -.05 })
  add([0, .32, -.03], [.2, .05, .15], M.skin)
  mirror(.3, .3, -.02, [.12, .12, .12], M.skin)
  // arms
  add([-.4, .02, .04], [.09, .3, .1], M.skin, { roll: -.3 })
  add([-.49, -.02, .22], [.08, .22, .08], M.skin, { roll: .3 })
  add([-.49, .22, .3], [.075, .09, .06], M.skinDark)
  add([-.46, .3, .31], [.028, .06, .03], M.skinDark)
  add([.4, .04, 0], [.1, .3, .11], M.vest, { roll: .18 })
  add([.28, -.17, .22], [.085, .22, .085], M.skin, { roll: 1.15 })
  add([.12, -.2, .3], [.08, .06, .06], M.skinDark)
  for (const side of [-1, 1]) {
    curve([[side*.21,.38,.041],[side*.32,.28,.112],[side*.33,.08,.154],[side*.30,-.07,.174],[side*.23,-.22,.218],[side*.34,-.53,.273],[side*.40,-.65,.287]], .029, M.robe)
    curve([[side*.22,.38,.069],[side*.34,.27,.127],[side*.35,.08,.17],[side*.32,-.07,.187],[side*.25,-.22,.237],[side*.36,-.53,.295],[side*.419,-.65,.30]], .008, M.gold)
    curve([[side*.26,.33,-.126],[side*.24,.2,-.168],[side*.18,.07,-.206],[side*.11,-.08,-.226],[side*.04,-.4,-.235],[side*.24,-.65,-.268]], .067, M.robe)
  }
  for (let i = 0; i < 4; i++) {
    const x = -.538 + i * .029
    curve([[x,.246,.345],[x-.003,.29,.353],[x-.014,.324 - i*.007,.337]], .012, M.skin)
    const left = .08 - i * .01
    curve([[.158,-.2-i*.017,.347],[left,-.2-i*.017,.354],[left-.021,-.189-i*.017,.342]], .01, M.skin)
  }
  necklace(.187, .27, .2, 17, .016)
  necklace(.154, .15, .18, 15, .013)
  add([0, -.03, chestZ(0, -.03) + .02], [.035, .045, .03], M.gold)

  // head: egg-shaped, narrowing toward the chin
  const headGeo = new THREE.SphereGeometry(1, 72, 54)
  const pos = headGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y < 0) {
      pos.setX(i, pos.getX(i) * (1 + .32 * y))
      pos.setZ(i, pos.getZ(i) * (1 + .2 * y))
    }
  }
  headGeo.computeVertexNormals()
  add([0, .43, -.02], [.09, .12, .09], M.skin)
  add([0, .68, 0], [.2, .26, .19], M.skin, { geo: headGeo })
  mirror(.198,.66,.008,[.038,.113,.042],M.skin,{ yaw:.15,roll:.075 })
  mirror(.211,.665,.043,[.018,.055,.012],M.skinDark)
  mirror(.199,.577,.039,[.017,.023,.016],M.gold)
  for (const side of [-1, 1]) {
    const pts = points => points.map(([x,y,z]) => [side*x,y,z])
    curve(pts([[.029,.717,.189],[.059,.708,.185],[.092,.706,.169],[.124,.712,.147]]),.006,M.dark)
    curve(pts([[.039,.726,.191],[.072,.729,.181],[.107,.723,.165]]),.008,M.skin)
    curve(pts([[.031,.753,.186],[.059,.763,.181],[.091,.763,.169],[.13,.751,.145]]),.006,M.dark)
  }
  add([0,.687,.169],[.022,.062,.036],M.skin)
  add([0,.637,.191],[.033,.025,.035],M.skin)
  mirror(.02,.628,.204,[.007,.006,.01],M.skinDark)
  curve([[-.038,.585,.164],[-.015,.592,.177],[0,.588,.179],[.015,.592,.177],[.038,.585,.164]],.008,M.lip)
  curve([[-.032,.583,.165],[0,.577,.183],[.032,.583,.165]],.007,M.lip)
  add([0,.768,.181],[.011,.013,.004],M.lip)
  // Hair cap leaves the brow exposed and drops toward the nape.
  const cap = new THREE.SphereGeometry(1,64,36,0,Math.PI*2,0,Math.PI*.55)
  const capPoints = cap.attributes.position
  for (let i = 0; i < capPoints.count; i++) {
    const x = capPoints.getX(i), y = capPoints.getY(i), z = capPoints.getZ(i)
    const angle = Math.atan2(x,z)
    const relief = 1 + Math.cos(angle*34)*.017*(1-y*y)
    capPoints.setXYZ(i,x*relief,y-(1-z)*.37*(1-y),z*relief)
  }
  cap.computeVertexNormals()
  add([0,.844,-.018],[.208,.183,.198],M.hair,{ geo:cap })
  add([0,1.012,-.068],[.112,.121,.108],M.hair)
  const knotBand = new THREE.Mesh(new THREE.TorusGeometry(.086,.008,8,40),M.gold)
  knotBand.rotation.x = Math.PI/2
  knotBand.position.set(0,.991,-.068)
  group.add(knotBand)

  group.position.y = .03
  return group
}

