<script setup>
import { computed, onMounted, ref } from 'vue'
import { art, silkroad, news } from '../data/explore'
import { caves } from '../data/digital'
import { loadCatalog, loadNews } from '../data/adminStore'
import '../styles/app-portal.css'

// 独立移动端 App：所有内容都在本页面内打开，不跳转到桌面端网页。
const splashing = ref(true)
onMounted(() => { setTimeout(() => { splashing.value = false }, 3000) })

const tab = ref('home')
const tabs = [
  { id: 'home', label: '首页', icon: 'fa-house' },
  { id: 'discover', label: '发现', icon: 'fa-compass' },
  { id: 'exhibit', label: '展馆', icon: 'fa-landmark' },
  { id: 'mine', label: '我的', icon: 'fa-user' }
]
const filters = ['全部', '石窟艺术', '丝路风情']
const keyword = ref('')
const filter = ref('全部')
const sheet = ref(null) // { type: 'story' | 'product' | 'cave' | 'news', item }
const favorites = ref(new Set())

const stories = [
  ...art.map(item => ({ ...item, section: '石窟艺术' })),
  ...silkroad.map(item => ({ ...item, section: '丝路风情' }))
]
const filteredStories = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return stories.filter(item =>
    (filter.value === '全部' || filter.value === item.section) &&
    [item.title, item.text, item.group].some(value => String(value).toLowerCase().includes(q))
  )
})
const products = loadCatalog()
const newsList = loadNews().filter(item => item.published !== false)
const latestNews = computed(() => newsList[0])
const quickTopics = [
  { label: '飞天', icon: 'fa-wand-magic-sparkles', q: '飞天' },
  { label: '壁画', icon: 'fa-palette', q: '壁画' },
  { label: '彩塑', icon: 'fa-user-group', q: '彩塑' },
  { label: '丝路', icon: 'fa-route', q: '丝路' }
]
const heroStats = [['492', '座洞窟'], ['4.5万㎡', '壁画面积'], ['2000+', '身彩塑']]

function openSheet(type, item) { sheet.value = { type, item } }
function closeSheet() { sheet.value = null }
function toggleFav(id) {
  const next = new Set(favorites.value)
  next.has(id) ? next.delete(id) : next.add(id)
  favorites.value = next
}
function searchTopic(q) { keyword.value = q; filter.value = '全部'; tab.value = 'discover' }
function money(v) { return '¥' + Number(v).toFixed(2) }
</script>

