<template>
  <div class="rain-container">
    <div v-for="(drop, index) in drops" :key="index" class="rain-drop" :style="drop.style"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      drops: [],
      dropCount: 100
    }
  },
  mounted() {
    this.createRain();
  },
  methods: {
    createRain() {
      for (let i = 0; i < this.dropCount; i++) {
        this.drops.push({
          style: {
            left: `${Math.random() * 100}%`,
            animationDuration: `${0.5 + Math.random() * 1}s`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: Math.random()
          }
        });
      }
    }
  }
}
</script>

<style scoped>
.rain-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.rain-drop {
  position: absolute;
  width: 1px;
  height: 50px;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.6));
  animation: rain linear infinite;
}

@keyframes rain {
  from {
    transform: translateY(-100px);
  }
  to {
    transform: translateY(calc(100vh + 100px));
  }
}
</style>
