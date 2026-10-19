<template>
  <BottomNav v-if="showNav" />
  <Toast v-bind="toast.state" />
  <IncomingCall ref="incomingRef" />
  <NetworkStatus />
  <SplashPopup :splash="splash" @close="closeSplash" @navigate="navigateSplash" />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from '@/common/route'
import { socketService } from '../services/socketService'
import { useToast } from '../composables/useToast'
import { useSplash, closeSplash, navigateSplash } from '../composables/useSplash'
import BottomNav from './BottomNav.vue'
import Toast from './Toast.vue'
import IncomingCall from './IncomingCall.vue'
import NetworkStatus from './NetworkStatus.vue'
import SplashPopup from './SplashPopup.vue'

const route = useRoute()
const toast = useToast()
const splash = useSplash()
const incomingRef = ref(null)
const showNav = computed(() => route.path !== '/login' && !route.meta.fullscreen)

onMounted(() => {
  socketService.on('call_invite', (data) => {
    if (incomingRef.value) incomingRef.value.showIncomingCall(data)
  })
})
</script>
