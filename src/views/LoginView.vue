<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

import { useRoute, useRouter } from 'vue-router'
import { useUser } from '../composables/useUser'
import { appReturnLocation } from '../router/appNavigation'
const router = useRouter()
const route = useRoute()
const appReturn = computed(() => appReturnLocation(route.query))
const showBackgroundVideo = matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)').matches
const { login, register, rememberedUser } = useUser()

const tab = ref('login')
const loggedInUser = ref('')
const nextLocation = computed(() => appReturn.value || '/')
const loading = ref(false)
const toast = ref(null)
const showPassword = ref(false)
const policy = ref('')
let toastTimer
onUnmounted(() => clearTimeout(toastTimer))

const loginForm = reactive({ username: '', password: '', remember: false })
const registerForm = reactive({ nickname: '', username: '', password: '', confirmPassword: '', agree: false })
const loginErrors = reactive({ username: '', password: '' })
const registerErrors = reactive({ nickname: '', username: '', password: '', confirmPassword: '', agree: '' })

onMounted(() => {
  const remembered = rememberedUser()
  if (remembered) {
    loginForm.username = remembered.username
    loginForm.password = remembered.password
    loginForm.remember = true
  }
})

function showToast(message, type) {
  toast.value = { message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 3000)
}

const patterns = {
  username: /^[a-zA-Z0-9_]{4,16}$/,
  password: /^[a-zA-Z0-9_]{6,16}$/,
  nickname: /^[一-龥a-zA-Z0-9_]{2,10}$/
}
const hints = {
  username: '账号长度4-16位，只能包含字母、数字和下划线',
  password: '密码长度6-16位，只能包含字母、数字和下划线',
  nickname: '昵称长度2-10位，只能包含中文、字母、数字和下划线'
}

function submitLogin() {
  loginErrors.username = loginForm.username ? (patterns.username.test(loginForm.username) ? '' : hints.username) : '请输入账号'
  loginErrors.password = loginForm.password ? (patterns.password.test(loginForm.password) ? '' : hints.password) : '请输入密码'
  if (loginErrors.username || loginErrors.password) return

  loading.value = true
  const result = login(loginForm.username, loginForm.password, loginForm.remember)
  loading.value = false
  if (result.success) {
    loggedInUser.value = loginForm.username
    showToast('登录成功！', 'success')
  } else {
    showToast(result.message, 'error')
    loginErrors.password = result.message
  }
}

function submitRegister() {
  registerErrors.nickname = patterns.nickname.test(registerForm.nickname) ? '' : (registerForm.nickname ? hints.nickname : '请输入昵称')
  registerErrors.username = patterns.username.test(registerForm.username) ? '' : (registerForm.username ? hints.username : '请输入账号')
  registerErrors.password = patterns.password.test(registerForm.password) ? '' : (registerForm.password ? hints.password : '请输入密码')
  registerErrors.confirmPassword = registerForm.password === registerForm.confirmPassword ? '' : '两次输入的密码不一致'
  registerErrors.agree = registerForm.agree ? '' : '请先阅读并同意用户协议和隐私政策'
  if (Object.values(registerErrors).some(Boolean)) return

  loading.value = true
  const result = register(registerForm.nickname, registerForm.username, registerForm.password)
  loading.value = false
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) {
    tab.value = 'login'
    loginForm.username = registerForm.username
  }
}
const activeForm = computed(() => tab.value === 'login' ? loginForm : registerForm)
const activeErrors = computed(() => tab.value === 'login' ? loginErrors : registerErrors)
const fields = computed(() => [
  ...(tab.value === 'register' ? [{ key: 'nickname', label: '你的昵称', placeholder: '怎么称呼你？', icon: 'fa-signature', autocomplete: 'nickname' }] : []),
  { key: 'username', label: '账号', placeholder: '请输入账号', icon: 'fa-user', autocomplete: 'username' },
  { key: 'password', label: '密码', placeholder: tab.value === 'login' ? '请输入密码' : '设置 6–16 位密码', icon: 'fa-lock', autocomplete: tab.value === 'login' ? 'current-password' : 'new-password' },
  ...(tab.value === 'register' ? [{ key: 'confirmPassword', label: '确认密码', placeholder: '再次输入密码', icon: 'fa-lock', autocomplete: 'new-password' }] : [])
])
function switchTab(next) { tab.value = next; showPassword.value = false; toast.value = null }
</script>

