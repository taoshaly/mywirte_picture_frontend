<template>
  <div class="chat-page-container">
    <canvas ref="bgCanvas" class="background-canvas"></canvas>
    <RainAnimation />
    <div class="chat-container">
      <div class="chat-header">
      <h2>欲之梦图 AI客服</h2>
      <p class="chat-id">会话ID: {{ chatId }}</p>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', message.sender]"
      >
        <div class="message-content">{{ message.text }}</div>
      </div>
    </div>

    <div class="chat-input">
      <input
        v-model="inputMessage"
        @keyup.enter="sendMessage"
        placeholder="输入您的问题..."
      />
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

// 粒子类
class Particle {
  constructor(ctx) {
    this.ctx = ctx
    this.reset()
  }

  reset() {
    this.x = Math.random() * this.ctx.canvas.width
    this.y = Math.random() * this.ctx.canvas.height
    this.size = Math.random() * 3 + 1
    this.speedX = Math.random() * 3 - 1.5
    this.speedY = Math.random() * 3 - 1.5
    this.color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`
  }

  update() {
    this.x += this.speedX
    this.y += this.speedY
    if (this.x < 0 || this.x > this.ctx.canvas.width || 
        this.y < 0 || this.y > this.ctx.canvas.height) {
      this.reset()
    }
  }

  draw() {
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    this.ctx.fillStyle = this.color
    this.ctx.fill()
  }
}
import axios from 'axios'
import RainAnimation from '@/components/RainAnimation.vue'

const chatId = ref(generateChatId())
const messages = ref([])
const inputMessage = ref('')
const messagesContainer = ref(null)
const bgCanvas = ref(null)
const isLoading = ref(false)
let eventSource = null
let particles = []
let animationId = null
let ctx = null

// 初始化粒子系统
function initParticles() {
  if (!bgCanvas.value) return
  
  const canvas = bgCanvas.value
  ctx = canvas.getContext('2d')
  
  // 设置canvas尺寸
  resizeCanvas()
  
  // 创建粒子
  particles = []
  const particleCount = Math.floor(canvas.width * canvas.height / 10000)
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(ctx))
  }
  
  // 开始动画
  animate()
}

// 调整canvas尺寸
function resizeCanvas() {
  const canvas = bgCanvas.value
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
}

// 动画循环
function animate() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  
  // 更新和绘制所有粒子
  particles.forEach(p => {
    p.update()
    p.draw()
  })
  
  animationId = requestAnimationFrame(animate)
}

// 清理动画
function cleanupAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// 生成随机聊天室ID
function generateChatId() {
  return 'chat-' + Math.random().toString(36).substring(2, 9)
}

// 发送消息
function sendMessage() {
  if (!inputMessage.value.trim()) return

  // 如果存在之前的连接，关闭它
  if (eventSource) {
    eventSource.close()
  }

  // 添加用户消息
  messages.value.push({
    sender: 'user',
    text: inputMessage.value
  })

  // 添加AI消息占位符
  messages.value.push({
    sender: 'ai',
    text: ''  // 空文本，等待实际内容
  })

  const message = inputMessage.value
  inputMessage.value = ''

  // 调用SSE接口
  connectSSE(message)
}

// 连接SSE
function connectSSE(message) {
  if (eventSource) {
    eventSource.close()
  }

  // 构建URL
  const params = new URLSearchParams({
    message: message,
    chatId: chatId.value
  })
  const url = `https://mywrite-pic-agent-164129-5-1361058995.sh.run.tcloudbase.com/api/ai/chat/sse?${params.toString()}`

  // 创建EventSource实例
  eventSource = new EventSource(url, {
    withCredentials: true
  })

  let currentResponse = ''

  // 消息处理
  eventSource.onmessage = (event) => {
    const rawData = event.data
    
    // 检查是否是结束标记
    if (rawData === '[DONE]') {
      eventSource.close()
      return
    }

    try {
      // 处理数据
      let data = rawData
      
      // 移除data:前缀（如果存在）
      if (data.startsWith('data:')) {
        data = data.substring(5).trim()
      }

      // 如果数据是空的，跳过处理
      if (!data) return

      // 解码处理
      try {
        data = decodeURIComponent(escape(data))
      } catch (decodeError) {
        try {
          data = decodeURIComponent(data)
        } catch (directDecodeError) {
          console.warn('解码失败，使用原始数据')
        }
      }
      
      // 检查是否是JSON格式
      try {
        if (data.trim().startsWith('{') && data.trim().endsWith('}')) {
          const jsonData = JSON.parse(data)
          if (jsonData.content) {
            data = jsonData.content
          } else if (jsonData.message) {
            data = jsonData.message
          } else if (jsonData.text) {
            data = jsonData.text
          }
        }
      } catch (jsonError) {
        console.warn('JSON解析失败，使用原始文本')
      }

      // 更新消息
      if (data) {
        currentResponse += data
        const aiMessage = messages.value[messages.value.length - 1]
        if (aiMessage.sender === 'ai') {
          aiMessage.text = currentResponse
          scrollToBottom()
        }
      }
    } catch (error) {
      console.error('处理SSE消息时出错:', error)
      eventSource.close()
    }
  }

  // 错误处理
  eventSource.onerror = () => {
    eventSource.close()
    const aiMessage = messages.value[messages.value.length - 1]
    if (aiMessage.sender === 'ai' && !aiMessage.text) {
      aiMessage.text = '抱歉，连接出现错误，请重试'
    }
  }
}

// 添加重试连接函数
const MAX_RETRY_DELAY = 10000 // 最大重试延迟时间（10秒）

function retryConnection(message) {
  if (retryCount < MAX_RETRIES) {
    retryCount++
    console.log(`准备第 ${retryCount} 次重试...`) // 调试日志
    
    // 使用指数退避策略计算延迟时间
    const delay = Math.min(RETRY_DELAY * Math.pow(2, retryCount - 1), MAX_RETRY_DELAY)
    
    // 更新消息状态以显示重试进度
    const aiMessage = messages.value[messages.value.length - 1]
    if (aiMessage.sender === 'ai') {
      let statusText = currentResponse.trim() 
        ? currentResponse.trim() + `\n\n[正在重试... (${retryCount}/${MAX_RETRIES})]`
        : `思考中...\n\n[正在重试... (${retryCount}/${MAX_RETRIES})]`
      aiMessage.text = statusText
      scrollToBottom()
    }
    
    setTimeout(() => {
      console.log(`开始第 ${retryCount} 次重试，延迟: ${delay}ms`) // 调试日志
      connectSSE(message, true)
    }, delay)
  } else {
    console.log('达到最大重试次数') // 调试日志
    isLoading.value = false
    
    // 更新最终消息状态
    const aiMessage = messages.value[messages.value.length - 1]
    if (aiMessage.sender === 'ai') {
      let finalMessage = currentResponse.trim()
        ? currentResponse.trim() + '\n\n[连接失败，消息可能不完整]'
        : '抱歉，连接失败，请稍后重试'
      aiMessage.text = finalMessage
      scrollToBottom()
    }
    
    // 清理状态
    if (eventSource) {
      eventSource.close()
    }
    currentResponse = ''
    messageComplete = false
  }
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  // 初始欢迎消息
  messages.value.push({
    sender: 'ai',
    text: '您好！我是欲之梦图AI客服，请问有什么可以帮您？'
  })
  
  // 初始化粒子系统
  nextTick(() => {
    initParticles()
  })
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  // 清理粒子动画
  cleanupAnimation()
  window.removeEventListener('resize', resizeCanvas)
  
  // 清理SSE连接
  if (eventSource) {
    eventSource.close()
  }
})
</script>

