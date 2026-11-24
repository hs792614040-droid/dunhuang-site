<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { pages } from '../data/pages'
import apsaraImage from '../assets/hero-apsara.png'
import '../styles/panorama.css'
import '../styles/home-cinematic.css'
import { createCavePanorama, panoramaFaces } from '../lib/cavePanorama'
import { createCoverAtmosphere } from '../lib/coverAtmosphere'
import CinematicIntro from '../components/home/CinematicIntro.vue'

const showIntro = ref(typeof window !== 'undefined' && !sessionStorage.getItem('dh-intro-seen') && !matchMedia('(prefers-reduced-motion: reduce)').matches)
const introKey = ref(0)
function replayIntro() { sessionStorage.removeItem('dh-intro-seen'); introKey.value++; showIntro.value = true }

const home = ref(null)
const atmosphere = ref(null)
let disposeAtmosphere
function mountAtmosphere() {
  disposeAtmosphere?.()
  disposeAtmosphere = undefined
  if (atmosphere.value) disposeAtmosphere = createCoverAtmosphere(atmosphere.value, home.value, () => motionPaused.value || !!menu.value?.open)
}
onMounted(mountAtmosphere)

const canvas = ref(null)
const menu = ref(null)
const exploring = ref(false)
watch(exploring, async () => { await nextTick(); mountAtmosphere() })
const motionPaused = ref(false)
const panoramaStarted = ref(false)
const sparks = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 % 101) + '%',
  top: (i * 61 % 103) + '%',
  '--delay': -(i * .61) + 's',
  '--duration': (6 + i % 8) + 's',
  '--size': (i % 3 + 1) + 'px'
}))
const dragging = ref(false)
const ready = ref(false)
const fallback = ref(false)
const yaw = ref(-0.12)
const pitch = ref(0.02)
const directions = [
  { label: '飞天', yaw: -0.12, pitch: 0.02, image: panoramaFaces[0] },
  { label: '乐舞', yaw: Math.PI / 2, pitch: 0, image: panoramaFaces[1] },
  { label: '彩塑', yaw: Math.PI, pitch: 0, image: panoramaFaces[3] },
  { label: '经变', yaw: -Math.PI / 2, pitch: 0, image: panoramaFaces[2] },
  { label: '窟顶', yaw: 0, pitch: 1.34, image: panoramaFaces[4] }
]
const direction = computed(() => {
  if (pitch.value > 0.82) return 4
  const quarter = Math.round(yaw.value / (Math.PI / 2))
  return ((quarter % 4) + 4) % 4
})

let renderer
let resize
let frame
let tween
let pointer
let disposed = false

function paint() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = null
    renderer?.draw(yaw.value, pitch.value)
  })
}

function moveTo(index) {
  const target = index === 0 && window.matchMedia('(max-width: 600px)').matches
    ? { yaw: -0.27, pitch: -0.15 }
    : directions[index]
  cancelAnimationFrame(tween)
  const startYaw = yaw.value
  const startPitch = pitch.value
  const delta = Math.atan2(Math.sin(target.yaw - startYaw), Math.cos(target.yaw - startYaw))
  if (!ready.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    yaw.value = target.yaw
    pitch.value = target.pitch
    paint()
    return
  }
  let start
  function animate(now) {
    start ??= now
    const progress = Math.min(1, (now - start) / 580)
    const eased = 1 - (1 - progress) ** 3
    yaw.value = startYaw + delta * eased
    pitch.value = startPitch + (target.pitch - startPitch) * eased
    paint()
    if (progress < 1) tween = requestAnimationFrame(animate)
  }
  tween = requestAnimationFrame(animate)
}

function startDrag(event) {
  if (!ready.value || pointer || event.button !== 0) return
  cancelAnimationFrame(tween)
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
  dragging.value = true
  event.currentTarget.setPointerCapture(event.pointerId)
}

function drag(event) {
  if (pointer?.id !== event.pointerId) return
  yaw.value -= (event.clientX - pointer.x) * 0.007
  pitch.value = Math.max(-1.5, Math.min(1.5, pitch.value + (event.clientY - pointer.y) * 0.007))
  pointer.x = event.clientX
  pointer.y = event.clientY
  paint()
}

