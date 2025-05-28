<template>
  <div class="home-page">
    <!-- 动态背景容器 -->
    <canvas ref="canvas" class="background"></canvas>
    
    <!-- 主要内容 -->
    <div class="content">
      <h1>欲之梦图</h1>
      <p class="subtitle">智能云图库</p>
      
      <!-- 跳转按钮 -->
      <button @click="goToChat" class="chat-button">
        进入AI客服
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvas = ref(null)

const goToChat = () => {
  router.push('/ai-chat')
}

onMounted(() => {
  const ctx = canvas.value.getContext('2d')
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight

  // 粒子系统
  const particles = []
  const particleCount = 150

  // 创建粒子
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height,
      size: Math.random() * 3 + 1,
      speedX: Math.random() * 2 - 1,
      speedY: Math.random() * 2 - 1,
      color: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`
    })
  }

  // 动画循环
  function animate() {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.value.width, canvas.value.height)
    gradient.addColorStop(0, '#6e8efb')
    gradient.addColorStop(1, '#a777e3')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    
    // 更新和绘制粒子
    particles.forEach(p => {
      p.x += p.speedX
      p.y += p.speedY
      
      // 边界检查
      if (p.x < 0 || p.x > canvas.value.width) p.speedX *= -1
      if (p.y < 0 || p.y > canvas.value.height) p.speedY *= -1
      
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })
    
    requestAnimationFrame(animate)
  }
  
  animate()

  // 窗口大小调整
  window.addEventListener('resize', () => {
    canvas.value.width = window.innerWidth
    canvas.value.height = window.innerHeight
  })
})
</script>

<style scoped>
.home-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 2rem;
  color: white;
  text-align: center;
  margin: 0 auto;
  max-width: 1200px;
  width: 100%;
}

h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.chat-button {
  padding: 12px 24px;
  font-size: 1.2rem;
  background: white;
  color: #6e8efb;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.chat-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  h1 {
    font-size: 2.5rem;
  }
  
  .subtitle {
    font-size: 1.2rem;
  }
  
  .chat-button {
    padding: 10px 20px;
    font-size: 1rem;
  }
}
</style>
