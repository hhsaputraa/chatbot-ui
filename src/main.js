import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useAuth } from './composables/useAuth'

// Initialize authentication state from localStorage
const { initAuth } = useAuth()
initAuth()

const app = createApp(App)
app.use(router)
app.mount('#app')
