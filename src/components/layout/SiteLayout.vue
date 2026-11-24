<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { pages } from '../../data/pages'
import { useUser } from '../../composables/useUser'
import { appReturnLocation } from '../../router/appNavigation'
const route = useRoute()
const { state: user, logout } = useUser()
const appReturn = computed(() => appReturnLocation(route.query))
const showTop = ref(false)
const links = pages.map(page => ({ title: page.title, to: page.route }))
function onScroll() { showTop.value = window.scrollY > 400 }
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header class="dh-header"><div class="dh-header-inner">
    <RouterLink v-if="appReturn" class="dh-app-return" :to="appReturn">← 返回 App</RouterLink>
    <RouterLink v-else class="dh-brand" to="/" aria-label="寻梦敦煌首页"><img src="/images/logo.png" alt=""><span><strong>寻梦敦煌</strong><small>DUNHUANG · A TIMELESS JOURNEY</small></span></RouterLink>
    <nav class="dh-navigation" aria-label="主导航"><div v-for="link in links" :key="link.to" class="dh-nav-item"><RouterLink :to="link.to" :class="{ current: route.path === link.to }">{{ link.title }}</RouterLink></div></nav>
    <div class="dh-account"><RouterLink v-if="!user.isLoggedIn" to="/login"><i class="fa-regular fa-user" aria-hidden="true"></i><span> 登录 / 注册</span></RouterLink><button v-else @click="logout" :title="user.username + '，点击退出'">退出登录</button></div>
  </div></header>
  <slot />
  <footer class="dh-footer"><div class="dh-footer-inner"><div><RouterLink class="dh-footer-brand" to="/">寻梦敦煌<span>让千年文明，与你相遇。</span></RouterLink><p>以好奇为起点，以热爱为归途。探索敦煌的每一种美。</p></div><div class="dh-footer-links"><RouterLink to="/history">关于敦煌</RouterLink><RouterLink to="/art">艺术灵感</RouterLink><RouterLink to="/shop">文创商城</RouterLink><RouterLink to="/guide">出行指南</RouterLink><RouterLink to="/app">移动端 App</RouterLink><RouterLink to="/admin">管理后台</RouterLink></div></div><div class="dh-footer-bottom"><span>© {{ new Date().getFullYear() }} 寻梦敦煌 · 敦煌文化旅游主题展示</span><span>致敬文明 · 保护遗产 · 文明旅行</span></div></footer>
  <button v-show="showTop" class="dh-to-top" aria-label="返回顶部" @click="scrollTop">↑</button>
</template>

