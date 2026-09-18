<template>
  <div class="spectrum-hud" :class="{ 'hud-editing': !locked }">
    <canvas ref="canvasRef" class="spectrum-canvas"></canvas>
    <div class="spectrum-info" v-show="title || cover">
      <img v-if="cover" class="cover" :src="cover" alt="" />
      <div class="meta" v-if="title">
        <div class="title">{{ title }}</div>
        <div class="author" v-if="author">{{ author }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const BAR_COUNT = 114            // 与 sigmarebase renderSpectrum 的 maxWidth 一致
const MAX_REF_HEIGHT = Math.sqrt(2.256e7) / 12 - 5 // sigmarebase 幅度上限对应的条高，用于把参考算法映射到窗口高度
const IDLE_DECAY = 0.92          // 未播放时每帧衰减

const canvasRef = ref(null)
const cover = ref('')
const title = ref('')
const author = ref('')
const playing = ref(false)
const locked = ref(true)

// 非响应式频谱数据，避免高频 IPC 触发 Vue 响应式开销
const levels = new Float32Array(BAR_COUNT)
const heights = new Float32Array(BAR_COUNT)
const barStyles = new Array(BAR_COUNT)
for (let i = 0; i < BAR_COUNT; i++) {
  barStyles[i] = `rgba(153, 153, 153, ${(0.2 * (1 - (i + 1) / BAR_COUNT)).toFixed(4)})`
}
let lastDrawTime = 0
let raf = null
let spectrumScale = 1

// 封面图（用于频谱条内叠加，模拟 sigmarebase 的模糊封面 + stencil 裁剪效果）
let coverImage = null
let blurredCover = null

let coverLoadToken = 0

const loadCover = (url) => {
  if (!url) {
    // 切到无封面的歌曲：清除旧模糊封面，避免旧封面残影留在频谱条上
    coverLoadToken++
    coverImage = null
    blurredCover = null
    return
  }
  if (url === coverImage?.src) return
  const token = ++coverLoadToken
  // 切歌立即清除旧封面，避免旧模糊封面残留在频谱条上（背景残影）
  coverImage = null
  blurredCover = null
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    if (token !== coverLoadToken) return // 竞态保护：已被更新的封面取代
    coverImage = img
    try {
      const c = document.createElement('canvas')
      const w = 400
      const h = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth))
      c.width = w
      c.height = h
      const bctx = c.getContext('2d')
      bctx.filter = 'blur(10px)'
      bctx.drawImage(img, 0, 0, w, h)
      blurredCover = c
    } catch (e) {
      blurredCover = null
    }
  }
  img.onerror = () => {
    if (token !== coverLoadToken) return
    coverImage = null
    blurredCover = null
  }
  img.src = url
}

const applyLock = () => {
  if (locked.value) {
    document.body.style.setProperty('background', 'transparent', 'important');
  } else {
    document.body.style.setProperty('background', 'rgba(0, 0, 0, 0.25)', 'important');
  }
  if (window.electron?.platform !== 'linux')
    window.electron.ipcRenderer.send('set-spectrum-ignore-mouse-events', locked.value)
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
}

