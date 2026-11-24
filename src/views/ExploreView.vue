<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAppTab } from '../router/appNavigation'
import { pages } from '../data/pages'
import GoodsShop from '../components/shop/GoodsShop.vue'
import HistoryJourney from '../components/history/HistoryJourney.vue'
import SectionEditorial from '../components/editorial/SectionEditorial.vue'
import SectionAfterword from '../components/editorial/SectionAfterword.vue'
import { readingNotes } from '../data/sectionEditorials'
import { loadNews } from '../data/adminStore'
import '../styles/section-polish.css'
import '../styles/explore-upgrade.css'
import imageSources from '../../public/images/editorial/sources.json'
const imageSource = image => imageSources.find(item => 'editorial/' + item.file === image)
import { caves, library } from '../data/digital'
import { art, silkroad, activities, trips, guide, goods } from '../data/explore'
const route = useRoute()
const router = useRouter()
const galleryLink = computed(() => ({ path: '/digital', query: { appTab: isAppTab(route.query.appTab) ? route.query.appTab : undefined } }))
const page = computed(() => pages.find(p => p.route === route.path || p.key === route.meta.pageKey) || pages[1])
const category = ref('全部')
const days = ref('全部')
const theme = ref('全部')
const keyword = ref('')
const experienceType = ref('全部')
const experienceCategories = ['全部', '研学', '艺术', '户外']
const activityCategory = item => item.title.includes('研学') ? '研学' : item.title.includes('骑行') ? '户外' : '艺术'
const visibleActivities = computed(() => activities.filter(item => experienceType.value === '全部' || activityCategory(item) === experienceType.value))
const savedTrips = ref([])
const savedOnly = ref(false)
const savedNotice = ref('')
function toggleTrip(title) {
 savedTrips.value = savedTrips.value.includes(title) ? savedTrips.value.filter(item => item !== title) : [...savedTrips.value, title]
 try { localStorage.setItem('dunhuang-saved-trips', JSON.stringify(savedTrips.value)); savedNotice.value = '路线收藏已更新，记录保存在当前浏览器。' }
 catch { savedNotice.value = '当前浏览器无法保存，收藏仅在本次页面有效。' }
}
onMounted(() => {
 try { const data = JSON.parse(localStorage.getItem('dunhuang-saved-trips') || '[]'); if (Array.isArray(data)) savedTrips.value = data.filter(title => trips.some(trip => trip.title === title)) } catch { /* A fresh list is usable when storage is unavailable. */ }
})
let revealObserver
const vReveal = {
 mounted(element) {
  if (!('IntersectionObserver' in window)) return
  revealObserver ??= new IntersectionObserver(entries => entries.forEach(entry => {
   if (entry.isIntersecting) { entry.target.setAttribute('data-polish-revealed', ''); revealObserver.unobserve(entry.target) }
  }), { threshold:.06 })
  revealObserver.observe(element)
 },
 beforeUnmount(element) { revealObserver?.unobserve(element) }
}
onUnmounted(() => revealObserver?.disconnect())
const detail = ref(null)
const reservation = ref(null)
const booked = ref(false)
const viewer = ref(null)
const mode = ref('壁画细览')
const collectionTabs = { mural: '壁画细览', cave: '洞窟全景', library: '藏经洞陈列' }
watch(() => route.query.tab, tab => { mode.value = collectionTabs[tab] || collectionTabs.mural }, { immediate: true })
const caveKey = ref('57')
const cave = computed(() => caves.find(c => c.key === caveKey.value))
const zoom = ref(1)
const offset = ref(50)
const managedNews = ref(loadNews())
const digitalImages = [
 {title:'飞天主题',image:'his1.jpg',note:'主题示意图'},
 {title:'人物与设色',image:'wenhua.png',note:'主题示意图'},
 {title:'经变构图',image:'dunhuangxue3.jpg',note:'主题示意图'},
 {title:'第45窟',image:'editorial/cave-45.webp',note:'图片来源：数字敦煌 · 敦煌研究院'},
 {title:'第57窟',image:'editorial/cave-57.webp',note:'图片来源：数字敦煌 · 敦煌研究院'},
 {title:'第220窟',image:'editorial/cave-220.webp',note:'图片来源：数字敦煌 · 敦煌研究院'}
]
const digitalImage = ref(digitalImages[0])
const categories = computed(() => {
const key = page.value.key
const list = key === 'art' ? art : key === 'silkroad' ? silkroad : key === 'shop' ? goods : key === 'news' ? managedNews.value.filter(item => item.published !== false) : []
return ['全部', ...new Set(list.map(p => p.group || p.category))]
})
const cards = computed(() => {
const list = page.value.key === 'art' ? art : page.value.key === 'silkroad' ? silkroad : page.value.key === 'shop' ? goods : page.value.key === 'news' ? managedNews.value.filter(item => item.published !== false) : []
return list.filter(p => (category.value === '全部' || (p.group || p.category) === category.value) && (!keyword.value.trim() || JSON.stringify(p).includes(keyword.value.trim())))
})
const routes = computed(() => trips.filter(p => (days.value === '全部' || days.value === p.days) && (theme.value === '全部' || theme.value === p.theme) && (!savedOnly.value || savedTrips.value.includes(p.title))))
function closeDialog() {
 detail.value = null
 reservation.value = null
 booked.value = false
}
function dismissDialog() {
 closeDialog()
 if (typeof route.query.story === 'string') {
  const { story, ...query } = route.query
  router.replace({ query })
 }
}
let previousFocus
watch(() => !!(detail.value || reservation.value), open => {
 if (open) { previousFocus = document.activeElement; requestAnimationFrame(() => document.querySelector('.explore-dialog button, .explore-dialog input')?.focus()) }
 else previousFocus?.focus?.()
})
function handleKeys(event) {
 if (event.key === 'Escape' && (detail.value || reservation.value)) dismissDialog()
 if (event.key !== 'Tab' || !(detail.value || reservation.value)) return
 const nodes = [...document.querySelectorAll('.explore-dialog button, .explore-dialog input')].filter(el => !el.disabled)
 const first = nodes[0], last = nodes[nodes.length - 1]
 if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
 else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
onMounted(() => document.addEventListener('keydown', handleKeys))
onUnmounted(() => document.removeEventListener('keydown', handleKeys))
watch(() => route.path, () => { category.value = '全部'; days.value = '全部'; theme.value = '全部'; keyword.value = ''; experienceType.value = '全部'; savedOnly.value = false; savedNotice.value = ''; closeDialog() })
watch([() => route.path, () => route.query.saved, () => route.query.story], ([path, saved, story]) => {
 if (path === '/routes') savedOnly.value = saved === '1'
 const collection = path === '/art' ? art : path === '/silkroad' ? silkroad : []
 if (typeof story === 'string') detail.value = collection.find(item => item.title === story) || null
}, { immediate: true })
function openReservation(activity) { reservation.value = activity; booked.value = false }
function submitReservation() { booked.value = true }
function resetView() {
  zoom.value = 1
  offset.value = 50
  viewer.value?.scrollTo(0, 0)
}
watch([zoom, offset], () => {
  const canvas = viewer.value
  if (canvas) canvas.scrollLeft = (canvas.scrollWidth - canvas.clientWidth) * offset.value / 100
}, { flush: 'post' })
</script>
<template>
<main class="explore-page" :class="[{ 'polished-page': page.key !== 'history' }, 'page-' + page.key]">
 <section class="explore-banner" :style="{ backgroundImage: `linear-gradient(90deg,#2a2018ed,#2b221a80),url('/images/${page.image}')` }"><div><p>DUNHUANG / {{ page.key.toUpperCase() }}</p><h1>{{ page.title }}</h1><span>{{ page.subtitle }}</span></div></section>
 <div class="explore-body">
  <SectionEditorial v-if="page.key !== 'history'" :page-key="page.key" />
  <HistoryJourney v-if="page.key === 'history'" />

  <GoodsShop v-else-if="page.key === 'shop'" />
  <template v-else-if="['art','silkroad','news'].includes(page.key)">
   <div class="section-heading"><p>{{ page.key.toUpperCase() }} COLLECTION</p><h2>{{ page.key === 'art' ? '在形与色之间，静观艺术' : page.key === 'silkroad' ? '丝路有声，生活有味' : page.key === 'shop' ? '让敦煌灵感，走进日常' : '关注敦煌，正在发生' }}</h2><span v-if="page.key === 'art'">代表洞窟配图来自数字敦煌，其余图片用于题材展示。</span><span v-if="page.key === 'shop'">精选敦煌主题文创与款式灵感，图片供欣赏与参考。</span><span v-if="page.key === 'news'">资讯选自敦煌研究院官网，公告以原文为准。</span></div>
   <div class="explore-toolbar"><div class="explore-tabs" aria-label="内容分类"><button v-for="cat in categories" :key="cat" :class="{ active: category === cat }" :aria-pressed="category === cat" @click="category = cat">{{ cat }}</button></div><input v-model="keyword" class="explore-search" type="search" placeholder="搜索本栏内容" aria-label="搜索本栏内容"></div>
   <div class="collection-caption"><span>CURATED COLLECTION / 主题精选</span><small aria-live="polite">{{ category }} · {{ cards.length }} 项内容</small></div><div class="explore-grid" :class="{ 'news-list': page.key === 'news' }"><article v-for="(card, cardIndex) in cards" v-reveal :key="card.title || card.name" class="explore-card"><div class="explore-card-image"><span class="card-sequence" aria-hidden="true">{{ String(cardIndex + 1).padStart(2, '0') }}</span><img v-if="card.image" :src="'/images/' + card.image" :alt="card.title || card.name" loading="lazy"><div v-else class="image-placeholder"><span>{{ page.key === 'art' ? '窟' : page.key === 'shop' ? '物' : '味' }}</span><small>{{ page.key === 'art' ? '文字图鉴 · 影像待收录' : page.key === 'shop' ? '概念选品 · 图片待收录' : '丝路生活' }}</small></div></div><div class="explore-card-copy"><p class="card-category">{{ card.group || card.category }}</p><h3>{{ card.title || card.name }}</h3><p>{{ card.text || ('灵感来源：' + card.source) }}</p><small v-if="card.note">{{ card.note }}</small><a v-if="page.key === 'news'" :href="card.url" target="_blank" rel="noopener noreferrer" class="explore-link">{{ card.date ? card.date + " · 阅读原文" : "查看官方公告" }} ↗</a><button v-else class="explore-link" @click="detail = card">{{ page.key === 'shop' ? '查看商品灵感' : '展开阅读' }} ↗</button></div></article></div><p v-if="!cards.length" class="explore-empty">没有找到匹配的内容，请换一个关键词。</p>
  </template>

  <template v-else-if="page.key === 'digital'"><div class="section-heading"><p>EXPLORE WITHOUT BOUNDARIES</p><h2>馆藏资料</h2><span>放大壁画，或打开数字敦煌的洞窟全景与藏经洞陈列。<RouterLink :to="galleryLink" class="explore-link">返回 3D 展馆 ↗</RouterLink></span></div><div class="explore-tabs digital-tabs"><button v-for="name in Object.values(collectionTabs)" :key="name" :class="{ active: mode === name }" :aria-pressed="mode === name" @click="mode = name; resetView()">{{ name }}</button></div>
  <div v-if="mode === '壁画细览'" class="digital-room" v-reveal><div class="digital-canvas" ref="viewer" tabindex="0" aria-label="壁画细览，用下方滑块放大和水平移动图像"><img :src="'/images/' + digitalImage.image" :alt="digitalImage.title" :style="{ width: zoom * 100 + '%' }"></div><div class="digital-controls"><label>图像 <select v-model="digitalImage" @change="resetView"><option v-for="img in digitalImages" :key="img.image" :value="img">{{ img.title }}</option></select></label><label>放大 {{ zoom }}× <input v-model.number="zoom" type="range" min="1" max="4" step="0.1"></label><label>水平移动 <input v-model.number="offset" type="range" min="0" max="100" :disabled="zoom === 1"></label><button @click="resetView">重置视图</button></div><p class="source-note">{{ digitalImage.note }}。放大与移动用于观察图像细节，不会增加原图分辨率。<a class="explore-link" href="https://www.e-dunhuang.com/showmural/10.0001/0001/0001/0057/0001/0002/01" target="_blank" rel="noopener noreferrer">查看第57窟南壁官方高清图 ↗</a></p></div>
  <div v-else-if="mode === '洞窟全景'" class="digital-resource digital-rich" v-reveal>
    <div class="explore-tabs cave-tabs"><button v-for="c in caves" :key="c.key" :class="{ active: caveKey === c.key }" :aria-pressed="caveKey === c.key" @click="caveKey = c.key">{{ c.name }}</button></div>
    <div class="rich-hero"><figure><img :src="'/images/' + cave.image" :alt="cave.name + '洞窟实景'" loading="lazy"><figcaption>图片来源：数字敦煌 · 敦煌研究院</figcaption></figure><div><small>DIGITAL DUNHUANG · PANORAMA</small><h3>{{ cave.name }}</h3><em>{{ cave.alias }}</em><p>{{ cave.intro }}</p><a class="explore-action" :href="cave.url" target="_blank" rel="noopener noreferrer">进入{{ cave.name }}全景 ↗</a></div></div>
    <dl class="rich-facts"><div v-for="f in cave.facts" :key="f[0]"><dt>{{ f[0] }}</dt><dd>{{ f[1] }}</dd></div></dl>
    <h4 class="rich-title">看点导览</h4>
    <div class="rich-grid"><article v-for="(h, i) in cave.highlights" :key="h[0]"><span>0{{ i + 1 }}</span><h5>{{ h[0] }}</h5><p>{{ h[1] }}</p></article></div>
    <h4 class="rich-title">观看提示</h4>
    <ul class="rich-tips"><li v-for="t in cave.tips" :key="t">{{ t }}</li></ul>
    <small>全景内容由数字敦煌官方提供，页面将在新标签页打开。简介仅作导览，具体以官方资料为准。</small>
  </div>
  <div v-else-if="mode === '藏经洞陈列'" class="digital-resource digital-rich" v-reveal>
    <div class="rich-hero"><figure><img :src="'/images/' + library.image" :alt="library.title + '主题配图'" loading="lazy"><figcaption>主题配图 · 非文物实拍</figcaption></figure><div><small>DIGITAL LIBRARY CAVE</small><h3>{{ library.title }}</h3><em>{{ library.alias }}</em><p>{{ library.intro }}</p><a class="explore-action" :href="library.url" target="_blank" rel="noopener noreferrer">进入数字藏经洞 ↗</a></div></div>
    <dl class="rich-facts"><div v-for="f in library.facts" :key="f[0]"><dt>{{ f[0] }}</dt><dd>{{ f[1] }}</dd></div></dl>
    <h4 class="rich-title">时间脉络</h4>
    <ol class="rich-timeline"><li v-for="t in library.timeline" :key="t[0]"><b>{{ t[0] }}</b><span>{{ t[1] }}</span></li></ol>
    <h4 class="rich-title">文物类别</h4>
    <div class="rich-grid"><article v-for="(c, i) in library.collections" :key="c[0]"><span>0{{ i + 1 }}</span><h5>{{ c[0] }}</h5><p>{{ c[1] }}</p></article></div>
    <h4 class="rich-title">浏览建议</h4>
    <ul class="rich-tips"><li v-for="t in library.tips" :key="t">{{ t }}</li></ul>
    <small>展陈内容由敦煌研究院官方提供，页面将在新标签页打开。简介仅作导览，具体以官方资料为准。</small>
  </div>
  </template>

  <template v-else-if="page.key === 'experiences'"><div class="section-heading"><p>MAKE YOUR OWN MEMORY</p><h2>不止看见，还能亲身参与</h2><span>以下均为课程项目演示活动，价格为示例；报名仅完成本次页面内的模拟流程，不收款、不提交真实预约。</span></div><div class="experience-toolbar"><div class="explore-tabs" aria-label="体验类型"><button v-for="type in experienceCategories" :key="type" :class="{ active: experienceType === type }" :aria-pressed="experienceType === type" @click="experienceType = type">{{ type }}</button></div><span aria-live="polite">{{ visibleActivities.length }} 种方式，留下你的敦煌记忆</span></div><div class="explore-grid"><article v-for="item in visibleActivities" v-reveal :key="item.title" class="explore-card"><div class="explore-card-image"><img :src="'/images/'+item.image" :alt="item.title" loading="lazy"><span class="demo-tag">演示活动</span></div><div class="explore-card-copy"><p class="card-category">{{ activityCategory(item) }} / EXPERIENCE</p><h3>{{ item.title }}</h3><p>{{ item.text }}</p><dl class="activity-meta"><div><dt>时长</dt><dd>{{ item.duration }}</dd></div><div><dt>适合</dt><dd>{{ item.audience }}</dd></div><div><dt>示例价格</dt><dd>¥{{ item.price }} / 人</dd></div></dl><button class="explore-action" @click="openReservation(item)">体验模拟报名 ↗</button></div></article></div></template>

  <template v-else-if="page.key === 'routes'"><div class="section-heading"><p>PLAN YOUR OWN PACE</p><h2>每一程，都有自己的节奏</h2><span>用时为行程估算，根据实际开放安排与个人体力调整。</span></div><div class="route-filters"><div><span>按天数</span><div class="explore-tabs"><button v-for="value in ['全部','一日游','两日游','三日游']" :key="value" :class="{ active: days === value }" :aria-pressed="days === value" @click="days = value">{{ value }}</button></div></div><div><span>按主题</span><div class="explore-tabs"><button v-for="value in ['全部','亲子','摄影','深度文化']" :key="value" :class="{ active: theme === value }" :aria-pressed="theme === value" @click="theme = value">{{ value }}</button></div></div></div><div class="route-collection-bar"><span aria-live="polite">{{ routes.length }} 条路线 · 从兴趣出发，按节奏前行</span><button :aria-pressed="savedOnly" @click="savedOnly = !savedOnly">{{ savedOnly ? '查看全部路线' : '只看收藏' }} ({{ savedTrips.length }})</button></div><p v-if="savedNotice" class="route-save-notice" role="status">{{ savedNotice }}</p><article v-for="(trip, tripIndex) in routes" v-reveal :key="trip.title" class="route-card"><div class="route-card-heading"><em class="route-number">{{ String(tripIndex + 1).padStart(2, '0') }}</em><div><span>{{ trip.days }} / {{ trip.theme }}</span><h3>{{ trip.title }}</h3></div><button class="save-route" :aria-pressed="savedTrips.includes(trip.title)" @click="toggleTrip(trip.title)">{{ savedTrips.includes(trip.title) ? '♥ 已收藏' : '♡ 收藏路线' }}</button></div><ol><li v-for="stop in trip.plan" :key="stop[0]"><strong>{{ stop[0] }}</strong><div><h4>{{ stop[1] }}</h4><p>{{ stop[2] }} · {{ stop[3] }}</p></div></li></ol></article><p v-if="!routes.length" class="explore-empty">此组合暂无路线，试试其他天数或主题。</p></template>

  <template v-else-if="page.key === 'guide'"><div class="section-heading"><p>TRAVEL WITH PEACE OF MIND</p><h2>实用信息，出发前慢慢看</h2><span>预约规则、开放时间与交通班次以官方实时公告为准。</span></div><a class="official-guide" href="https://www.mgk.org.cn/" target="_blank" rel="noopener noreferrer"><div><small>OFFICIAL RESERVATION</small><h3>莫高窟官方预约渠道</h3><p>核对日期、票型、开放公告与退改规则。</p></div><span>↗</span></a><div class="guide-grid"><section v-for="(item,i) in guide" v-reveal :key="item.title"><span>0{{ i+1 }}</span><h3>{{ item.title }}</h3><ul><li v-for="text in item.items" :key="text">{{ text }}</li></ul></section></div></template>
  <SectionAfterword v-if="page.key !== 'history'" :key="page.key" :page-key="page.key" />
 </div>
 <div v-if="detail || reservation" class="explore-overlay" @click.self="dismissDialog"><section class="explore-dialog" role="dialog" aria-modal="true" aria-labelledby="explore-dialog-title"><button class="dialog-close" aria-label="关闭弹窗" @click="dismissDialog">×</button><template v-if="detail"><span class="card-category">{{ detail.group || detail.category }}</span><h2 id="explore-dialog-title">{{ detail.title || detail.name }}</h2><figure v-if="detail.image"><img :src="'/images/'+detail.image" :alt="detail.title || detail.name"><figcaption v-if="imageSource(detail.image)" class="image-attribution">图片来源：<a :href="imageSource(detail.image).source" target="_blank" rel="noopener noreferrer">{{ imageSource(detail.image).credit }} ↗</a></figcaption></figure><p>{{ detail.text || ('灵感来源：'+detail.source) }}</p><small v-if="detail.note">{{ detail.note }}</small><div class="detail-reading-notes"><section v-for="note in readingNotes[detail.group] || []" :key="note[0]"><h3>{{ note[0] }}</h3><p>{{ note[1] }}</p></section></div></template><template v-else><p class="card-category">DEMO / 模拟报名</p><h2 id="explore-dialog-title">{{ reservation.title }}</h2><div v-if="booked" class="booking-success" role="status"><span>✓</span><h3>模拟报名完成</h3><p>你已体验报名流程。未生成真实订单，未提交任何个人信息。</p><button class="explore-action" @click="dismissDialog">完成</button></div><form v-else @submit.prevent="submitReservation"><p>{{ reservation.duration }} · 示例价格 ¥{{ reservation.price }} / 人</p><label>体验日期<input type="date" required></label><label>人数<input type="number" required min="1" max="10" value="1"></label><p class="source-note">此表单仅演示，不收集姓名、联系方式或付款信息。</p><button class="explore-action" type="submit">确认模拟报名</button></form></template></section></div>
</main>
</template>
<style scoped src="../styles/portal.css"></style>

<style scoped>
.explore-grid.news-list {
  grid-template-columns: 1fr;
  gap: 24px;
}
.news-list .explore-card {
  flex-direction: row;
}
.news-list .explore-card-image {
  flex: 0 0 34%;
  height: auto;
  min-height: 240px;
}
.news-list .explore-card-image > img {
  position: absolute;
  inset: 0;
}
.news-list .explore-card-copy {
  min-width: 0;
  padding: 28px 34px;
}
.news-list .explore-card-copy h3 {
  margin-top: 8px;
}
@media (max-width: 550px) {
  .news-list .explore-card-image {
    flex-basis: 30%;
    min-height: 210px;
  }
  .news-list .explore-card-copy {
    padding: 16px;
  }
  .news-list .explore-card-copy h3 {
    font-size: 18px;
  }
}
</style>
