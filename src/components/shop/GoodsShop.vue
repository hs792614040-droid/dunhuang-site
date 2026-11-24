<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadCatalog } from '../../data/adminStore'

const route = useRoute()
const router = useRouter()
const cartKey = 'dunhuang-shop-cart-v1'
const orderKey = 'dunhuang-shop-orders-v1'
const money = value => (value / 100).toFixed(2)
const cents = product => Math.round(product.price * 100)
function read(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : [] }
  catch { return [] }
}
const catalog = ref(loadCatalog())
const cart = ref(read(cartKey).filter((row, index, rows) =>
  row && catalog.value.some(p => p.id === row.id) && Number.isInteger(row.quantity) && row.quantity > 0 && rows.findIndex(r => r?.id === row.id) === index
).map(row => ({ id: row.id, quantity: Math.min(row.quantity, catalog.value.find(p => p.id === row.id).stock), selected: row.selected !== false })).filter(row => row.quantity > 0))
const orders = ref(read(orderKey).filter(order => order && typeof order.id === 'string' && typeof order.date === 'string' && Number.isInteger(order.total) && Array.isArray(order.items) && order.items.every(row => row && typeof row.name === 'string' && typeof row.image === 'string' && Number.isInteger(row.quantity) && row.quantity > 0 && Number.isInteger(row.price))))
const storageError = ref('')
function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); storageError.value = ''; return true }
  catch { storageError.value = '浏览器存储不可用，当前更改仅在本次页面有效。'; return false }
}
watch(cart, value => persist(cartKey, value), { deep: true })
const category = ref('全部')
const keyword = ref('')
const sort = ref('default')
const categories = computed(() => ['全部', ...new Set(catalog.value.map(p => p.category))])
const products = computed(() => {
  const result = catalog.value.filter(p => (category.value === '全部' || p.category === category.value) && `${p.name}${p.source || ''}`.includes(keyword.value.trim()))
  return sort.value === 'default' ? result : result.sort((a, b) => sort.value === 'asc' ? a.price - b.price : b.price - a.price)
})
const lines = computed(() => cart.value.map(row => ({ ...row, product: catalog.value.find(p => p.id === row.id) })))
const count = computed(() => cart.value.reduce((sum, row) => sum + row.quantity, 0))
const selected = computed(() => lines.value.filter(row => row.selected))
const selectedCount = computed(() => selected.value.reduce((sum, row) => sum + row.quantity, 0))
const total = computed(() => selected.value.reduce((sum, row) => sum + cents(row.product) * row.quantity, 0))
const allSelected = computed(() => cart.value.length > 0 && cart.value.every(row => row.selected))
const panel = ref('')
const detail = ref(null)
const latestOrder = ref(null)
const notice = ref('')
let timer
function notify(message) { notice.value = message; clearTimeout(timer); timer = setTimeout(() => notice.value = '', 3000) }
function quantity(id) { return cart.value.find(row => row.id === id)?.quantity || 0 }
function add(product, buy = false) {
  if (quantity(product.id) >= product.stock) { notify('已达到该商品库存上限'); return }
  const row = cart.value.find(row => row.id === product.id)
  if (row) { row.quantity++; row.selected = true }
  else cart.value.push({ id: product.id, quantity: 1, selected: true })
  notify('已加入购物车')
  if (buy) { detail.value = null; panel.value = 'cart' }
}
function change(id, delta) {
  const row = cart.value.find(row => row.id === id)
  const product = catalog.value.find(p => p.id === id)
  row.quantity = Math.max(1, Math.min(product.stock, row.quantity + delta))
}
function remove(id) { cart.value = cart.value.filter(row => row.id !== id) }
function selectAll(event) { cart.value.forEach(row => row.selected = event.target.checked) }
function checkout() {
  if (!selected.value.length) return
  latestOrder.value = {
    id: `DH${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    date: new Date().toISOString(), total: total.value, status: '待处理',
    items: selected.value.map(row => ({ name: row.product.name, image: row.product.image, quantity: row.quantity, price: cents(row.product) }))
  }
  orders.value.unshift(latestOrder.value)
  persist(orderKey, orders.value)
  cart.value = cart.value.filter(row => !row.selected)
  panel.value = 'success'
}
const dialogOpen = computed(() => !!(panel.value || detail.value))
const dialog = ref(null)
let previousFocus, previousOverflow
function close() {
  panel.value = ''
  detail.value = null
  const { panel: panelQuery, product, ...query } = route.query
  if (panelQuery || product) router.replace({ query })
}
watch(dialogOpen, async open => {
  if (open) {
    previousFocus = document.activeElement
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick(); dialog.value?.querySelector('button')?.focus()
  } else { document.body.style.overflow = previousOverflow; previousFocus?.focus?.() }
})
function keys(event) {
  if (!dialogOpen.value) return
  if (event.key === 'Escape') close()
  if (event.key !== 'Tab') return
  const nodes = [...dialog.value.querySelectorAll('button:not(:disabled), input:not(:disabled), select')]
  const first = nodes[0], last = nodes[nodes.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
onMounted(() => {
  document.addEventListener('keydown', keys)
  if (route.query.panel === 'orders') panel.value = 'orders'
  else detail.value = catalog.value.find(product => product.id === route.query.product) || null
})
onUnmounted(() => { clearTimeout(timer); document.removeEventListener('keydown', keys); if (dialogOpen.value) document.body.style.overflow = previousOverflow })
</script>

<template>
 <section class="goods-shop">
  <div class="section-heading"><p>SHOP COLLECTION</p><h2>让敦煌灵感，走进日常</h2><span>精选敦煌主题文创。售价与库存为课程演示数据，支持模拟下单，无需支付。</span></div>
  <div class="shop-actions"><span>好物有灵，日常有光</span><div><button @click="panel = 'orders'">我的订单 <b>{{ orders.length }}</b></button><button class="primary" @click="panel = 'cart'">购物车 <b>{{ count }}</b></button></div></div>
  <div class="explore-toolbar"><div class="explore-tabs" aria-label="商品分类"><button v-for="cat in categories" :key="cat" :class="{ active: category === cat }" :aria-pressed="category === cat" @click="category = cat">{{ cat }}</button></div><div class="shop-filters"><input v-model="keyword" class="explore-search" type="search" placeholder="搜索文创好物" aria-label="搜索文创好物"><select v-model="sort" aria-label="商品排序"><option value="default">推荐排序</option><option value="asc">价格从低到高</option><option value="desc">价格从高到低</option></select></div></div>
  <div class="explore-grid"><article v-for="product in products" :key="product.id" class="explore-card"><button class="explore-card-image image-button" :aria-label="'查看' + product.name + '详情'" @click="detail = product"><img :src="'/images/' + product.image" :alt="product.name" loading="lazy"></button><div class="explore-card-copy"><p class="card-category">{{ product.category }}</p><h3>{{ product.name }}</h3><p>灵感来源：{{ product.source }}</p><small>{{ product.note }}</small><div class="product-offer"><strong>¥{{ money(cents(product)) }}</strong><span>示例库存 {{ product.stock }} 件</span></div><div class="product-buttons"><button @click="detail = product">商品详情 ↗</button><button class="primary" :disabled="quantity(product.id) >= product.stock" @click="add(product)">{{ quantity(product.id) >= product.stock ? '已达上限' : '加入购物车' }}</button></div></div></article></div>
  <p v-if="!products.length" class="explore-empty">没有找到相关好物，试试其他分类或关键词。</p>
  <p v-if="storageError" role="alert" class="storage-error">{{ storageError }}</p>
  <div v-if="notice" class="shop-notice" role="status">✓ {{ notice }}</div>
  <Teleport to="body"><div v-if="dialogOpen" class="goods-overlay" @click.self="close"><section ref="dialog" class="goods-dialog" :class="{ 'cart-dialog': panel === 'cart' }" role="dialog" aria-modal="true" aria-labelledby="goods-dialog-title"><button class="goods-close" aria-label="关闭弹窗" @click="close">×</button>
   <template v-if="detail"><p class="eyebrow">{{ detail.category }} / DUNHUANG</p><h2 id="goods-dialog-title">{{ detail.name }}</h2><img class="detail-image" :src="'/images/' + detail.image" :alt="detail.name"><p>灵感来源：{{ detail.source }}</p><p class="muted">{{ detail.note }}</p><div class="product-offer"><strong>¥{{ money(cents(detail)) }}</strong><span>示例库存 {{ detail.stock }} 件</span></div><p class="muted">课程演示选品，图片供款式参考；下单为模拟流程，无需支付。</p><div class="product-buttons"><button @click="add(detail)">加入购物车</button><button class="primary" @click="add(detail, true)">去购物车结算</button></div></template>
   <template v-else-if="panel === 'cart' || panel === 'confirm'"><p class="eyebrow">YOUR SELECTION</p><h2 id="goods-dialog-title">{{ panel === 'confirm' ? '确认模拟订单' : '我的购物车' }} <small> / {{ count }} 件</small></h2>
    <div v-if="!cart.length" class="shop-empty"><span>购物车还是空的</span><p>把喜欢的敦煌好物带回日常。</p><button class="primary" @click="close">去逛逛</button></div>
    <template v-else><label v-if="panel === 'cart'" class="select-all"><input type="checkbox" :checked="allSelected" @change="selectAll"> 全选 <span>已选 {{ selectedCount }} 件</span></label>
     <div class="cart-lines"><article v-for="row in panel === 'confirm' ? selected : lines" :key="row.id" class="cart-line"><input v-if="panel === 'cart'" v-model="cart.find(item => item.id === row.id).selected" type="checkbox" :aria-label="'选择' + row.product.name"><img :src="'/images/' + row.product.image" :alt="row.product.name"><div class="line-copy"><h3>{{ row.product.name }}</h3><p>¥{{ money(cents(row.product)) }}</p><div v-if="panel === 'cart'" class="quantity-control"><button :disabled="row.quantity <= 1" :aria-label="'减少' + row.product.name + '数量'" @click="change(row.id, -1)">−</button><span>{{ row.quantity }}</span><button :disabled="row.quantity >= row.product.stock" :aria-label="'增加' + row.product.name + '数量'" @click="change(row.id, 1)">+</button></div><p v-else>数量 × {{ row.quantity }}</p></div><div class="line-end"><strong>¥{{ money(cents(row.product) * row.quantity) }}</strong><button v-if="panel === 'cart'" :aria-label="'移除' + row.product.name" @click="remove(row.id)">移除</button></div></article></div>
     <div class="cart-summary"><span>商品合计（{{ selectedCount }} 件）</span><strong>¥{{ money(total) }}</strong></div><p class="muted">模拟购物体验，不收款、不配送；订单保存在当前浏览器。</p><p v-if="storageError" role="alert">{{ storageError }}</p><div class="product-buttons"><button v-if="panel === 'cart'" :disabled="!selected.length" @click="cart = cart.filter(row => !row.selected)">删除所选</button><button v-else @click="panel = 'cart'">返回购物车</button><button class="primary" :disabled="!selected.length" @click="panel === 'cart' ? panel = 'confirm' : checkout()">{{ panel === 'cart' ? '去结算' : '确认模拟下单' }}</button></div></template>
   </template>
   <template v-else-if="panel === 'success'"><p class="eyebrow">THANK YOU</p><h2 id="goods-dialog-title">模拟下单成功</h2><div class="success-mark">✓</div><p>你的敦煌灵感，已收进这份订单。</p><p class="muted">订单号：{{ latestOrder.id }}</p><div class="cart-summary"><span>订单金额</span><strong>¥{{ money(latestOrder.total) }}</strong></div><p class="muted">本次为模拟订单，无需付款，不会安排发货。</p><p v-if="storageError" role="alert">{{ storageError }}</p><div class="product-buttons"><button @click="close">继续逛逛</button><button class="primary" @click="panel = 'orders'">查看我的订单</button></div></template>
   <template v-else-if="panel === 'orders'"><p class="eyebrow">YOUR MEMORIES</p><h2 id="goods-dialog-title">我的订单</h2><div v-if="!orders.length" class="shop-empty"><span>还没有订单</span><p>挑选喜欢的文创，体验模拟下单。</p><button class="primary" @click="close">去逛逛</button></div><article v-for="order in orders" :key="order.id" class="order-card"><header><strong>模拟订单 · {{ order.status || '待处理' }}</strong><time>{{ new Date(order.date).toLocaleString('zh-CN') }}</time></header><small>{{ order.id }}</small><div v-for="(item, index) in order.items" :key="index" class="order-line"><img :src="'/images/' + item.image" :alt="item.name"><span>{{ item.name }}<small>¥{{ money(item.price) }} × {{ item.quantity }}</small></span><strong>¥{{ money(item.price * item.quantity) }}</strong></div><p class="order-total">合计 ¥{{ money(order.total) }}</p></article><p class="muted">订单仅保存在当前浏览器，为课程演示记录。</p></template>
  </section></div></Teleport>
 </section>
</template>

<style scoped src="../../styles/portal.css"></style>
<style scoped>
.shop-actions,.shop-actions>div,.shop-filters,.product-offer,.product-buttons{display:flex;align-items:center;gap:12px}.shop-actions{justify-content:space-between;margin:30px 0;color:#8b806c;font-size:13px}.goods-shop button,.goods-dialog button,.shop-filters select{border:1px solid #d9cdb8;background:transparent;color:#6b5639;padding:10px 16px;font:inherit;cursor:pointer}.goods-shop .primary,.goods-dialog .primary{background:#87683e;color:#fff8eb;border-color:#87683e}.shop-actions b{display:inline-block;margin-left:8px;font-size:12px}.shop-filters{flex-wrap:wrap}.shop-filters select{font-size:12px}.product-offer{justify-content:space-between;margin:20px 0 15px}.product-offer strong{color:#9c643b;font-size:23px;font-weight:500}.product-offer span{font-size:11px;color:#8b806c}.product-buttons{margin-top:18px}.product-buttons button{flex:1;font-size:12px;white-space:nowrap}.image-button{display:block;width:100%;padding:0!important;border:0!important;text-align:left}.goods-shop button:disabled,.goods-dialog button:disabled{opacity:.4;cursor:not-allowed}.shop-notice{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#413a33;color:#fff8eb;padding:13px 28px;z-index:1400;box-shadow:0 8px 30px #0002}.storage-error{color:#a1412d}.goods-overlay{position:fixed;inset:0;z-index:1200;background:#241b1690;display:flex;align-items:center;justify-content:center;padding:24px}.goods-dialog{position:relative;width:min(660px,100%);max-height:90dvh;overflow:auto;background:#f8f4eb;color:#413a33;padding:35px;font:14px/1.7 'Microsoft YaHei',sans-serif;box-sizing:border-box;overscroll-behavior:contain}.goods-dialog *{box-sizing:border-box}.goods-dialog h2{font-family:STSong,SimSun,serif;font-size:27px;font-weight:400;margin:6px 35px 25px 0}.goods-dialog h2 small{font:12px sans-serif;color:#8b806c}.goods-dialog .goods-close{position:absolute;right:14px;top:12px;border:0;font-size:27px;padding:0 10px}.eyebrow{font-size:10px;letter-spacing:3px;color:#a6814d}.detail-image{width:100%;max-height:300px;object-fit:contain;background:#ece5d8}.muted{color:#8b806c;font-size:12px}.cart-line{display:flex;align-items:center;gap:14px;padding:20px 0;border-bottom:1px solid #e3d9c8}.cart-line img{width:72px;height:82px;object-fit:cover}.cart-line input,.select-all input{accent-color:#87683e;width:16px;height:16px;flex-shrink:0}.line-copy{flex:1;min-width:0}.line-copy h3{font-size:14px;font-weight:500;margin:0 0 5px}.line-copy p{margin:4px 0;font-size:13px}.line-end{text-align:right;display:grid;gap:15px;font-size:13px}.line-end button{border:0;padding:0;font-size:12px;color:#977357}.quantity-control{display:flex;align-items:center;gap:13px;margin-top:10px}.quantity-control button{width:29px;height:29px;padding:0}.quantity-control span{font-size:12px}.select-all{display:flex;align-items:center;gap:8px;font-size:12px}.select-all span{margin-left:auto;color:#8b806c}.cart-summary{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #d9cdb8;padding-top:20px;margin-top:20px}.cart-summary strong{font-size:25px;color:#9c643b;font-weight:500}.shop-empty{text-align:center;padding:55px 0}.shop-empty>span{font-size:21px;font-family:serif}.shop-empty p{color:#8b806c;font-size:12px;margin:15px 0 25px}.success-mark{font-size:42px;text-align:center;color:#74805b;padding:15px}.order-card{border:1px solid #dfd3bf;padding:18px;margin:20px 0}.order-card header{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:12px}.order-card time,.order-card>small{font-size:10px;color:#8b806c}.order-line{display:flex;align-items:center;gap:12px;margin-top:18px;font-size:12px}.order-line img{width:45px;height:50px;object-fit:cover}.order-line span{flex:1}.order-line small{display:block;color:#8b806c}.order-total{text-align:right;margin-bottom:0}.goods-dialog button:focus-visible,.goods-dialog input:focus-visible{outline:2px solid #a6814d;outline-offset:3px}@media(max-width:650px){.shop-actions{align-items:flex-start;gap:15px}.shop-actions>span{display:none}.shop-actions>div{width:100%}.shop-actions>div button{flex:1}.shop-filters{width:100%}.shop-filters input{min-width:0;flex:1;width:140px}.goods-overlay{padding:12px}.goods-dialog{padding:25px 18px}.cart-line{gap:9px}.cart-line img{width:49px;height:65px}.line-end{font-size:11px}.goods-dialog h2{font-size:24px}.product-offer{flex-wrap:wrap}}
</style>