function release(event) {
  if (pointer?.id !== event.pointerId) return
  pointer = null
  dragging.value = false
}

function handleKeys(event) {
  const step = 0.16
  const deltas = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
  if (!Object.hasOwn(deltas, event.key) || !ready.value) return
  event.preventDefault()
  cancelAnimationFrame(tween)
  yaw.value += deltas[event.key][0]
  pitch.value = Math.max(-1.5, Math.min(1.5, pitch.value + deltas[event.key][1]))
  paint()
}

function contextLost(event) {
  event.preventDefault()
  ready.value = false
  fallback.value = true
  renderer?.dispose()
  renderer = null
}

async function enterPanorama() {
  exploring.value = true
  moveTo(0)
  if (panoramaStarted.value) return
  panoramaStarted.value = true
  try {
    await nextTick()
    const result = await createCavePanorama(canvas.value)
    if (disposed) {
      result?.dispose()
      return
    }
    if (!result) {
      fallback.value = true
      return
    }
    renderer = result
    renderer.draw(yaw.value, pitch.value)
    ready.value = true
    if (typeof ResizeObserver !== 'undefined') {
      resize = new ResizeObserver(paint)
      resize.observe(canvas.value)
    }
    window.addEventListener('resize', paint)
  } catch {
    if (!disposed) fallback.value = true
  }
}

onUnmounted(() => {
  disposed = true
  disposeAtmosphere?.()
  resize?.disconnect()
  window.removeEventListener('resize', paint)
  cancelAnimationFrame(frame)
  cancelAnimationFrame(tween)
  renderer?.dispose()
})
</script>

