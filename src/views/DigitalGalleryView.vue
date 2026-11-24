<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { appReturnLocation } from '../router/appNavigation'
import '../styles/gallery.css'

const route = useRoute()
const appReturn = computed(() => appReturnLocation(route.query))
const exhibits = {
  flight: {
    title: '飞天壁画', category: '壁画', image: '/images/gallery-flight.webp',
    description: '沿着飞天的衣带看过去，回旋的线条把人物、云气和花叶连在一起。飞天没有翅膀，画师借衣带和身体的姿态表现飞行。',
    clue: '先沿飞天的手臂和衣带移动视线，再找画面中重复出现的云纹与花叶。',
    question: '画师用什么表现飞行感？', answer: '通过身体姿态、衣带曲线和周围云气，让静止的人物产生上升与回旋的动势。',
    link: '/digital/collection?tab=mural', action: '放大查看壁画'
  },
  statue: {
    title: '莲台坐像', category: '彩塑 · 原创三维演绎', image: '/images/gallery-statue-preview.webp',
    description: '从双眼微垂的面容，到衣褶上的细金线，再到层层展开的莲瓣。可以转动坐像，近看正面和背面的塑形。',
    clue: '拖动坐像观察正面和侧面，比较面容、衣褶与莲座的体量变化。',
    question: '转动坐像时，可以比较哪些塑形细节？', answer: '观察面部的起伏、衣褶的层次，以及莲座花瓣从正面到侧面的厚度变化。'
  },
  scroll: {
    title: '经变画', category: '壁画', image: '/images/gallery-scroll.webp',
    description: '经变画将佛经故事画成人物、宫殿和仪式场面。先找画面中央的主尊，再沿两侧看人物如何分组、排列。',
    clue: '从中央主尊开始，沿左右两侧寻找成组的人物，再观察建筑和水池如何组织空间。',
    question: '读经变画时，先从哪里开始？', answer: '可以先找画面中心的主尊，再观察两侧人物、建筑和水池之间的布局关系。',
    link: '/digital/collection?tab=cave', action: '查看洞窟资料'
  },
  ceiling: {
    title: '藻井与窟顶', category: '建筑 · 顶部装饰', image: '/images/gallery-ceiling.webp',
    description: '抬头观察方形窟顶的层层边框。展厅中的顶部纹样为数字空间演绎，可从中心向外辨认形状、色带与重复节奏。',
    clue: '点击视角按钮抬头，沿中心向外看几何边框如何一层层展开。',
    question: '重复的边框纹样带来什么视觉效果？', answer: '层层递进的边框把视线引向中心，也让平面的装饰获得秩序与空间感。'
  },
  space: {
    title: '洞窟空间', category: '建筑 · 空间漫游', image: '/images/gallery-room.webp',
    description: '沿着中心通道向前，再转身回看入口。观察壁面、顶部和中心造像在同一空间中的位置关系。',
    clue: '用方向键或屏幕方向按钮前进，再转向两侧和身后观察展厅结构。',
    question: '漫游时，怎样理解洞窟中的空间关系？', answer: '将壁面、窟顶、中心造像和入口放在一起观察，留意视线与行走路径如何连接它们。'
  }
}
const exhibitIds = Object.keys(exhibits)
const visitStorageKey = 'dunhuang-gallery-visits-v1'
const canvas = ref(null)
const stage = ref(null)
const ready = ref(false)
const failed = ref(false)
const focused = ref(false)
const markers = shallowRef({})
const selected = ref('')
const view = ref('room')
const angle = ref(0)
const visited = ref(readVisits())
const revealedAnswer = ref(false)
const exhibit = computed(() => exhibits[selected.value])
const activeIndex = computed(() => Math.max(0, exhibitIds.indexOf(selected.value)))
const visitPercent = computed(() => Math.round(visited.value.size / exhibitIds.length * 100))
const walkKeys = { w: 'w', a: 'a', s: 's', d: 'd', ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd' }
const steps = { w: [0, 1], a: [-1, 0], s: [0, -1], d: [1, 0] }
const statueViews = [['statue', '全身'], ['face', '面容'], ['lotus', '莲座']]
let scene
let pointer
let destroyed = false
const touchLayout = window.matchMedia('(max-width: 700px)')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

function archiveLocation(path) {
  const [pathname, params] = path.split('?')
  return { path: pathname, query: { ...Object.fromEntries(new URLSearchParams(params)), appTab: appReturn.value ? route.query.appTab : undefined } }
}

function select(id, revealStage = false) {
  revealedAnswer.value = false
  selected.value = id
  visited.value = new Set([...visited.value, id])
  saveVisits()
  setView(id)
  if (revealStage && touchLayout.matches) {
    nextTick(() => {
      const bounds = stage.value?.getBoundingClientRect()
      if (bounds && (bounds.top < 0 || bounds.bottom > window.innerHeight)) {
        stage.value.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'instant' : 'smooth' })
      }
    })
  }
}

