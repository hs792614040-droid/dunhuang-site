<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { appReturnLocation } from '../router/appNavigation'
import { loadCatalog, loadNews, loadOrders, saveCatalog, saveNews, saveOrders } from '../data/adminStore'
import '../styles/admin.css'

const route = useRoute()
const appReturn = computed(() => appReturnLocation(route.query))
const section = ref('overview')
const products = ref(loadCatalog())
const orders = ref(loadOrders().sort((a, b) => new Date(b.date) - new Date(a.date)))
const news = ref(loadNews())
const notice = ref('')
const search = ref('')
const pendingOrders = computed(() => orders.value.filter(order => (order.status || '待处理') === '待处理').length)
const visibleProducts = computed(() => products.value.filter(product => (product.name + ' ' + product.category).includes(search.value.trim())))
const sections = [['overview', '概览', 'fa-gauge-high'], ['products', '商品管理', 'fa-box-open'], ['orders', '订单管理', 'fa-receipt'], ['news', '资讯管理', 'fa-newspaper']]

function persist(action) {
  try { action(); notice.value = '更改已保存到当前浏览器。' }
  catch { notice.value = '浏览器存储不可用，更改未能保存。' }
}
function saveProducts() {
  if (products.value.some(product => !product.name.trim() || !Number.isFinite(product.price) || product.price < 0 || !Number.isInteger(product.stock) || product.stock < 0)) {
    notice.value = '请检查商品名称、售价和库存。'
    return
  }
  persist(() => saveCatalog(products.value))
}
function addProduct() {
  products.value.unshift({ id: 'local-' + Date.now(), name: '新文创商品', price: 29.9, stock: 20, category: '文创', image: 'products/bookmark.png', source: '敦煌主题灵感', note: '后台演示商品', tags: [] })
  saveProducts()
}
function removeProduct(id) { products.value = products.value.filter(product => product.id !== id); saveProducts() }
function updateOrder(order, status) { order.status = status; persist(() => saveOrders(orders.value)) }
function saveNewsItems() {
  const invalidLink = news.value.some(item => {
    try { return new URL(item.url).protocol !== 'https:' }
    catch { return true }
  })
  if (news.value.some(item => !item.title.trim() || !item.text.trim()) || invalidLink) {
    notice.value = '请填写资讯标题、摘要和有效的 HTTPS 原文链接。'
    return
  }
  persist(() => saveNews(news.value))
}
function addNews() {
  news.value.unshift({ image: 'editorial/news-conservation.webp', category: '文化新闻', title: '新资讯标题', date: new Date().toISOString().slice(0, 10), text: '请填写资讯摘要。', url: 'https://www.dha.ac.cn/', published: false })
  saveNewsItems()
}
function removeNews(index) { news.value.splice(index, 1); saveNewsItems() }
function formatMoney(cents) { return '¥' + (cents / 100).toFixed(2) }
function formatDate(value) { return new Date(value).toLocaleDateString('zh-CN') }
</script>

