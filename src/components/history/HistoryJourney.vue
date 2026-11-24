<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { historyChapters, historyPerspectives } from '../../data/history'

const root = ref(null)
const active = ref(0)
const progress = ref(0)
const animated = ref(false)
const paused = ref(false)
const expanded = ref([])
let observer, frame
function update() {
  frame = undefined
  const chapters = [...root.value.querySelectorAll('.history-chapter')]
  const anchor = window.innerHeight * .38
  let current = 0
  chapters.forEach((chapter, index) => { if (chapter.getBoundingClientRect().top <= anchor) current = index })
  active.value = current
  const first = chapters[0].getBoundingClientRect().top
  const last = chapters[chapters.length - 1].getBoundingClientRect().top
  progress.value = Math.max(0, Math.min(1, (anchor - first) / (last - first || 1)))
}
function scroll() { if (!frame) frame = requestAnimationFrame(update) }
function go(index) {
  root.value.querySelector(`#history-era-${index}`).scrollIntoView({
    behavior: paused.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'
  })
}
function toggle(index) { expanded.value = expanded.value.includes(index) ? expanded.value.filter(value => value !== index) : [...expanded.value, index] }
onMounted(() => {
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Keep reveal state separate from Vue's dynamic current-era classes.
        entry.target.setAttribute('data-revealed', '')
        observer.unobserve(entry.target)
      }
    }), { threshold: .08, rootMargin: '0px 0px -30px 0px' })
    root.value.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element))
    animated.value = true
  }
  window.addEventListener('scroll', scroll, { passive: true })
  window.addEventListener('resize', scroll)
  update()
})
onUnmounted(() => {
  observer?.disconnect(); cancelAnimationFrame(frame)
  window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll)
})
</script>

<template>
 <section ref="root" class="history-journey" :class="{ 'motion-ready': animated, 'history-paused': paused }">
  <div class="history-intro" data-reveal><div class="section-heading"><p>THE PASSAGE OF TIME</p><h2>一壁千年，<br>写不尽的敦煌。</h2><span>从第一座洞窟，到今天的数字世界。<br>沿着八个时间坐标，读一部仍在延续的文明长卷。</span></div><div class="history-seal" aria-hidden="true"><span>千年</span><span>一瞬</span></div></div>
  <div class="history-milestones" data-reveal><div><strong>366<small>年</small></strong><span>据碑记，乐僔开窟</span></div><div><strong>1944<small>年</small></strong><span>国立敦煌艺术研究所成立</span></div><div><strong>1987<small>年</small></strong><span>莫高窟列入世界遗产名录</span></div><p>一座石窟群<br>也是一部文化交流史</p></div>
  <nav class="history-era-nav" aria-label="跳转历史时期"><div><button v-for="(chapter, i) in historyChapters" :key="chapter.year" :aria-current="active === i ? 'step' : undefined" @click="go(i)"><small>0{{ i + 1 }}</small>{{ chapter.year }}</button></div><button class="history-motion" :aria-pressed="paused" @click="paused = !paused">{{ paused ? '▷ 播放动效' : 'Ⅱ 暂停动效' }}</button></nav>
  <div class="history-reading"><span>沿时间向下阅读</span><div><i :style="{ transform: `scaleX(${progress})` }"></i></div><small>{{ String(active + 1).padStart(2, '0') }} / 08</small></div>
  <ol class="history-chapters"><li v-for="(chapter, i) in historyChapters" :id="`history-era-${i}`" :key="chapter.year" class="history-chapter" :class="{ 'is-current': active === i }" data-reveal>
    <div class="history-axis"><span>0{{ i + 1 }}</span></div>
    <article class="history-story"><div class="history-story-copy"><p class="history-period">{{ chapter.period }}</p><time>{{ chapter.year }}<small v-if="/^\d+$/.test(chapter.year)">年</small></time><h3>{{ chapter.title }}</h3><p class="history-lead">{{ chapter.intro }}</p><div class="history-tags"><span v-for="tag in chapter.tags" :key="tag">{{ tag }}</span></div><button class="history-expand" :aria-expanded="expanded.includes(i)" :aria-controls="`history-context-${i}`" @click="toggle(i)">{{ expanded.includes(i) ? '收起时代故事' : '展开时代故事' }}<span aria-hidden="true">{{ expanded.includes(i) ? '−' : '+' }}</span></button></div>
    <figure class="history-picture"><img :src="'/images/' + chapter.image" :alt="chapter.title + '主题配图'" loading="lazy"><span aria-hidden="true">{{ chapter.year }}</span><figcaption>{{ i === 7 ? '图片来源：数字敦煌 · 第57窟' : '主题配图 · 非该时期历史现场照片' }}</figcaption></figure>
    <div v-if="expanded.includes(i)" :id="`history-context-${i}`" class="history-context"><div><small>时代背景 / CONTEXT</small><p>{{ chapter.context }}</p></div><div><small>观看线索 / LOOK CLOSER</small><p>{{ chapter.looking }}</p></div></div></article>
   </li></ol>
  <section class="history-further"><div class="section-heading" data-reveal><p>HISTORY IS STILL ALIVE</p><h2>历史不止在年代里，<br>也藏在每一个细节中。</h2><span>换一种视角，继续认识敦煌。</span></div><div class="history-perspectives"><RouterLink v-for="item in historyPerspectives" :key="item.number" :to="item.route" class="history-perspective" data-reveal><img :src="'/images/' + item.image" :alt="item.title + '主题配图'" loading="lazy"><div><small>{{ item.number }} / EXPLORE</small><h3>{{ item.title }}</h3><p>{{ item.text }}</p><span>{{ item.link }} ↗</span></div></RouterLink></div></section>
  <aside class="history-sources"><p>循史而来 · 有据可寻</p><span>年代与概况参考以下官方资料；各时期介绍为导览性概述，图片用于主题展示。</span><div><a href="https://www.dha.ac.cn/" target="_blank" rel="noopener noreferrer">敦煌研究院 ↗</a><a href="https://whc.unesco.org/en/list/440/" target="_blank" rel="noopener noreferrer">联合国教科文组织 · 莫高窟 ↗</a><a href="https://www.e-dunhuang.com/" target="_blank" rel="noopener noreferrer">数字敦煌 ↗</a></div></aside>
 </section>
</template>

<style scoped src="../../styles/history-journey.css"></style>