function readVisits() {
  try {
    const saved = JSON.parse(localStorage.getItem(visitStorageKey) || '[]')
    return new Set(Array.isArray(saved) ? saved.filter(id => Object.hasOwn(exhibits, id)) : [])
  } catch {
    return new Set()
  }
}

function saveVisits() {
  try { localStorage.setItem(visitStorageKey, JSON.stringify([...visited.value])) }
  catch { /* The exhibition remains usable when browser storage is unavailable. */ }
}

function moveExhibit(delta) {
  const next = (activeIndex.value + delta + exhibitIds.length) % exhibitIds.length
  select(exhibitIds[next], true)
}

function setView(id) {
  scene?.stop()
  view.value = id
  angle.value = 0
  scene?.spin(0)
  scene?.selectView(id)
}

function reset() {
  selected.value = ''
  revealedAnswer.value = false
  setView('room')
}

function spin(value) {
  angle.value = (value + 3600) % 360
  scene?.spin(angle.value)
}

function keyDown(event) {
  if (event.key === 'Escape') {
    reset()
    return
  }
  const key = walkKeys[event.key.length === 1 ? event.key.toLowerCase() : event.key]
  if (!key || !scene || event.altKey || event.metaKey || event.ctrlKey) return
  event.preventDefault()
  scene.hold(key, true)
  view.value = 'free'
}
function keyUp(event) {
  const key = walkKeys[event.key.length === 1 ? event.key.toLowerCase() : event.key]
  if (key) scene?.hold(key, false)
}

function startDrag(event) {
  if (!scene || pointer || event.button !== 0) return
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
  event.currentTarget.setPointerCapture(event.pointerId)
}
function drag(event) {
  if (pointer?.id !== event.pointerId) return
  const dx = event.clientX - pointer.x
  const dy = event.clientY - pointer.y
  if (selected.value === 'statue' && view.value !== 'free') spin(Math.round(angle.value + dx * .7))
  else {
    view.value = 'free'
    scene?.turn(dx, dy)
  }
  pointer.x = event.clientX
  pointer.y = event.clientY
}
function endDrag(event) {
  if (pointer?.id === event.pointerId) pointer = null
}
function tapStep(event, key) {
  if (!scene || event.button !== 0) return
  view.value = 'free'
  event.currentTarget.setPointerCapture(event.pointerId)
  scene.move(...steps[key].map(direction => direction * .3))
  scene.hold(key, true)
}
function clickStep(event, key) {
  if (event.detail !== 0 || !scene) return
  view.value = 'free'
  scene.move(...steps[key].map(direction => direction * .45))
}
function loseScene() {
  ready.value = false
  failed.value = true
  markers.value = {}
  scene?.dispose()
  scene = null
}

onMounted(async () => {
  if (Object.hasOwn(exhibits, route.query.exhibit)) select(route.query.exhibit)
  try {
    const { createGalleryScene } = await import('../lib/galleryScene.js')
    if (destroyed) return
    scene = createGalleryScene(canvas.value, points => { markers.value = points }, loseScene)
    if (selected.value) scene.selectView(selected.value, true)
    ready.value = true
  } catch {
    failed.value = true
  }
})
onBeforeUnmount(() => {
  destroyed = true
  scene?.dispose()
})
</script>

