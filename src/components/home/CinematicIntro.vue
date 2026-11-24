<script setup>
// 首页片头：四个镜头的"代码电影"
// A 夜幕鸣沙山 · 驼队  B 莫高窟崖壁 · 千佛之光  C 壁画蒙太奇 · 数字  D 飞天掠过 · 片名
import { computed, onMounted, onUnmounted, ref } from 'vue'
import apsaraImage from '../../assets/hero-apsara.png'

const emit = defineEmits(['done'])
const canvas = ref(null)
const t = ref(0)
const leaving = ref(false)
const DURATION = 15.5
const SHOTS = [0, 4.2, 8, 11.8]
const shot = computed(() => SHOTS.filter(s => t.value >= s).length - 1)
const captions = [
  { year: '公元 366 年 · 前秦建元二年', line: '沙门乐僔，西行至鸣沙山' },
  { year: '《李君莫高窟佛龛碑》', line: '忽见金光，状有千佛 · 遂架空凿岩' },
  { year: '十个朝代 · 一千年营造', line: '' },
  { year: '', line: '' }
]
const murals = [
  { src: '/images/hero-mural.webp', tag: '第 220 窟 · 初唐' },
  { src: '/images/gallery-flight.webp', tag: '飞天 · 衣带当风' },
  { src: '/images/gallery-scroll.webp', tag: '经变画 · 净土庄严' },
  { src: '/images/gallery-statue-preview.webp', tag: '彩塑 · 莲台坐像' }
]
const stats = [
  { n: 735, unit: '座', label: '洞窟' },
  { n: 45000, unit: '㎡', label: '壁画' },
  { n: 2415, unit: '身', label: '彩塑' },
  { n: 1000, unit: '年', label: '营造' }
]
const ease = x => x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2
const clamp = x => Math.max(0, Math.min(1, x))
const local = s => t.value - SHOTS[s]
const count = n => Math.round(n * ease(clamp((local(2) - 1.2) / 1.8))).toLocaleString()
const flight = computed(() => {
  const p = ease(clamp(local(3) / 2.6))
  return { x: -30 + p * 82, y: 46 - p * 8 + Math.sin(local(3) * 2) * 2, r: -14 + p * 10 }
})

let raf, start, ctx, w = 0, h = 0
let stars = [], caves = [], dust = [], ribbon = []
function size() {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  w = innerWidth; h = innerHeight
  canvas.value.width = w * dpr; canvas.value.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  stars = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random() * .62, r: Math.random() * 1.3 + .2, k: Math.random() * 6 }))
  dust = Array.from({ length: 500 }, () => ({ x: Math.random() * w, y: Math.random() * h, v: Math.random() * .6 + .2, s: Math.random() * 1.8 + .4 }))
  caves = []
  const rows = 6, cols = Math.ceil(w / 70)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (Math.random() < .28) continue
    const x = (c + .5 + (Math.random() - .5) * .5) / cols, y = .3 + r * .095 + (Math.random() - .5) * .02
    caves.push({ x, y, s: .6 + Math.random() * .7, d: Math.hypot(x - .5, (y - .55) * 1.6) })
  }
}
const dune = (x, base, amp, f, off) => h * base + Math.sin(x * f + off) * amp + Math.sin(x * f * 2.3 + off * 1.7) * amp * .35

function camel(x, y, s, phase) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#0a0605'
  ctx.beginPath()
  ctx.ellipse(0, -30, 24, 11, 0, 0, Math.PI * 2)
  ctx.ellipse(-6, -42, 9, 10, 0, 0, Math.PI * 2)
  ctx.ellipse(10, -41, 8, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineCap = 'round'; ctx.strokeStyle = '#0a0605'
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(20, -32); ctx.quadraticCurveTo(34, -40, 33, -58); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(38, -58, 8, 4, .2, 0, Math.PI * 2); ctx.fill()
  ctx.lineWidth = 3.5
  ;[[-16, 0], [-10, Math.PI], [12, Math.PI], [18, 0]].forEach(([lx, ph]) => {
    const swing = Math.sin(phase + ph) * 6
    ctx.beginPath(); ctx.moveTo(lx, -24); ctx.lineTo(lx + swing, 0); ctx.stroke()
  })
  ctx.restore()
}