<template>
  <div class="app-shell">
    <Transition name="splash-fade">
      <div v-if="splashing" class="app-splash" aria-hidden="true">
        <div class="splash-orb splash-orb-a"></div>
        <div class="splash-orb splash-orb-b"></div>
        <div class="splash-rays" aria-hidden="true"></div>
        <span v-for="n in 12" :key="n" class="splash-spark" :style="{ '--i': n }"></span>
        <span v-for="n in 18" :key="'d' + n" class="splash-dust" :style="{ '--x': (n * 37 % 100) + '%', '--d': (n % 5) * 0.6 + 's', '--s': (2 + n % 3) + 'px' }"></span>
        <div class="splash-ring"></div>
        <div class="splash-emblem"><img src="/images/logo.png" alt="" width="64" height="74"></div>
        <h1 class="splash-title"><span v-for="(ch, i) in '寻梦敦煌'" :key="i" :style="{ animationDelay: (0.5 + i * 0.12) + 's' }">{{ ch }}</span></h1>
        <p class="splash-sub">DUNHUANG · 千年壁画 · 丝路故事</p>
        <div class="splash-bar"><span></span></div>
      </div>
    </Transition>

    <div class="app-phone">
      <header class="app-topbar">
        <div class="app-brand">
          <img src="/images/logo.png" alt="" width="30" height="34">
          <span>寻梦敦煌<small>DUNHUANG</small></span>
        </div>
        <button class="app-icon-btn" type="button" aria-label="搜索" @click="tab = 'discover'">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </button>
      </header>

      <main class="app-content" :key="tab">
        <!-- 首页 -->
        <section v-if="tab === 'home'" class="app-page">
          <div class="app-hero">
            <img src="/images/hero-mural.webp" alt="" fetchpriority="high">
            <div class="app-hero-shade"></div>
            <div class="app-hero-copy">
              <p class="app-eyebrow">莫高窟 · 敦煌艺术</p>
              <h1>从飞天衣带<br>到莲台彩塑，走进敦煌</h1>
              <button class="app-cta" type="button" @click="tab = 'exhibit'">开始漫游 <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
            </div>
          </div>

          <div class="app-stats">
            <div v-for="stat in heroStats" :key="stat[1]"><strong>{{ stat[0] }}</strong><span>{{ stat[1] }}</span></div>
          </div>

          <div class="app-section-head"><h2>热门主题</h2></div>
          <div class="app-topics">
            <button v-for="topic in quickTopics" :key="topic.q" type="button" @click="searchTopic(topic.q)">
              <i :class="['fa-solid', topic.icon]" aria-hidden="true"></i><span>{{ topic.label }}</span>
            </button>
          </div>

          <template v-if="latestNews">
            <div class="app-section-head"><h2>敦煌快讯</h2></div>
            <button class="app-news-card" type="button" @click="openSheet('news', latestNews)">
              <img :src="'/images/' + latestNews.image" alt="" loading="lazy" decoding="async">
              <div><small>{{ latestNews.category }} · {{ latestNews.date }}</small><h3>{{ latestNews.title }}</h3></div>
            </button>
          </template>

          <div class="app-section-head"><h2>精选故事</h2><button type="button" @click="tab = 'discover'">全部 →</button></div>
          <div class="app-hscroll">
            <button v-for="item in stories.slice(0, 6)" :key="item.title" class="app-tile" type="button" @click="openSheet('story', item)">
              <img :src="'/images/' + item.image" alt="" loading="lazy" decoding="async">
              <span class="app-tile-tag">{{ item.section }}</span>
              <strong>{{ item.title }}</strong>
            </button>
          </div>

          <div class="app-section-head"><h2>文创好物</h2><span class="app-muted">{{ products.length }} 件</span></div>
          <div class="app-products">
            <button v-for="product in products.slice(0, 4)" :key="product.id" type="button" @click="openSheet('product', product)">
              <div class="app-product-img"><img :src="'/images/' + product.image" alt="" loading="lazy" decoding="async"></div>
              <span>{{ product.name }}</span><b>{{ money(product.price) }}</b>
            </button>
          </div>
        </section>
        <!-- 发现 -->
        <section v-else-if="tab === 'discover'" class="app-page">
          <h1 class="app-page-title">发现敦煌</h1>
          <div class="app-search">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input v-model="keyword" type="search" aria-label="搜索艺术与丝路故事" placeholder="搜索飞天、壁画、乐舞">
            <button v-if="keyword" type="button" aria-label="清除" @click="keyword = ''"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
          </div>
          <div class="app-chips" role="group" aria-label="内容分类">
            <button v-for="item in filters" :key="item" type="button" :class="{ on: filter === item }" @click="filter = item">{{ item }}</button>
          </div>
          <p class="app-muted app-results">{{ filteredStories.length }} 条内容</p>
          <div class="app-list">
            <button v-for="item in filteredStories" :key="item.title" class="app-row" type="button" @click="openSheet('story', item)">
              <img :src="'/images/' + item.image" alt="" loading="lazy" decoding="async">
              <div><small>{{ item.section }} · {{ item.group }}</small><h3>{{ item.title }}</h3><p>{{ item.text }}</p></div>
            </button>
          </div>
          <div v-if="!filteredStories.length" class="app-empty">
            <p>没有找到相关内容</p>
            <button type="button" @click="keyword = ''; filter = '全部'">查看全部</button>
          </div>
        </section>

        <!-- 展馆 -->
        <section v-else-if="tab === 'exhibit'" class="app-page">
          <h1 class="app-page-title">数字展馆</h1>
          <p class="app-muted">漫游洞窟，近看壁画和莲台坐像。</p>
          <div class="app-exhibit-hero">
            <img src="/images/gallery-room.webp" alt="敦煌三维展厅">
            <div class="app-hero-shade"></div>
            <span class="app-exhibit-label">沉浸式 3D 展厅</span>
          </div>
          <div class="app-section-head"><h2>官方洞窟全景</h2></div>
          <div class="app-cave-grid">
            <button v-for="cave in caves" :key="cave.key" type="button" @click="openSheet('cave', cave)">
              <img :src="'/images/' + cave.image" alt="" loading="lazy" decoding="async">
              <span>{{ cave.name }}</span><small>{{ cave.alias }}</small>
            </button>
          </div>
        </section>

        <!-- 我的 -->
        <section v-else class="app-page">
          <div class="app-profile">
            <div class="app-avatar"><i class="fa-regular fa-user" aria-hidden="true"></i></div>
            <div>
              <h1>你好，旅人</h1>
              <p class="app-muted">已收藏 {{ favorites.size }} 项内容</p>
            </div>
          </div>
          <div class="app-list-menu">
            <button type="button" @click="tab = 'discover'"><i class="fa-solid fa-heart" aria-hidden="true"></i><span>我的收藏</span><b>›</b></button>
            <button type="button" @click="tab = 'home'"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i><span>文创商城</span><b>›</b></button>
            <button type="button" @click="tab = 'exhibit'"><i class="fa-solid fa-landmark" aria-hidden="true"></i><span>数字展馆</span><b>›</b></button>
          </div>
          <p class="app-foot">寻梦敦煌 App · 演示版本</p>
        </section>
      </main>

      <!-- 详情底部面板 -->
      <Transition name="sheet-up">
        <div v-if="sheet" class="app-sheet-mask" @click.self="closeSheet">
          <div class="app-sheet" role="dialog" aria-modal="true">
            <div class="app-sheet-grip"></div>
            <button class="app-sheet-close" type="button" aria-label="关闭" @click="closeSheet"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            <img class="app-sheet-img" :src="'/images/' + (sheet.item.image || sheet.item.product?.image || 'banner.png')" alt="">
            <small class="app-muted">{{ sheet.type === 'product' ? '文创商品' : sheet.type === 'news' ? '敦煌快讯' : sheet.type === 'cave' ? '洞窟全景' : (sheet.item.section || '') }}</small>
            <h2>{{ sheet.item.title || sheet.item.name || sheet.item.category }}</h2>
            <p>{{ sheet.item.text || sheet.item.intro || '' }}</p>
            <div v-if="sheet.type === 'product'" class="app-sheet-price">{{ money(sheet.item.price) }}<span>库存 {{ sheet.item.stock }}</span></div>
            <div class="app-sheet-actions">
              <button type="button" :class="{ on: favorites.has(sheet.item.id || sheet.item.title) }" @click="toggleFav(sheet.item.id || sheet.item.title)">
                <i :class="favorites.has(sheet.item.id || sheet.item.title) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'" aria-hidden="true"></i>
                {{ favorites.has(sheet.item.id || sheet.item.title) ? '已收藏' : '收藏' }}
              </button>
              <a v-if="sheet.type === 'cave'" :href="sheet.item.url" target="_blank" rel="noopener noreferrer" class="app-sheet-primary">打开官方全景 <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
              <a v-else-if="sheet.type === 'news' && sheet.item.url" :href="sheet.item.url" target="_blank" rel="noopener noreferrer" class="app-sheet-primary">阅读原文</a>
              <button v-else type="button" class="app-sheet-primary" @click="closeSheet">知道了</button>
            </div>
          </div>
        </div>
      </Transition>

      <nav class="app-tabbar" aria-label="App 导航">
        <button v-for="item in tabs" :key="item.id" type="button" :class="{ on: tab === item.id }" :aria-current="tab === item.id ? 'page' : undefined" @click="tab = item.id">
          <i :class="['fa-solid', item.icon]" aria-hidden="true"></i><span>{{ item.label }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>