<template>
  <main class="gallery-page">
    <header class="gallery-header">
      <RouterLink v-if="appReturn" :to="appReturn" class="gallery-brand gallery-app-return">← 返回 App</RouterLink>
      <RouterLink v-else to="/" class="gallery-brand" aria-label="返回寻梦敦煌首页">
        <img src="/images/logo.png" alt="">
        <span>寻梦敦煌</span>
      </RouterLink>
      <RouterLink class="gallery-archive" :to="archiveLocation('/digital/collection')">馆藏资料 <span aria-hidden="true">↗</span></RouterLink>
    </header>

    <section class="gallery-content" aria-labelledby="gallery-title">
      <div class="gallery-heading">
        <div>
          <p>DIGITAL DUNHUANG</p>
          <h1 id="gallery-title" class="gx-title"><i v-for="(c, i) in '敦煌 3D 展馆'" :key="i" :style="{ '--i': i }">{{ c }}</i></h1>
        </div>
        <button type="button" class="gallery-reset" @click="reset"><span aria-hidden="true">⟲</span> 回到入口</button>
      </div>

      <div class="gallery-layout" :class="{ 'has-exhibit': exhibit }">
        <div ref="stage" class="gallery-stage" :class="{ 'is-ready': ready }">
          <div class="gallery-poster" aria-hidden="true" :style="{ backgroundImage: 'url(' + (exhibit?.image || '/images/gallery-room.webp') + ')' }"></div>
          <canvas ref="canvas" :tabindex="ready ? 0 : -1" :aria-hidden="!ready" aria-label="敦煌三维展厅。拖动环顾，使用方向键或 WASD 移动。"
            @keydown="keyDown" @keyup="keyUp" @focus="focused = true" @blur="focused = false; scene?.stop()"
            @pointerdown="startDrag" @pointermove="drag" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="endDrag"></canvas>
          <div class="gx-vignette" aria-hidden="true"></div>
          <div class="gx-beam" aria-hidden="true"></div>
          <div class="gx-dust" aria-hidden="true"><i v-for="n in 34" :key="n" :style="{ left: (n * 37 % 100) + '%', '--d': -(n * .7) + 's', '--t': (9 + n % 7) + 's', '--s': (n % 3 + 1) + 'px' }"></i></div>
          <div class="gx-frame" aria-hidden="true"><b></b><b></b><b></b><b></b></div>
          <div class="gx-curtain" :class="{ open: ready || failed }" aria-hidden="true"><span>敦 煌 · 数 字 展 馆</span></div>
          <p v-if="!ready" class="gallery-status" role="status">{{ failed ? '当前设备显示静态展品图' : '正在点亮展厅…' }}</p>
          <button v-for="(point, id) in markers" :key="id" type="button" class="gallery-marker"
            :style="{ left: point[0] + '%', top: point[1] + '%' }" @click="select(id)">
            <span aria-hidden="true"></span>{{ exhibits[id].title }}
          </button>

          <div v-if="selected === 'statue' && ready" class="gallery-details gallery-touch-details" aria-label="彩塑细节">
            <button v-for="[id, label] in statueViews" :key="id" type="button" :aria-pressed="view === id" @click="setView(id)">{{ label }}</button>
          </div>
          <div v-if="ready" class="gallery-tools">
            <p class="gallery-touch-hint">{{ selected === 'statue' && view !== 'free' ? '左右滑动旋转坐像' : '滑动画面环顾，点按箭头移动' }}</p>
            <p v-if="selected === 'statue' && view !== 'free'" class="gallery-key-hint">拖动坐像旋转 · 按方向键继续漫游</p>
            <p v-else class="gallery-key-hint">{{ focused ? '方向键 / WASD 移动' : '拖动环顾 · 点击画面后用方向键移动' }}</p>
            <div class="gallery-dpad" aria-label="移动方向">
              <button v-for="[key, symbol, label] in [['w','↑','向前'],['a','←','向左'],['s','↓','向后'],['d','→','向右']]" :key="key" type="button"
                :class="'key-' + key" :aria-label="label" @pointerdown.prevent="tapStep($event, key)"
                @pointerup="scene?.hold(key, false)" @pointercancel="scene?.hold(key, false)" @lostpointercapture="scene?.hold(key, false)" @click="clickStep($event, key)">{{ symbol }}</button>
            </div>
          </div>
        </div>

        <aside v-if="exhibit" class="gallery-plaque" :key="selected" :aria-label="exhibit.title + '展签'">
          <div class="gallery-plaque-top"><span>{{ String(activeIndex + 1).padStart(2, '0') }} / 05 · {{ exhibit.category }}</span><button type="button" aria-label="关闭展签" @click="reset">×</button></div>
          <h2>{{ exhibit.title }}</h2>
          <div v-if="selected === 'statue' && ready" class="gallery-statue-controls">
            <div class="gallery-details" aria-label="彩塑细节">
              <button v-for="[id, label] in statueViews" :key="id" type="button" :aria-pressed="view === id" @click="setView(id)">{{ label }}</button>
            </div>
            <label for="sculpture-angle">旋转坐像 <output>{{ angle }}°</output></label>
            <input id="sculpture-angle" :value="angle" type="range" min="0" max="359" @input="spin(Number($event.target.value))">
          </div>
          <p>{{ exhibit.description }}</p>
          <div class="gallery-clue"><span>观察线索</span><p>{{ exhibit.clue }}</p></div>
          <section class="gallery-question" :class="{ answered: revealedAnswer }">
            <h3>{{ exhibit.question }}</h3>
            <button type="button" :aria-expanded="revealedAnswer" @click="revealedAnswer = !revealedAnswer">{{ revealedAnswer ? '收起解读' : '查看解读' }} <span aria-hidden="true">{{ revealedAnswer ? '−' : '+' }}</span></button>
            <p v-if="revealedAnswer" class="gallery-answer">{{ exhibit.answer }}</p>
          </section>
          <RouterLink v-if="exhibit.link" class="gallery-read-more" :to="archiveLocation(exhibit.link)">{{ exhibit.action }} ↗</RouterLink>
          <div class="gallery-exhibit-nav"><button type="button" aria-label="上一件展品" @click="moveExhibit(-1)">← 上一处</button><button type="button" aria-label="下一件展品" @click="moveExhibit(1)">下一处 →</button></div>
        </aside>
      </div>

      <div class="gallery-visit-progress"><div><span>YOUR DIGITAL JOURNEY</span><p>{{ visited.size === exhibitIds.length ? '五处展品均已探索，继续发现敦煌的细节。' : '沿着展品线索漫游，逐步点亮这座数字展厅。' }}</p></div><div class="gallery-progress-track" role="progressbar" aria-label="展品观看进度" :aria-valuenow="visited.size" :aria-valuemin="0" :aria-valuemax="exhibitIds.length"><i :style="{ width: `${visitPercent}%` }"></i></div><small>已探索 {{ visited.size }} / {{ exhibitIds.length }}</small></div>
      <div class="gallery-tour" role="group" aria-label="选择展品">
        <button v-for="(item, id) in exhibits" :key="id" type="button" :aria-pressed="selected === id" @click="select(id, true)">
          <img :src="item.image" alt="" decoding="async">
          <span>{{ item.title }}<small>{{ visited.has(id) ? '已探索' : item.category }}</small></span><b aria-hidden="true">{{ visited.has(id) ? '✓' : '↗' }}</b>
        </button>
      </div>
      <div class="gallery-archive-prompt"><div><span>继续在线上展厅之外探索</span><p>放大壁画细节，或打开莫高窟官方洞窟全景和藏经洞陈列。</p></div><RouterLink :to="archiveLocation('/digital/collection?tab=mural')">进入馆藏资料 ↗</RouterLink></div>
      <p class="gallery-note">展厅以敦煌艺术为灵感搭建。<RouterLink :to="archiveLocation('/digital/collection?tab=cave')">查看莫高窟官方全景入口 ↗</RouterLink></p>
    </section>
  </main>