<template>
  <main class="login-page">
    <video v-if="showBackgroundVideo" class="login-video" autoplay muted loop playsinline poster="/images/bg7.jpg" aria-hidden="true"><source src="/images/start.mp4" type="video/mp4"></video>
    <div class="login-scrim"></div>
    <router-link :to="appReturn || '/'" class="login-home"><span>←</span> {{ appReturn ? '返回 App' : '返回首页' }}</router-link>
    <div class="login-shell">
      <section class="login-story" aria-label="寻梦敦煌">
        <p class="login-eyebrow">DUNHUANG · A TIMELESS JOURNEY</p>
        <h1>心向敦煌<br>与美<span>相逢。</span></h1>
        <div class="story-line"></div>
        <p class="story-copy">把千年的浪漫，藏进每一次相遇。<br>从这里，开启属于你的丝路之旅。</p>
        <span class="story-caption">一 梦 入 敦 煌 · 一 眼 越 千 年</span>
      </section>
      <section class="login-card" aria-labelledby="login-heading">
        <div class="login-brand"><img src="/images/logo.png" alt=""><span>寻梦敦煌<small>THE BEAUTY OF DUNHUANG</small></span><span class="login-seal" aria-hidden="true">丝路<br>来信</span></div>
        <div v-if="loggedInUser" class="login-success" role="status">
          <div class="login-success-mark" aria-hidden="true"><i class="fa-solid fa-check"></i></div>
          <p>登录成功</p>
          <h2>欢迎回来，{{ loggedInUser }}</h2>
          <p class="login-success-copy">千年敦煌已为你准备好，随时可以出发。</p>
          <div class="login-success-actions">
            <router-link :to="nextLocation" class="login-submit">{{ appReturn ? '返回 App' : '进入首页' }} <span>→</span></router-link>
            <button type="button" class="login-success-ghost" @click="loggedInUser = ''">切换账号</button>
          </div>
        </div>
        <template v-else>
        <div class="login-welcome"><p>很高兴，在这里遇见你</p><h2 id="login-heading">{{ tab === 'login' ? '欢迎归来' : '初见，便是美好' }}<span>。</span></h2></div>
        <div class="login-tabs" role="tablist" aria-label="登录与注册"><button id="login-tab" role="tab" :aria-selected="tab === 'login'" aria-controls="login-panel" :class="{ active: tab === 'login' }" @click="switchTab('login')">账号登录</button><button id="register-tab" role="tab" :aria-selected="tab === 'register'" aria-controls="login-panel" :class="{ active: tab === 'register' }" @click="switchTab('register')">注册账号</button></div>
        <form id="login-panel" role="tabpanel" :aria-labelledby="tab === 'login' ? 'login-tab' : 'register-tab'" novalidate @submit.prevent="tab === 'login' ? submitLogin() : submitRegister()">
          <div v-for="field in fields" :key="field.key" class="login-field">
            <label :for="'auth-' + field.key">{{ field.label }}</label>
            <div class="login-input" :class="{ invalid: activeErrors[field.key] }"><i class="fa-solid" :class="field.icon" aria-hidden="true"></i><input :id="'auth-' + field.key" v-model="activeForm[field.key]" :name="field.key" :type="field.key.toLowerCase().includes('password') && !showPassword ? 'password' : 'text'" :placeholder="field.placeholder" :autocomplete="field.autocomplete" :aria-invalid="!!activeErrors[field.key]" :aria-describedby="activeErrors[field.key] ? 'error-' + field.key : undefined" @input="activeErrors[field.key] = ''"><button v-if="field.key === 'password'" type="button" class="password-toggle" :aria-label="showPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showPassword" @click="showPassword = !showPassword"><i class="fa-regular" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'" aria-hidden="true"></i></button></div>
            <p v-if="activeErrors[field.key]" :id="'error-' + field.key" class="login-error" role="alert">{{ activeErrors[field.key] }}</p>
          </div>
          <div v-if="tab === 'login'" class="login-options"><label><input v-model="loginForm.remember" type="checkbox"> 记住账号与密码</label><button type="button" @click="showToast('请联系管理员重置密码', 'error')">忘记密码？</button></div>
          <div v-else class="login-agreement"><label><input v-model="registerForm.agree" type="checkbox"> 我已阅读并同意</label> <button type="button" @click="policy = '用户协议'">用户协议</button> 与 <button type="button" @click="policy = '隐私说明'">隐私说明</button><p v-if="registerErrors.agree" class="login-error" role="alert">{{ registerErrors.agree }}</p></div>
          <button class="login-submit" type="submit" :disabled="loading">{{ loading ? '请稍候…' : tab === 'login' ? '登录，开启旅程' : '注册，遇见敦煌' }}<span>→</span></button>
        </form>
        </template>
        <div class="login-card-footer"><span></span> 让千年文明，与你相遇 <span></span></div>
      </section>
    </div>
    <p class="login-copyright">寻梦敦煌 · 以热爱，赴一场千年之约</p>
    <div v-if="toast" class="login-toast" :class="toast.type" role="status">{{ toast.message }}</div>
    <div v-if="policy" class="login-policy-overlay" @click.self="policy = ''" @keydown.esc="policy = ''"><section class="login-policy" role="dialog" aria-modal="true" aria-labelledby="policy-heading"><h2 id="policy-heading">{{ policy }}</h2><p v-if="policy === '用户协议'">本网站为敦煌文旅主题课程演示项目。请文明使用网站功能；商城用于商品展示与交互演示，不提供真实交易服务。</p><p v-else>此演示项目将账号、登录状态及你选择记住的密码保存在当前浏览器中。请使用演示账号和密码，勿填写真实敏感信息。清除浏览器网站数据可删除本地记录。</p><button type="button" autofocus @click="policy = ''">我知道了</button></section></div>
  </main>
</template>

<style scoped src="../styles/login.css"></style>
<style scoped>
.login-success{text-align:center;padding:18px 4px 8px;animation:successIn .7s cubic-bezier(.2,.8,.2,1) both}
.login-success-mark{width:76px;height:76px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#b8432b,#d9704f);color:#fff;font-size:30px;box-shadow:0 14px 34px rgba(184,67,43,.35);animation:markPop .6s .15s cubic-bezier(.2,1.4,.4,1) both}
.login-success p{margin:0;font-size:13px;letter-spacing:3px;color:#b8432b}
.login-success h2{margin:10px 0 12px;font:700 24px STKaiti,KaiTi,serif;color:#2b2119}
.login-success-copy{letter-spacing:1px;color:#6b5a4c;font-size:13px;line-height:1.8}
.login-success-actions{display:grid;gap:12px;margin-top:26px}
.login-success-actions .login-submit{display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
.login-success-ghost{height:40px;border:0;background:none;color:#8c8072;font-size:13px;cursor:pointer}
@keyframes successIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes markPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
</style>