<template>
 <main class="admin-shell">
  <aside class="admin-sidebar">
   <RouterLink v-if="appReturn" class="admin-brand" :to="appReturn">← 返回 App</RouterLink>
   <RouterLink v-else class="admin-brand" to="/"><img src="/images/logo.png" alt=""><span>寻梦敦煌<small>运营管理</small></span></RouterLink>
   <p class="admin-nav-label">工作台</p>
   <nav aria-label="管理导航"><button v-for="item in sections" :key="item[0]" :class="{ active: section === item[0] }" @click="section = item[0]"><i :class="['fa-solid', item[2]]" aria-hidden="true"></i>{{ item[1] }}</button></nav>
   <div class="admin-side-bottom"><RouterLink to="/app"><i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i>移动端 App</RouterLink><RouterLink to="/"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>返回网站</RouterLink></div>
  </aside>
  <section class="admin-main">
   <header class="admin-topbar"><div><small>寻梦敦煌 / 管理后台</small><h1>{{ sections.find(item => item[0] === section)?.[1] }}</h1></div><div class="admin-top-meta"><span class="admin-status"><i></i>本地演示数据</span><span class="admin-avatar">管</span></div></header>
   <div v-if="notice" class="admin-notice" role="status">{{ notice }}</div>

   <section v-if="section === 'overview'" class="admin-overview">
    <div class="admin-welcome"><div><small>运营概览 / OVERVIEW</small><h2>让每一份敦煌灵感，都有迹可循。</h2><p>商品、订单与资讯管理汇总。</p></div><i class="fa-solid fa-mountain-sun" aria-hidden="true"></i></div>
    <div class="admin-metrics"><button @click="section = 'products'"><span>在售商品</span><strong>{{ products.length }}</strong><small>进入商品管理 →</small></button><button @click="section = 'orders'"><span>模拟订单</span><strong>{{ orders.length }}</strong><small>查看订单记录 →</small></button><button @click="section = 'orders'"><span>待处理订单</span><strong>{{ pendingOrders }}</strong><small>进入订单管理 →</small></button><button @click="section = 'news'"><span>资讯条目</span><strong>{{ news.length }}</strong><small>{{ news.filter(item => item.published !== false).length }} 条已发布</small></button></div>
    <div class="admin-overview-grid"><section class="admin-panel"><div class="admin-panel-heading"><div><small>RECENT ACTIVITY</small><h2>最近订单</h2></div><button @click="section = 'orders'">全部订单 →</button></div><p v-if="!orders.length" class="admin-empty">尚无模拟订单</p><div v-for="order in orders.slice(0, 5)" :key="order.id" class="admin-recent-order"><span><strong>{{ order.id }}</strong><small>{{ formatDate(order.date) }} · {{ order.items.length }} 项商品</small></span><b>{{ formatMoney(order.total) }}</b><i>{{ order.status || '待处理' }}</i></div></section><section class="admin-panel admin-quick"><div class="admin-panel-heading"><div><small>QUICK ACTIONS</small><h2>常用操作</h2></div></div><button @click="section = 'products'; addProduct()"><i class="fa-solid fa-plus"></i><span>新建商品<small>添加本地演示商品</small></span>→</button><button @click="section = 'news'; addNews()"><i class="fa-solid fa-pen-to-square"></i><span>撰写快讯<small>保存后可在网站发布</small></span>→</button><RouterLink to="/app"><i class="fa-solid fa-mobile-screen-button"></i><span>预览 App<small>检查移动端内容</small></span>↗</RouterLink></section></div>
   </section>

   <section v-else-if="section === 'products'" class="admin-panel admin-table-panel"><div class="admin-panel-heading"><div><small>CATALOG / 商品目录</small><h2>商品管理 <span>{{ products.length }}</span></h2></div><button class="admin-primary" @click="addProduct"><i class="fa-solid fa-plus" aria-hidden="true"></i> 新建商品</button></div><div class="admin-toolbar"><label><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input v-model="search" type="search" placeholder="搜索商品名称或分类"></label><span>编辑商品信息后点击保存</span></div><div class="admin-table-scroll"><table class="admin-table"><thead><tr><th>商品</th><th>分类</th><th>售价</th><th>库存</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="product in visibleProducts" :key="product.id"><td><div class="admin-product-cell"><img :src="'/images/' + product.image" :alt="product.name"><input v-model="product.name" aria-label="商品名称"></div></td><td><input v-model="product.category" aria-label="商品分类"></td><td><label class="admin-number"><span>¥</span><input v-model.number="product.price" type="number" min="0" step="0.01" aria-label="售价"></label></td><td><input v-model.number="product.stock" type="number" min="0" step="1" aria-label="库存"></td><td><span class="admin-pill" :class="product.stock ? 'available' : 'unavailable'">{{ product.stock ? '有库存' : '缺货' }}</span></td><td><button class="admin-text-button" @click="removeProduct(product.id)">删除</button></td></tr></tbody></table></div><footer class="admin-table-footer"><span>商品修改会同步到文创商城。</span><button class="admin-primary" @click="saveProducts"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> 保存商品</button></footer></section>

   <section v-else-if="section === 'orders'" class="admin-panel admin-table-panel"><div class="admin-panel-heading"><div><small>ORDERS / 模拟订单</small><h2>订单管理 <span>{{ orders.length }}</span></h2></div><button class="admin-secondary" @click="orders = loadOrders().sort((a, b) => new Date(b.date) - new Date(a.date))"><i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i> 刷新</button></div><p class="admin-inline-note">用户商城中的模拟订单会显示在这里，修改状态后用户可在“我的订单”查看。</p><div class="admin-table-scroll"><table class="admin-table"><thead><tr><th>订单号</th><th>提交时间</th><th>商品</th><th>金额</th><th>订单状态</th></tr></thead><tbody><tr v-for="order in orders" :key="order.id"><td><strong>{{ order.id }}</strong></td><td>{{ formatDate(order.date) }}</td><td><div class="admin-order-items"><span v-for="item in order.items" :key="item.name">{{ item.name }} × {{ item.quantity }}</span></div></td><td>{{ formatMoney(order.total) }}</td><td><select :value="order.status || '待处理'" aria-label="订单状态" @change="updateOrder(order, $event.target.value)"><option>待处理</option><option>已确认</option><option>已完成</option><option>已取消</option></select></td></tr></tbody></table><p v-if="!orders.length" class="admin-empty">还没有订单。商城下单后会在此显示。</p></div></section>

   <section v-else class="admin-panel admin-table-panel"><div class="admin-panel-heading"><div><small>EDITORIAL / 资讯内容</small><h2>资讯管理 <span>{{ news.length }}</span></h2></div><button class="admin-primary" @click="addNews"><i class="fa-solid fa-plus" aria-hidden="true"></i> 新建资讯</button></div><p class="admin-inline-note">发布状态会同步至敦煌快讯。</p><div class="admin-news-list"><article v-for="(item,index) in news" :key="item.title + index" class="admin-news-item"><img :src="'/images/' + item.image" :alt="item.title"><div class="admin-news-fields"><div class="admin-news-row"><input v-model="item.category" aria-label="资讯分类"><input v-model="item.date" type="date" aria-label="发布日期"><label class="admin-publish"><input v-model="item.published" type="checkbox" @change="saveNewsItems">发布</label></div><input v-model="item.title" aria-label="资讯标题" class="admin-news-title"><textarea v-model="item.text" aria-label="资讯摘要" rows="2"></textarea><div class="admin-news-row"><input v-model="item.url" type="url" aria-label="原文链接"><button class="admin-text-button" @click="removeNews(index)">删除</button></div></div></article></div><footer class="admin-table-footer"><span>图片沿用项目已有素材。资讯修改只保存在本机浏览器。</span><button class="admin-primary" @click="saveNewsItems"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> 保存资讯</button></footer></section>

   <footer class="admin-footer"><span>敦煌文化主题展示 · 运营管理演示</span><span>记录保存在当前浏览器</span></footer>
  </section>
 </main>
</template>

<style scoped>
.admin-topbar{height:auto;position:static;z-index:auto;background:transparent}
.admin-main .admin-footer{position:static;background:transparent;padding:20px 0}
</style>