</template>

<style scoped>
.gallery-visit-progress{display:flex;align-items:center;gap:24px;margin:27px 0 17px;color:#b6a081}.gallery-visit-progress>div:first-child{flex:1}.gallery-visit-progress span{font:9px Georgia,serif;letter-spacing:2px;color:#b79560}.gallery-visit-progress p{font:16px/1.8 STKaiti,KaiTi,serif;margin-top:6px;color:#dfcda9}.gallery-progress-track{width:150px;height:2px;background:#8e74432e}.gallery-progress-track i{display:block;height:100%;background:#d9b57a;transition:width .7s}.gallery-visit-progress>small{font:11px sans-serif;white-space:nowrap}.gallery-heading{animation:gallery-polish-in .8s ease both}.gallery-tour{grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-top:14px}.gallery-tour>button{position:relative;min-height:74px;transition:background .3s,border-color .3s,translate .3s,box-shadow .3s}.gallery-tour>button:hover{translate:0 -3px;box-shadow:0 10px 25px #0002}.gallery-tour>button[aria-pressed=true]{border-color:#e7b878;background:#44301f}.gallery-tour img{width:58px;height:48px}.gallery-tour b{font-size:12px}.gallery-plaque{animation:gallery-polish-in .45s ease both}.gallery-marker>span{animation:gallery-marker-glow 3s ease-in-out infinite}.gallery-clue{border-top:1px solid var(--gallery-line);border-bottom:1px solid var(--gallery-line);margin-top:14px;padding:12px 0}.gallery-clue>span{font-size:10px;color:#e6bc80;letter-spacing:2px}.gallery-clue p{font-size:11px;line-height:1.8;margin-top:6px}.gallery-question{padding:12px;margin-top:12px;background:#120e0bb0;border:1px solid #d9b48530}.gallery-question h3{font:14px/1.6 STKaiti,KaiTi,serif;color:#f3dfc1}.gallery-question>button{display:flex;justify-content:space-between;align-items:center;width:100%;border:0;padding:8px 0 0;margin-top:5px;background:transparent;color:#edc383;font-size:10px;text-align:left}.gallery-question>button span{font-size:16px}.gallery-answer{padding-top:9px;margin-top:8px;border-top:1px solid #d9b4852d;color:#d5c2a6!important;font-size:11px!important;animation:gallery-polish-in .3s ease both}.gallery-exhibit-nav{display:flex;justify-content:space-between;gap:10px;margin-top:15px}.gallery-exhibit-nav button{background:transparent;border:1px solid #d9b48555;padding:8px 10px;color:#edc383;font-size:10px}.gallery-exhibit-nav button:hover{background:#66452b}.gallery-archive-prompt{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:23px;padding:20px 23px;border-top:1px solid #af85534e;border-bottom:1px solid #af855534;background:linear-gradient(100deg,#34271c,#241c16)}.gallery-archive-prompt>div>span{font:17px STKaiti,KaiTi,serif;color:#ead4b0}.gallery-archive-prompt p{font-size:11px;color:#bca98f;margin-top:6px;line-height:1.7}.gallery-archive-prompt>a{flex-shrink:0;color:#f2c289!important;padding-bottom:4px;border-bottom:1px solid #af8553;font-size:11px}.gallery-tour button{transition:background .3s,border-color .3s,translate .3s,box-shadow .3s}.gallery-tour button:hover{translate:0 -3px;box-shadow:0 10px 25px #0002}.gallery-marker span{animation:gallery-marker-glow 3s ease-in-out infinite}@keyframes gallery-polish-in{from{opacity:.65;transform:translateY(15px)}to{opacity:1;transform:none}}@keyframes gallery-marker-glow{0%,100%{box-shadow:0 0 0 3px #d6b47a18}50%{box-shadow:0 0 0 8px #d6b47a26}}@media(max-width:1050px){.gallery-tour{grid-template-columns:repeat(3,minmax(0,1fr))}.gallery-plaque{max-height:75vh;overflow:auto}}@media(max-width:600px){.gallery-visit-progress{gap:12px;flex-wrap:wrap}.gallery-progress-track{width:85px}.gallery-visit-progress p{font-size:13px}.gallery-visit-progress span{font-size:8px}.gallery-tour{grid-template-columns:repeat(2,minmax(0,1fr))}.gallery-tour>button{min-height:60px}.gallery-tour img{width:43px;height:40px}.gallery-archive-prompt{align-items:flex-start;flex-direction:column;padding:17px}.gallery-archive-prompt>div>span{font-size:15px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