const draw = (now = performance.now()) => {
  raf = requestAnimationFrame(draw)
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  // 帧率补偿，保证不同刷新率下衰减速度一致
  const dt = lastDrawTime > 0 ? Math.min(now - lastDrawTime, 100) : 16.67
  lastDrawTime = now

  // 未播放时让条形逐渐回落到零
  if (!playing.value) {
    const decay = Math.pow(IDLE_DECAY, dt / 16.67)
    for (let i = 0; i < BAR_COUNT; i++) levels[i] *= decay
  }

  const barWidth = w / BAR_COUNT
  const maxHeight = h * 0.85 // 条形最高到窗口 85% 高度
  for (let i = 0; i < BAR_COUNT; i++) {
    // sigmarebase renderSpectrum：height = (sqrt(amplitude) / 12 - 5)，按参考上限归一化后映射到窗口高度
    const refHeight = Math.max(0, Math.sqrt(levels[i]) / 12 - 5)
    const scaled = Math.min(1, refHeight / MAX_REF_HEIGHT) * maxHeight * spectrumScale
    heights[i] = Math.max(2 * dpr, Math.min(h, scaled))
  }

  // 1) 灰色底条 #999999（MID_GREY），alpha = 0.2 * alphaValue，左→右渐变
  for (let i = 0; i < BAR_COUNT; i++) {
    const x = i * barWidth
    const y = h - heights[i]
    ctx.fillStyle = barStyles[i]
    ctx.fillRect(x, y, barWidth, heights[i])
  }

  // 2) 封面图叠加：clip 到条形状后铺满绘制，alpha 0.4（模拟 sigmarebase 的 stencil + 模糊封面）
  if (blurredCover) {
    ctx.save()
    ctx.beginPath()
    for (let i = 0; i < BAR_COUNT; i++) {
      ctx.rect(i * barWidth, h - heights[i], barWidth, heights[i])
    }
    ctx.clip()
    ctx.globalAlpha = 0.4
    ctx.drawImage(blurredCover, 0, 0, w, h)
    ctx.globalAlpha = 1
    ctx.restore()
  }
}

onMounted(() => {
  document.body.style.backgroundColor = 'transparent'
  document.body.style.margin = '0'
  document.body.style.overflow = 'hidden'

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  window.electron.ipcRenderer.on('spectrum-data', (_event, data) => {
    if (!data) return
    if (data.levels && data.levels.length) {
      const incoming = data.levels
      const count = Math.min(BAR_COUNT, incoming.length)
      for (let i = 0; i < count; i++) levels[i] = incoming[i] || 0
    }
    if (data.cover != null && data.cover !== cover.value) {
      cover.value = data.cover
      loadCover(data.cover)
    }
    if (data.title != null) title.value = data.title
    if (data.author != null) author.value = data.author
  })

  window.electron.ipcRenderer.on('playing-status', (_event, p) => { playing.value = !!p })

  window.electron.ipcRenderer.on('spectrum-setting-changed', (_e, { key, value }) => {
    if (key === 'spectrumLocked') {
      locked.value = value !== 'off'
      applyLock()
    } else if (key === 'spectrumScale') {
      spectrumScale = parseFloat(value) || 1
    }
  })

  const settings = JSON.parse(localStorage.getItem('settings') || '{}')
  locked.value = settings?.spectrumLocked !== 'off'
  spectrumScale = parseFloat(settings?.spectrumScale || '1.0') || 1

  applyLock()
  draw()

  // 就绪后请求主窗口重发当前频谱/封面信息
  window.electron.ipcRenderer.send('spectrum-hud-ready')

  document.addEventListener('dblclick', (e) => {
    if (!e.target.closest('.spectrum-info')) { locked.value = !locked.value; applyLock() }
  })
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: transparent; overflow: hidden; }

.spectrum-hud {
  position: fixed; inset: 0;
  user-select: none;
  -webkit-app-region: no-drag;
}
.spectrum-hud.hud-editing {
  -webkit-app-region: drag;
  border: 2px dashed rgba(255, 255, 255, 0.4);
  border-radius: 6px;
}

.spectrum-canvas {
  position: absolute; inset: 0;
  display: block;
}

.spectrum-info {
  position: absolute;
  left: 14px; bottom: 12px;
  display: flex; align-items: center; gap: 10px;
  -webkit-app-region: no-drag;
  pointer-events: none;
}
.spectrum-info .cover {
  width: 64px; height: 64px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
.spectrum-info .meta {
  display: flex; flex-direction: column; gap: 2px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.7);
}
.spectrum-info .title {
  color: #fff; font-size: 15px; font-weight: 600;
  white-space: nowrap; max-width: 40vw; overflow: hidden; text-overflow: ellipsis;
}
.spectrum-info .author {
  color: rgba(255,255,255,0.75); font-size: 12px;
  white-space: nowrap; max-width: 40vw; overflow: hidden; text-overflow: ellipsis;
}
</style>