<style scoped>
.background-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: linear-gradient(to bottom, #1a1a2e, #16213e);
}

.chat-page-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: 15px;
  background-color: #f5f5f5;
  position: relative;
  z-index: 1;
}

.button {
  transition: all 0.3s ease;
  transform: scale(1);
}

.button:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.button:active {
  transform: scale(0.98);
}

.chat-header {
  text-align: center;
  margin-bottom: 15px;
  padding: 10px;
}

.chat-header h2 {
  color: #6e8efb;
  font-size: 1.5rem;
  margin-bottom: 5px;
}

.chat-id {
  color: #888;
  font-size: 0.8rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 12px;
  scroll-behavior: smooth;
}

.message {
  margin-bottom: 12px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 16px;
  word-break: break-word;
  line-height: 1.4;
}

.message.user .message-content {
  background: linear-gradient(135deg, #6e8efb 0%, #4a6fdc 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.message.user .message-content::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255,255,255,0.3) 0%,
    rgba(255,255,255,0) 50%,
    rgba(255,255,255,0.3) 100%
  );
  animation: shine 6s linear infinite;
  transform: rotate(30deg);
}

.message.ai .message-content {
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  color: #333;
  position: relative;
  overflow: hidden;
}

.message.ai .message-content::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255,255,255,0.5) 0%,
    rgba(255,255,255,0) 50%,
    rgba(255,255,255,0.5) 100%
  );
  animation: shine 6s linear infinite;
  transform: rotate(30deg);
}

@keyframes shine {
  0% { transform: translateX(-50%) translateY(-50%) rotate(30deg); }
  100% { transform: translateX(50%) translateY(50%) rotate(30deg); }
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 8px 0;
}

.chat-input input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 24px;
  outline: none;
  font-size: 1rem;
}

.chat-input button {
  padding: 10px 16px;
  background-color: #6e8efb;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
}

.chat-input button:hover {
  background-color: #5a7de3;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .chat-container {
    padding: 10px;
    max-width: 100%;
  }
  
  .chat-header h2 {
    font-size: 1.3rem;
  }
  
  .chat-messages {
    padding: 10px;
    border-radius: 0;
  }
  
  .message-content {
    max-width: 85%;
    padding: 8px 12px;
  }
  
  .chat-input {
    padding: 6px 0;
  }
  
  .chat-input input {
    padding: 8px 12px;
  }
  
  .chat-input button {
    padding: 8px 12px;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .chat-container {
    background-color: #121212;
  }
  
  .chat-messages {
    background-color: #1e1e1e;
  }
  
  .message.ai .message-content {
    background-color: #333;
    color: #eee;
  }
  
  .chat-input input {
    background-color: #2d2d2d;
    border-color: #444;
    color: white;
  }
}
</style>
