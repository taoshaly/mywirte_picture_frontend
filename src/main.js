import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 创建应用实例
const app = createApp(App)

// 使用路由
app.use(router)

// 全局错误处理
app.config.errorHandler = (err) => {
  console.error('Vue error:', err)
}

// 挂载应用
app.mount('#app')

// 开发环境日志
if (import.meta.env.DEV) {
  console.log('App mounted in development mode')
}