function shotDesert(lt, alpha) {
  ctx.globalAlpha = alpha
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#03040b'); sky.addColorStop(.4, '#141029'); sky.addColorStop(.62, '#3a1f35'); sky.addColorStop(.78, '#8a3a24'); sky.addColorStop(1, '#2a160e')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
  // 银河淡光带
  ctx.save(); ctx.translate(w * .4, h * .3); ctx.rotate(-.35)
  const milky = ctx.createLinearGradient(0, -h * .12, 0, h * .12)
  milky.addColorStop(0, '#ffe9c200'); milky.addColorStop(.5, '#ffe9c21c'); milky.addColorStop(1, '#ffe9c200')
  ctx.fillStyle = milky; ctx.fillRect(-w, -h * .12, w * 2, h * .24); ctx.restore()
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,240,215,${.35 + Math.sin(lt * 2 + s.k) * .3})`
    ctx.fillRect(s.x * w, s.y * h, s.r, s.r)
  }
  // 月亮
  const mx = w * .76, my = h * (.24 - lt * .006)
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, h * .25)
  halo.addColorStop(0, '#ffe9c266'); halo.addColorStop(.35, '#ffe9c218'); halo.addColorStop(1, '#ffe9c200')
  ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h)
  const disc = ctx.createRadialGradient(mx - h * .012, my - h * .012, 0, mx, my, h * .045)
  disc.addColorStop(0, '#fffaf0'); disc.addColorStop(.7, '#fbedd0'); disc.addColorStop(1, '#e9cfa0')
  ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(mx, my, h * .045, 0, Math.PI * 2); ctx.fill()
  // 月面暗斑
  ctx.fillStyle = '#d8b98a30'
  ;[[-.012, -.008, .009], [.014, .01, .006], [-.004, .018, .005]].forEach(([dx, dy, r]) => {
    ctx.beginPath(); ctx.arc(mx + dx * h, my + dy * h, r * h, 0, Math.PI * 2); ctx.fill()
  })
  // 三层沙丘视差
  const layers = [[.66, 26, .004, '#4a2a22', 8], [.74, 34, .003, '#2c1812', 18], [.86, 30, .0025, '#160c08', 34]]
  layers.forEach(([base, amp, f, color, speed], i) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h)
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, dune(x + lt * speed, base, amp, f, i * 2))
    ctx.lineTo(w, h); ctx.fill()
    // 沙丘受月光的脊线高光
    ctx.strokeStyle = `rgba(255,214,160,${.18 - i * .05})`; ctx.lineWidth = 1.5; ctx.beginPath()
    for (let x = 0; x <= w; x += 8) { const y = dune(x + lt * speed, base, amp, f, i * 2); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
    ctx.stroke()
    if (i === 1) {
      for (let c = 0; c < 5; c++) {
        const cx = w * .1 + lt * 38 + c * 70
        camel(cx, dune(cx + lt * speed, base, amp, f, i * 2) + 2, 1.25, lt * 5 + c)
      }
    }
  })
  // 飘动的沙尘
  ctx.fillStyle = 'rgba(255,220,170,.35)'
  for (const d of dust) {
    const x = (d.x + lt * d.v * 60) % w, y = h * .55 + ((d.y / h) * h * .4)
    ctx.fillRect(x, y, d.s * .6, d.s * .6)
  }
  ctx.globalAlpha = 1
}

function shotCliff(lt, alpha) {
  ctx.globalAlpha = alpha
  const zoom = 1 + lt * .035
  ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.translate(-w / 2, -h / 2)
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#120a10'); g.addColorStop(.3, '#4a2a1c'); g.addColorStop(1, '#7a4a2c')
  ctx.fillStyle = '#0b0708'; ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, h * .26)
  for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h * .24 + Math.sin(x * .02) * 8 + Math.sin(x * .007) * 14)
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill()
  // 崖壁中央的金光，随洞窟点亮而增强
  const sun = ctx.createRadialGradient(w / 2, h * .42, 0, w / 2, h * .42, h * .6)
  sun.addColorStop(0, `rgba(255,205,120,${.32 * clamp(lt / 2)})`); sun.addColorStop(1, 'rgba(255,205,120,0)')
  ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h)
  // 岩层纹理
  ctx.strokeStyle = '#00000030'; ctx.lineWidth = 1
  for (let y = .3; y < 1; y += .045) { ctx.beginPath(); for (let x = 0; x <= w; x += 30) ctx.lineTo(x, h * y + Math.sin(x * .013 + y * 40) * 4); ctx.stroke() }
  // 洞窟逐一点亮：自中心向外扩散
  const wave = lt * .32
  for (const c of caves) {
    const on = clamp((wave - c.d) * 5)
    const x = c.x * w, y = c.y * h, cw = 22 * c.s, ch = 30 * c.s
    if (on > 0) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, cw * 3)
      glow.addColorStop(0, `rgba(255,200,110,${.45 * on})`); glow.addColorStop(1, 'rgba(255,180,90,0)')
      ctx.fillStyle = glow; ctx.fillRect(x - cw * 3, y - cw * 3, cw * 6, cw * 6)
    }
    ctx.fillStyle = on > 0 ? `rgb(${30 + 225 * on},${18 + 172 * on},${10 + 90 * on})` : '#140b07'
    ctx.beginPath(); ctx.moveTo(x - cw / 2, y + ch / 2); ctx.lineTo(x - cw / 2, y - ch / 4)
    ctx.quadraticCurveTo(x, y - ch * .8, x + cw / 2, y - ch / 4); ctx.lineTo(x + cw / 2, y + ch / 2); ctx.fill()
  }
  pagoda(w / 2, h * .98, Math.min(w, h) * .0042)
  ctx.restore()
  ctx.globalAlpha = 1
}

// 九层楼剪影（莫高窟第 96 窟窟檐）
function pagoda(x, base, s) {
  let y = base
  for (let i = 0; i < 9; i++) {
    const bw = (120 - i * 9) * s, bh = (i === 8 ? 26 : 22) * s
    ctx.fillStyle = '#1a0e09'; ctx.fillRect(x - bw / 2, y - bh, bw, bh)
    ctx.fillStyle = '#ffcf7a'
    for (let k = -2; k <= 2; k++) ctx.fillRect(x + k * bw / 6 - 2 * s, y - bh * .75, 4 * s, bh * .5)
    // 飞檐
    ctx.fillStyle = '#0d0705'; ctx.beginPath()
    ctx.moveTo(x - bw / 2 - 18 * s, y - bh + 2 * s); ctx.quadraticCurveTo(x, y - bh - 12 * s, x + bw / 2 + 18 * s, y - bh + 2 * s)
    ctx.lineTo(x + bw / 2, y - bh - 4 * s); ctx.lineTo(x - bw / 2, y - bh - 4 * s); ctx.fill()
    y -= bh + 6 * s
  }
  ctx.fillRect(x - 2 * s, y - 24 * s, 4 * s, 26 * s)
}

function drawDust(color, speed = 1) {
  for (const p of dust) {
    p.y -= p.v * speed; p.x += Math.sin(p.y * .01) * .3
    if (p.y < 0) { p.y = h; p.x = Math.random() * w }
    ctx.fillStyle = color; ctx.fillRect(p.x, p.y, p.s, p.s)
  }
}

function shotFlight(lt) {
  const f = flight.value
  const ax = f.x / 100 * w + Math.min(w * .17, h * .3), ay = f.y / 100 * h
  if (lt < 3) for (let i = 0; i < 10; i++) ribbon.push({ x: ax - 40 + Math.random() * 30, y: ay + (Math.random() - .5) * 70, vx: -1 - Math.random() * 2.5, vy: (Math.random() - .5) * 1, life: 1, s: Math.random() * 2.8 + .8 })
  // 飞天身后的金色光晕
  const aura = ctx.createRadialGradient(ax, ay, 0, ax, ay, 90)
  aura.addColorStop(0, 'rgba(255,210,140,.28)'); aura.addColorStop(1, 'rgba(255,210,140,0)')
  ctx.fillStyle = aura; ctx.fillRect(ax - 90, ay - 90, 180, 180)
  ctx.globalCompositeOperation = 'lighter'
  ribbon = ribbon.filter(p => (p.life -= .012) > 0)
  for (const p of ribbon) {
    p.x += p.vx; p.y += p.vy + Math.sin(p.x * .02) * .4
    ctx.fillStyle = `rgba(255,${190 + p.life * 50},${110 + p.life * 80},${p.life * .8})`
    ctx.fillRect(p.x, p.y, p.s, p.s)
  }
  ctx.globalCompositeOperation = 'source-over'
}

function draw(now) {
  start ??= now
  t.value = (now - start) / 1000
  const T = t.value
  ctx.clearRect(0, 0, w, h)
  if (T < SHOTS[1] + .9) shotDesert(T, 1 - clamp((T - SHOTS[1]) / .9))
  if (T > SHOTS[1] && T < SHOTS[2] + .6) shotCliff(local(1), clamp((T - SHOTS[1]) / .9) * (1 - clamp((T - SHOTS[2]) / .6)))
  if (T < SHOTS[3]) drawDust('rgba(255,215,150,.35)', .5)
  if (T >= SHOTS[3]) { shotFlight(local(3)); drawDust('rgba(255,225,170,.5)', 1.4) }
  if (T > DURATION - .9) {
    ctx.fillStyle = `rgba(255,242,220,${clamp((T - DURATION + .9) / .6)})`
    ctx.fillRect(0, 0, w, h)
  }
  if (T >= DURATION) return finish()
  raf = requestAnimationFrame(draw)
}
function finish() {
  if (leaving.value) return
  leaving.value = true
  cancelAnimationFrame(raf)
  sessionStorage.setItem('dh-intro-seen', '1')
  setTimeout(() => emit('done'), 900)
}
function onKey(e) { if (['Escape', 'Enter', ' '].includes(e.key)) finish() }
onMounted(() => {
  ctx = canvas.value.getContext('2d')
  size()
  addEventListener('resize', size)
  addEventListener('keydown', onKey)
  raf = requestAnimationFrame(draw)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  removeEventListener('resize', size)
  removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="cine-intro" :class="['shot-' + shot, { leaving }]" role="presentation">
    <!-- C 壁画蒙太奇 -->
    <div v-show="shot === 2" class="cine-montage">
      <figure v-for="(m, i) in murals" :key="m.src" :style="{ '--i': i }">
        <img :src="m.src" alt="">
        <figcaption>{{ m.tag }}</figcaption>
      </figure>
      <div class="cine-stats">
        <div v-for="(s, i) in stats" :key="s.label" :style="{ '--i': i }">
          <b>{{ count(s.n) }}<small>{{ s.unit }}</small></b><span>{{ s.label }}</span>
        </div>
      </div>
    </div>
    <!-- D 飞天掠过 · 片名 -->
    <div v-show="shot === 3" class="cine-flight">
      <img class="cine-mural-bg" src="/images/hero-mural.webp" alt="">
      <img class="cine-cloud" src="/images/hero-cloud.webp" alt="">
      <img class="cine-apsara" :src="apsaraImage" alt=""
        :style="{ left: flight.x + '%', top: flight.y + '%', transform: `translateY(-50%) rotate(${flight.r}deg)` }">
      <div class="cine-title">
        <h2><i v-for="(c, i) in '寻梦敦煌'" :key="i" :style="{ '--i': i }">{{ c }}</i></h2>
        <p>一 眼 千 年 · DUNHUANG</p>
      </div>
    </div>
    <canvas ref="canvas"></canvas>
    <div class="cine-grain"></div>
    <div class="cine-bar top"></div>
    <div class="cine-bar bottom"></div>
    <div class="cine-cards">
      <div v-for="(c, i) in captions" v-show="c.line || c.year" :key="i" class="cine-card" :class="{ on: shot === i }">
        <small>{{ c.year }}</small>
        <p><i v-for="(ch, j) in c.line" :key="j" :style="{ '--j': j }">{{ ch }}</i></p>
      </div>
    </div>
    <div class="cine-meta"><span>●</span> SCENE {{ String(shot + 1).padStart(2, '0') }} / 04 · MOGAO GROTTOES</div>
    <div class="cine-tc">{{ String(Math.floor(t)).padStart(2, '0') }}:{{ String(Math.floor(t % 1 * 24)).padStart(2, '0') }}</div>
    <div class="cine-timecode"><b :style="{ transform: `scaleX(${Math.min(1, t / DURATION)})` }"></b></div>
    <button class="cine-skip" type="button" @click="finish">跳过片头 ›</button>
  </div>
</template>

<style>
.cine-intro { position:fixed; inset:0; z-index:100; background:#0b0708; overflow:hidden; transition:opacity .9s ease, filter .9s ease }
.cine-intro.leaving { opacity:0; filter:blur(10px) brightness(1.6); pointer-events:none }
.cine-intro canvas { position:absolute; inset:0; width:100%; height:100%; z-index:2; pointer-events:none }
.cine-grain { position:absolute; inset:-50%; z-index:3; pointer-events:none; opacity:.1; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation:cine-grain .5s steps(4) infinite }
.cine-bar { position:absolute; left:0; right:0; height:10vh; background:#000; z-index:5; animation:cine-bar 1.6s cubic-bezier(.65,0,.2,1) both }
.cine-bar.top { top:0 } .cine-bar.bottom { bottom:0 }

/* 字幕 */
.cine-cards { position:absolute; left:0; right:0; bottom:calc(10vh + 46px); display:grid; z-index:6; pointer-events:none }
.cine-card { grid-area:1/1; text-align:center; color:#f6e3bf; opacity:0; transform:translateY(16px); filter:blur(8px); transition:opacity .8s, transform 1.2s cubic-bezier(.16,1,.3,1), filter .8s }
.cine-card.on { opacity:1; transform:none; filter:none }
.cine-card small { display:block; font-size:12px; letter-spacing:.5em; color:#d5a55e; margin-bottom:12px }
.cine-card p { margin:0; font-family:STKaiti,KaiTi,serif; font-size:clamp(20px,2.4vw,32px); letter-spacing:.3em; text-shadow:0 2px 20px #000,0 0 24px #f0b96a66 }
.cine-card p i { font-style:normal; display:inline-block; opacity:0 }
.cine-card.on p i { animation:cine-char .9s calc(.4s + var(--j) * .07s) cubic-bezier(.16,1,.3,1) both }

/* C 壁画蒙太奇 */
.cine-montage { position:absolute; inset:10vh 0; display:grid; grid-template-columns:1.4fr 1fr 1fr; grid-template-rows:1fr 1fr; gap:6px; padding:6px; z-index:1 }
.cine-montage figure { position:relative; margin:0; overflow:hidden; background:#1a100b; animation:cine-panel 1s calc(var(--i) * .22s) cubic-bezier(.77,0,.18,1) both }
.cine-montage figure:first-child { grid-row:span 2 }
.cine-montage figure:nth-child(4) { grid-column:span 2 }
.cine-montage img { width:100%; height:100%; object-fit:cover; animation:cine-kenburns 5s calc(var(--i) * .22s) ease-out both; filter:sepia(.25) contrast(1.08) brightness(.82) }
.cine-montage figcaption { position:absolute; left:16px; bottom:14px; font-size:12px; letter-spacing:.25em; color:#f6e3bf; padding:6px 10px; background:#0008; border-left:2px solid #d5a55e; backdrop-filter:blur(4px); animation:cine-up .8s calc(.6s + var(--i) * .22s) both }
.cine-stats { position:absolute; inset:0; display:flex; justify-content:center; align-items:center; gap:clamp(20px,5vw,80px); background:radial-gradient(ellipse at center,#0b0708d0 25%,#0b070840 70%); animation:cine-fade .8s 1s both }
.cine-stats div { text-align:center; animation:cine-up 1s calc(1.1s + var(--i) * .15s) cubic-bezier(.16,1,.3,1) both }
.cine-stats b { display:block; font:700 clamp(34px,5.5vw,84px)/1 Georgia,"Songti SC",serif; color:#ffe2a8; text-shadow:0 0 30px #e8a24f88; font-variant-numeric:tabular-nums }
.cine-stats small { font-size:.32em; margin-left:4px; color:#d5a55e }
.cine-stats span { display:block; margin-top:12px; font-size:13px; letter-spacing:.6em; color:#e2c69acc }
.cine-stats div + div { border-left:1px solid #d5a55e44; padding-left:clamp(20px,5vw,80px) }

/* D 飞天 */
.cine-flight { position:absolute; inset:0; z-index:1 }
.cine-mural-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.45; filter:sepia(.4) brightness(.6) blur(2px); animation:cine-kenburns 4s ease-out both }
.cine-cloud { position:absolute; width:90vw; left:5%; top:40%; opacity:.6; mix-blend-mode:screen; animation:cine-cloud 4s ease-out both }
.cine-apsara { position:absolute; width:min(34vw,60vh); filter:drop-shadow(0 0 40px #ffcf8a88); will-change:left,top,transform }
.cine-title { position:absolute; left:0; right:0; top:42%; text-align:center; transform:translateY(-50%) }
.cine-title h2 { margin:0; font:700 clamp(64px,10vw,170px)/1 STKaiti,KaiTi,"Songti SC",serif; letter-spacing:.12em; color:#fff3d6; text-shadow:0 0 40px #e8a24faa,0 6px 30px #000 }
.cine-title h2 i { display:inline-block; font-style:normal; animation:cine-bigchar 1.4s calc(1.3s + var(--i) * .16s) cubic-bezier(.16,1,.3,1) both }
.cine-title p { margin-top:22px; font-size:14px; letter-spacing:.8em; color:#e8c48a; animation:cine-up 1s 2.3s both }

/* HUD */
.cine-meta,.cine-tc { position:absolute; top:calc(10vh + 18px); z-index:6; font:11px/1 monospace; letter-spacing:.25em; color:#e2c69aaa }
.cine-meta { left:28px } .cine-meta span { color:#e05a3a; margin-right:8px; animation:cine-blink 1s steps(2) infinite }
.cine-tc { left:50%; transform:translateX(-50%) }
.cine-timecode { position:absolute; left:28px; right:28px; bottom:calc(10vh + 18px); height:1px; background:#ffffff1a; z-index:6 }
.cine-timecode b { display:block; height:100%; background:#d5a55e; transform-origin:left }
.cine-skip { position:absolute; right:28px; top:calc(10vh + 9px); z-index:7; background:#0006; border:1px solid #e2c69a55; color:#f6e3bf; padding:7px 16px; border-radius:99px; font-size:12px; letter-spacing:.2em; cursor:pointer; transition:background .3s }
.cine-skip:hover { background:#e2c69a33 }

@keyframes cine-bar { from { height:50vh } }
@keyframes cine-char { from { opacity:0; transform:translateY(.6em); filter:blur(6px) } to { opacity:1; transform:none; filter:none } }
@keyframes cine-bigchar { from { opacity:0; transform:scale(1.6); filter:blur(20px); letter-spacing:.5em } to { opacity:1; transform:none; filter:none } }
@keyframes cine-panel { from { clip-path:inset(0 100% 0 0) } to { clip-path:inset(0) } }
@keyframes cine-kenburns { from { transform:scale(1.25) } to { transform:scale(1.04) } }
@keyframes cine-cloud { from { transform:translateX(18%); opacity:0 } to { transform:translateX(-6%); opacity:.6 } }
@keyframes cine-up { from { opacity:0; transform:translateY(18px) } }
@keyframes cine-fade { from { opacity:0 } }
@keyframes cine-blink { 50% { opacity:0 } }
@keyframes cine-grain { 0% { transform:translate(0,0) } 25% { transform:translate(-5%,3%) } 50% { transform:translate(4%,-4%) } 75% { transform:translate(-3%,-2%) } }
@media (max-width:720px) {
  .cine-bar { height:6vh } .cine-meta,.cine-tc { top:calc(6vh + 12px) } .cine-skip { top:calc(6vh + 6px) } .cine-tc { display:none }
  .cine-montage { inset:6vh 0; grid-template-columns:1fr 1fr; grid-template-rows:repeat(3,1fr) }
  .cine-montage figure:first-child { grid-row:auto; grid-column:span 2 } .cine-montage figure:nth-child(4) { grid-column:span 2 }
  .cine-stats { flex-wrap:wrap; gap:18px 0 } .cine-stats div { width:50% } .cine-stats div + div { border:0; padding:0 }
  .cine-cards { bottom:calc(6vh + 40px) }
}
</style>
