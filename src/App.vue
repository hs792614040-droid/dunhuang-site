<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteLayout from './components/layout/SiteLayout.vue'

const route = useRoute()
const useLayout = computed(() => route.meta.layout !== 'blank')
</script>

<template>
  <SiteLayout v-if="useLayout">
    <router-view />
  </SiteLayout>
  <router-view v-else />
</template>