<style scoped>
.dh-app-return {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  min-height: 44px;
  white-space: nowrap;
  font-size: 14px;
}
@media (max-width: 700px) {
  .dh-header .dh-navigation { justify-content: flex-start; }
  .dh-header .dh-account a, .dh-header .dh-account button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
  }
}
.dh-header{
  position:sticky;
  top:0;
  z-index:100;
  height:82px;
  background:#f8f5ed;
  border-bottom:1px solid #e8e0d1}
.dh-header *,.dh-footer *{
  box-sizing:border-box}
.dh-header a,.dh-footer a{
  color:inherit;
  text-decoration:none}
.dh-header-inner{
  width:90%;
  max-width:1400px;
  height:100%;
  margin:auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:25px}
.dh-brand{
  display:flex;
  align-items:center;
  gap:9px;
  flex-shrink:0;
  color:#354039!important}
.dh-brand img{
  height:51px;
  width:43px;
  object-fit:contain}
.dh-brand strong{
  font-family:STKaiti,KaiTi,serif;
  font-size:25px;
  font-weight:400;
  letter-spacing:4px;
  display:block}
.dh-brand small{
  display:block;
  font-size:6px;
  letter-spacing:1.15px;
  margin-top:5px;
  color:#9c8868}
.dh-navigation{
  float:none;
  display:flex;
  align-items:center;
  gap:16px;
  height:100%;
  font-size:12px;
  color:#6d695e}
.dh-nav-item{
  height:100%;
  display:flex;
  align-items:center;
  position:relative}
.dh-nav-item>a{
  padding:30px 0;
  position:relative;
  white-space:nowrap}
.dh-nav-item>a:hover,.dh-nav-item>a.current{
  color:#a48049}
.dh-nav-item>a.current:after{
  content:'';
  position:absolute;
  bottom:18px;
  left:calc(50% - 9px);
  width:18px;
  height:2px;
  background:#b08b52}
.dh-account{
  font-size:11px;
  color:#6d675b;
  display:flex;
  align-items:center;
  gap:16px;
  white-space:nowrap}
.dh-account button{
  background:transparent;
  border:0;
  color:inherit;
  cursor:pointer}
.dh-menu-button{
  display:none;
  font-size:25px}
.dh-nav-dropdown{
  display:none;
  position:absolute;
  left:-25px;
  top:70px;
  width:170px;
  background:#f8f5ed;
  padding:12px;
  border:1px solid #e0d5c0;
  box-shadow:0 12px 25px #2c231b15}
.dh-nav-item:hover .dh-nav-dropdown,.dh-nav-item:focus-within .dh-nav-dropdown{
  display:block}
.dh-nav-dropdown a{
  display:flex;
  justify-content:space-between;
  padding:12px;
  font-size:12px}
.dh-nav-dropdown a:hover{
  background:#ece7da;
  color:#997341}
.dh-footer{
  background:#382e25;
  color:#e9e1cc;
  padding:48px 7% 0}
.dh-footer-inner{
  display:flex;
  justify-content:space-between;
  align-items:center;
  max-width:1240px;
  margin:auto;
  gap:30px}
.dh-footer-brand{
  font-family:serif;
  font-size:27px;
  letter-spacing:4px}
.dh-footer-brand span{
  font-family:sans-serif;
  font-size:11px;
  letter-spacing:2px;
  display:block;
  margin-top:14px;
  color:#c6b38c}
.dh-footer-inner p{
  font-size:10px;
  line-height:2;
  color:#95a497;
  margin-top:16px}
.dh-footer-links{
  display:flex;
  gap:25px;
  font-size:11px;
  color:#c2c5b6}
.dh-footer-bottom{
  display:flex;
  justify-content:space-between;
  gap:15px;
  max-width:1240px;
  margin:35px auto 0;
  padding:20px 0;
  border-top:1px solid #bdb4ac26;
  color:#8e9d8e;
  font-size:9px;
  letter-spacing:1px}
.dh-to-top{
  position:fixed;
  bottom:25px;
  right:25px;
  border:1px solid #c6ad7c;
  background:#f8f3e8;
  color:#66563b;
  width:42px;
  height:42px;
  z-index:90;
  cursor:pointer;
  font-size:20px}
.dh-header a:focus-visible,.dh-header button:focus-visible{
  outline:2px solid #ab824a;
  outline-offset:5px}
@media(max-width:1200px){
  .dh-navigation{
  gap:12px}
.dh-header-inner{
  width:94%;
  gap:15px}
.dh-brand strong{
  font-size:22px}
.dh-account span{
  display:none}
}
@media(max-width:1150px){
  .dh-header{
  height:68px}
.dh-menu-button{
  display:block}
.dh-brand img{
  height:42px}
.dh-brand strong{
  font-size:22px}
.dh-brand small{
  display:none}
.dh-navigation{
  flex:1;
  min-width:0;
  gap:10px;
  font-size:11px;
  justify-content:center;
  overflow-x:auto;
  scrollbar-width:none}
.dh-navigation::-webkit-scrollbar{
  display:none}
.dh-nav-item>a{
  padding:24px 0}
.dh-nav-item>a.current:after{
  bottom:14px}
.dh-nav-dropdown,.dh-nav-item:hover .dh-nav-dropdown,.dh-nav-item:focus-within .dh-nav-dropdown{
  display:grid;
  grid-template-columns:1fr 1fr;
  position:static;
  width:auto;
  border:0;
  box-shadow:none;
  background:#efeadf;
  padding:6px}
.dh-nav-dropdown a{
  font-size:11px}
.dh-account{
  font-size:14px}
.dh-footer-inner{
  align-items:flex-start;
  flex-direction:column}
.dh-footer-links{
  flex-wrap:wrap}
.dh-footer-bottom{
  flex-direction:column;
  line-height:1.8}
.dh-to-top{
  right:15px;
  bottom:15px}
}

</style>