<template>
  <CinematicIntro v-if="showIntro" :key="introKey" @done="showIntro = false" />
  <main ref="home" class="panorama-home" :class="{ exploring, 'motion-paused': motionPaused || showIntro, 'after-intro': !showIntro }">
    <div v-if="!exploring" class="apsara-stage" aria-hidden="true">
      <div class="apsara-mural"></div>
      <div class="apsara-grain"></div>
      <div class="celestial-light"></div>
      <div class="celestial-beam beam-one"></div>
      <div class="celestial-beam beam-two"></div>
      <div class="apsara-art">
        <svg class="celestial-mandala" viewBox="0 0 600 600" fill="none" aria-hidden="true">
          <circle cx="300" cy="300" r="282" stroke="currentColor" stroke-width=".6" />
          <circle cx="300" cy="300" r="267" stroke="currentColor" stroke-width=".5" stroke-dasharray="1 9" />
          <g class="mandala-petals"><path v-for="n in 12" :key="n" d="M300 58 Q380 176 300 242 Q220 176 300 58Z" :transform="`rotate(${n * 30} 300 300)`" stroke="currentColor" stroke-width=".7" /></g>
          <g><path v-for="n in 24" :key="n" d="M300 12 L303 25 L300 38 L297 25Z" :transform="`rotate(${n * 15} 300 300)`" fill="currentColor" /></g>
          <rect x="111" y="111" width="378" height="378" rx="70" stroke="currentColor" stroke-width=".5" transform="rotate(45 300 300)" />
        </svg>
        <div class="apsara-orbit"></div>
        <div class="apsara-halo"></div>
        <img class="apsara-cloud" src="/images/hero-cloud.webp" alt="">
        <img class="apsara-figure" :src="apsaraImage" alt="" fetchpriority="high" decoding="async">
        <div class="apsara-sparks"><i v-for="(spark, i) in sparks" :key="i" :style="spark"></i></div>
      </div>
      <canvas ref="atmosphere" class="celestial-dust"></canvas>
      <div class="apsara-corners"></div>
      <div class="celestial-vertical">衣袂乘风起 · 一梦入千年</div>
      <div class="celestial-opening"></div>
    </div>
    <div v-show="exploring" class="panorama-backdrop" :style="{ backgroundImage: 'url(' + directions[direction].image + ')' }"></div>
    <canvas
      v-show="exploring"
      ref="canvas"
      class="panorama-canvas"
      :class="{ ready, dragging }"
      :tabindex="ready ? 0 : -1"
      aria-label="敦煌洞窟全景。拖动或使用方向键转动视角。"
      @pointerdown="startDrag"
      @pointermove="drag"
      @pointerup="release"
      @pointercancel="release"
      @lostpointercapture="release"
      @keydown="handleKeys"
      @webglcontextlost="contextLost"
    ></canvas>
    <div v-show="exploring" class="panorama-shade" aria-hidden="true"></div>

    <div class="panorama-top">
      <RouterLink class="panorama-brand" to="/" aria-label="寻梦敦煌首页">
        <img src="/images/logo.png" alt="">
        <div><strong>寻梦敦煌</strong><small>DUNHUANG</small></div>
      </RouterLink>
      <div class="home-nav">
        <RouterLink v-if="!exploring" class="home-mobile-app" to="/app">移动版</RouterLink>
        <button class="panorama-menu-button" type="button" aria-haspopup="dialog" @click="menu.showModal()">
        <span class="panorama-menu-icon" aria-hidden="true"></span> 导航
        </button>
      </div>
    </div>

    <div v-if="!exploring" class="panorama-title">
      <p>敦煌 <span>·</span> 莫高窟</p>
      <h1 aria-label="寻梦敦煌，一眼千年"><span class="hero-title-line" aria-hidden="true"><i v-for="(char, i) in '寻梦敦煌'" :key="i" :style="{ '--char': i }">{{ char }}</i></span><span class="hero-title-sub" aria-hidden="true"><i v-for="(char, i) in '一眼千年'" :key="i" :style="{ '--char': i + 4 }">{{ char }}</i></span></h1>
      <div class="apsara-intro">追随飞天的衣袂，走进壁画与彩塑之间。</div>
      <div class="apsara-actions">
        <RouterLink class="panorama-enter" to="/digital">进入 3D 展馆 <span aria-hidden="true">↗</span></RouterLink>
        <button class="apsara-secondary" type="button" @click="enterPanorama">观赏洞窟全景 <span aria-hidden="true">→</span></button>
      </div>
    </div>
    <div v-if="!exploring" class="apsara-footer">
      <span><i aria-hidden="true"></i> 飞天 · 敦煌艺术演绎</span>
      <button type="button" @click="replayIntro"><span aria-hidden="true">◉</span> 重播片头</button>
      <button type="button" :aria-pressed="motionPaused" @click="motionPaused = !motionPaused">
        <span aria-hidden="true">{{ motionPaused ? '▷' : 'Ⅱ' }}</span> {{ motionPaused ? '播放动画' : '暂停动画' }}
      </button>
    </div>
    <button v-if="exploring" class="panorama-return" type="button" @click="exploring = false; moveTo(0)">← 返回封面</button>

    <div v-if="exploring" class="panorama-bottom">
      <div class="panorama-hint"><span class="panorama-compass" aria-hidden="true" :style="{ transform: 'rotate(' + yaw + 'rad)' }">✧</span>{{ fallback ? '选择视角查看壁画' : '滑动探索全景' }}</div>
      <div class="panorama-directions" aria-label="全景视角">
        <button v-for="(view, index) in directions" :key="view.label" type="button" :aria-pressed="direction === index" @click="moveTo(index)">{{ view.label }}</button>
      </div>
      <small class="panorama-credit">壁画空间艺术演绎</small>
    </div>

    <dialog ref="menu" class="panorama-menu" aria-labelledby="panorama-menu-title" @click.self="menu.close()">
      <div class="panorama-menu-content">
        <div class="panorama-menu-heading">
          <h2 id="panorama-menu-title">探索敦煌</h2>
          <button type="button" aria-label="关闭导航" autofocus @click="menu.close()">×</button>
        </div>
        <nav aria-label="主导航">
          <RouterLink v-for="page in pages" :key="page.key" :to="page.route" @click="menu.close()">
            {{ page.title }} <span aria-hidden="true">↗</span>
          </RouterLink>
          <RouterLink to="/app" @click="menu.close()">移动端 App <span aria-hidden="true">↗</span></RouterLink>
          <RouterLink to="/admin" @click="menu.close()">后台管理 <span aria-hidden="true">↗</span></RouterLink>
        </nav>
        <RouterLink class="panorama-account" to="/login" @click="menu.close()">登录 / 注册 ↗</RouterLink>
      </div>
    </dialog>
  </main>
</template>

