import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user-info'
import lazyLoadDirective from './directives/lazyLoad'
import { createPersistedState } from './plugins/persistedState'

const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistedState({
  key: 'app-state',
  storage: localStorage
}))

app.use(pinia)
app.use(router)

const userStore = useUserStore()
userStore.initFromStorage()

app.directive('lazy', lazyLoadDirective)

app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
})

app.mount('#app')
