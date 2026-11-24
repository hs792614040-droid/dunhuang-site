import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import { pages } from '../data/pages'
const routes = [
  ...pages.filter(page => page.key !== 'digital').map(page => ({ path: page.route, name: page.key, component: page.key === 'home' ? () => import('../views/HomeView.vue') : () => import('../views/ExploreView.vue'), meta: { title: page.title, layout: page.key === 'home' ? 'blank' : undefined } })),
  { path: '/digital', name: 'digital', component: () => import('../views/DigitalGalleryView.vue'), meta: { title: '敦煌 3D 展馆', layout: 'blank' } },
  { path: '/digital/collection', name: 'digital-collection', component: () => import('../views/ExploreView.vue'), meta: { title: '馆藏资料', pageKey: 'digital' } },
  { path: '/app', name: 'app', component: () => import('../views/AppPortalView.vue'), meta: { title: '移动端 App', layout: 'blank' } },
  { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue'), meta: { title: '管理后台', layout: 'blank' } },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: '登录', layout: 'blank' } },
  { path: '/studies', redirect: '/history' },
  { path: '/music', redirect: '/silkroad' },
  { path: '/dance', redirect: '/silkroad' },
  { path: '/scripture', redirect: '/art' },
  { path: '/creation', redirect: '/art' },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: import.meta.env.BASE_URL === '/'
    ? createWebHistory()
    : createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 90, behavior: 'smooth' }
    return { top: 0 }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 寻梦敦煌` : '寻梦敦煌'
})

export default router
