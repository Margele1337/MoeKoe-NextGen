<template>
    <div id="app" :class="[riseClass, blurClass]">
        <RiseBackground v-if="showRiseBackground && !isLyricsRoute" />
        <button v-if="showRiseBackground && !isLyricsRoute && !isHomeRoute" class="rise-back-btn" @click="$router.back()" title="返回">
            <i class="fas fa-chevron-left"></i>
        </button>
        <TitleBar v-if="showTitleBar && !isLyricsRoute" />
        <RouterView />
        <Disclaimer v-if="!isLyricsRoute" />
        <StatusBarLyrics v-if="!isLyricsRoute" ref="statusBarLyricsRef" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import Disclaimer from '@/components/Disclaimer.vue';
import TitleBar from '@/components/TitleBar.vue';
import StatusBarLyrics from '@/components/StatusBarLyrics.vue';
import RiseBackground from '@/components/RiseBackground.vue';
import { MoeAuthStore } from '@/stores/store';
import logoImageSrc from '@/assets/images/tray/tray-icon@2x.png?url';

const route = useRoute();
const isLyricsRoute = computed(() => route.path === '/lyrics' || route.path === '/spectrum-hud');
const isHomeRoute = computed(() => route.path === '/library');

// 状态栏歌词逻辑
const statusBarLyricsRef = ref(null);
let cleanupStatusBarIPC = null;

// 强制显示自定义 TitleBar，原生窗口装饰锁定关闭
const showTitleBar = ref(true);

// 强制浅色 + Rise 背景
document.documentElement.classList.remove('dark');
localStorage.setItem('theme', 'light');

// Rise 背景始终开启
const showRiseBackground = ref(true);

// 锁定磨砂玻璃
const blurStyle = ref('glass');
const blurRadius = ref('12');

const riseClass = computed(() => showRiseBackground.value ? 'rise-active' : '');
const blurClass = computed(() => showRiseBackground.value ? `blur-${blurStyle.value}` : '');

const applyBlurRadius = (val) => {
    blurRadius.value = val;
    document.documentElement.style.setProperty('--glass-blur', val + 'px');
};

const applyRiseStyles = (active) => {
    if (active) {
        document.body.style.backgroundColor = 'transparent';
    } else {
        document.body.style.backgroundColor = '';
    }
};

const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem('settings')) || {};
    showRiseBackground.value = true;
    applyBlurRadius(settings.blurRadius || '12');
    applyRiseStyles(true);
    return settings;
};

const handleSettingsChange = (e) => {
    const settings = e.detail?.settings;
    if (settings) {
        showRiseBackground.value = true;
        applyBlurRadius(settings.blurRadius || '12');
        applyRiseStyles(true);
    }
};

onMounted(async () => {
    const settings = loadSettings();

    const MoeAuth = MoeAuthStore();
    await MoeAuth.initDevice();

    // 初始化状态栏歌词
    cleanupStatusBarIPC = statusBarLyricsRef.value?.initStatusBar(logoImageSrc, settings);

    window.addEventListener('settings-change', handleSettingsChange);
    window.addEventListener('blur-radius-change', (e) => {
        applyBlurRadius(e.detail?.blurRadius || '12');
    });
});

onUnmounted(() => {
    statusBarLyricsRef.value?.cleanupStatusBar();
    cleanupStatusBarIPC?.();
    window.removeEventListener('settings-change', handleSettingsChange);
    window.removeEventListener('background-change', handleBackgroundChange);
});
</script>

<style scoped>
.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

.rise-back-btn {
    position: fixed;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 50;
    width: 48px;
    height: 80px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.45);
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.2s;
    padding: 0;
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
}

.rise-back-btn:hover {
    color: rgba(255, 255, 255, 0.85);
}
</style>

<style>
/* ===== Rise 背景公共样式 ===== */
#app.rise-active ~ body,
body:has(#app.rise-active),
html:has(#app.rise-active) body {
    background: transparent !important;
    background-color: transparent !important;
}

#app.rise-active main.app-main-scroll {
    background: transparent !important;
}

#app.rise-active .main-content-shell {
    background: transparent;
}

/* ===== 噪点纹理 SVG (base64 encoded) ===== */
#app.blur-acrylic .side-navigation::after,
#app.blur-acrylic header::after,
#app.blur-acrylic .player-container::after,
#app.blur-acrylic .modal-content::after,
#app.blur-acrylic .custom-modal::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: var(--glass-noise);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 200px 200px;
    pointer-events: none;
    z-index: 1;
    border-radius: inherit;
}

#app.blur-acrylic .side-navigation,
#app.blur-acrylic header,
#app.blur-acrylic .player-container,
#app.blur-acrylic .modal-content,
#app.blur-acrylic .custom-modal {
    position: relative;
}

/* ===== 磨砂玻璃 glass ===== */
#app.blur-glass {
    --glass-opacity: 0.72;
    --glass-saturate: 1.0;
    --glass-brightness: 1.0;
    --glass-noise: 0;
    --glass-border: 0.30;
    --glass-card-opacity: 0.78;
    --glass-sidebar-opacity: 0.65;
    --glass-header-opacity: 0.60;
    --glass-player-opacity: 0.70;
    --glass-hover-opacity: 0.50;
    --glass-input-opacity: 0.45;
    --glass-input-focus-opacity: 0.65;
}

/* ===== 亚克力 acrylic ===== */
#app.blur-acrylic {
    --glass-opacity: 0.08;
    --glass-saturate: 1.5;
    --glass-brightness: 1.05;
    --glass-noise: 0.012;
    --glass-border: 0.30;
    --glass-card-opacity: 0.12;
    --glass-sidebar-opacity: 0.06;
    --glass-header-opacity: 0.06;
    --glass-player-opacity: 0.08;
    --glass-hover-opacity: 0.15;
    --glass-input-opacity: 0.05;
    --glass-input-focus-opacity: 0.10;
}

/* ===== 高斯模糊 blur ===== */
#app.blur-blur {
    --glass-opacity: 0.55;
    --glass-saturate: 1.0;
    --glass-brightness: 1.0;
    --glass-noise: 0;
    --glass-border: 0.20;
    --glass-card-opacity: 0.60;
    --glass-sidebar-opacity: 0.45;
    --glass-header-opacity: 0.40;
    --glass-player-opacity: 0.50;
    --glass-hover-opacity: 0.35;
    --glass-input-opacity: 0.30;
    --glass-input-focus-opacity: 0.50;
}

/* ===== 纯透明 clear ===== */
#app.blur-clear {
    --glass-opacity: 0.40;
    --glass-saturate: 1.0;
    --glass-brightness: 1.0;
    --glass-noise: 0;
    --glass-border: 0.12;
    --glass-card-opacity: 0.45;
    --glass-sidebar-opacity: 0.30;
    --glass-header-opacity: 0.25;
    --glass-player-opacity: 0.35;
    --glass-hover-opacity: 0.25;
    --glass-input-opacity: 0.20;
    --glass-input-focus-opacity: 0.40;
}

/* ===== 通用 backdrop-filter 结构样式 ===== */
#app.rise-active header {
    background-color: transparent !important;
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-bottom: 1px solid rgba(255, 255, 255, var(--glass-border));
}

#app.rise-active .side-navigation {
    background-color: rgba(255, 255, 255, var(--glass-sidebar-opacity)) !important;
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness));
    border-right: 1px solid rgba(255, 255, 255, var(--glass-border));
}

#app.rise-active .player-container {
    background-color: transparent !important;
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-top: 1px solid rgba(255, 255, 255, var(--glass-border));
}

/* 播放器歌名 - 彩色流动渐变 */
#app.rise-active .player-container .song-title {
    background: linear-gradient(135deg, #ff6b9d, #c44dff, #4da6ff, #44d9e6, #4da6ff, #c44dff, #ff6b9d);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
    animation: title-gradient-flow 4s ease infinite;
}

@keyframes title-gradient-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* 卡片 - 液态玻璃 */
#app.rise-active .song-item,
#app.rise-active .playlist-card,
#app.rise-active .album-card,
#app.rise-active .artist-card,
#app.rise-active .mv-card {
    background-color: transparent !important;
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid rgba(255, 255, 255, var(--glass-border));
    border-radius: 12px;
    transition: transform 0.2s ease;
}

#app.rise-active .song-item:hover,
#app.rise-active .playlist-card:hover,
#app.rise-active .album-card:hover,
#app.rise-active .artist-card:hover {
    transform: translateY(-2px);
}

/* 弹窗 - 液态玻璃 */
#app.rise-active .modal-content,
#app.rise-active .custom-modal,
#app.rise-active .dialog-content {
    background-color: transparent !important;
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid rgba(255, 255, 255, var(--glass-border));
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

/* 输入框 */
#app.rise-active input[type="text"],
#app.rise-active input[type="search"],
#app.rise-active .search-input,
#app.rise-active .search-box {
    background-color: rgba(255, 255, 255, var(--glass-input-opacity)) !important;
    backdrop-filter: blur(calc(var(--glass-blur) * 0.5)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness));
    -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 0.5)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness));
    border: 1px solid rgba(255, 255, 255, var(--glass-border));
    border-radius: 8px;
    transition: background-color 0.3s ease;
}

#app.rise-active input[type="text"]:focus,
#app.rise-active input[type="search"]:focus,
#app.rise-active .search-input:focus {
    background-color: rgba(255, 255, 255, var(--glass-input-focus-opacity)) !important;
}

/* 设置页等容器 */
#app.rise-active .settings-container,
#app.rise-active .page-content,
#app.rise-active .content-wrapper {
    background-color: rgba(255, 255, 255, var(--glass-card-opacity)) !important;
    backdrop-filter: blur(calc(var(--glass-blur) * 0.6)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness));
    -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 0.6)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness));
    border-radius: 14px;
    padding: 20px;
}

/* PlaylistDetail 详情页 - 全透明 */
#app.rise-active .detail-page .detail-sliver-header,
#app.rise-active .detail-page .detail-sliver-spacer,
#app.rise-active .detail-page .track-list-header,
#app.rise-active .detail-page .track-list-container,
#app.rise-active .detail-page .dropdown-menu,
#app.rise-active .detail-page .batch-actions-menu,
#app.rise-active .detail-page .actions button:not(.primary-btn),
#app.rise-active .detail-page .track-list-actions button,
#app.rise-active .detail-page .sort-btn,
#app.rise-active .detail-page .track-item,
#app.rise-active .detail-page .track-item:nth-child(odd),
#app.rise-active .detail-page .track-item:nth-child(even),
#app.rise-active .detail-page .li,
#app.rise-active .detail-page .track-list-header-row,
#app.rise-active .detail-page .track-list-header .search-input,
#app.rise-active .detail-page .batch-action-btn,
#app.rise-active .detail-page .view-mode-btn {
    background-color: transparent !important;
    border: none !important;
}

#app.rise-active .detail-page .actions .primary-btn {
    background: var(--color-primary) !important;
    color: #fff;
}

/* HomeRecommendations 猜你喜欢 - 透明 */
#app.rise-active .recommend-card,
#app.rise-active .gradient-background,
#app.rise-active .radio-card,
#app.rise-active .radio-content,
#app.rise-active .playlist-entry,
#app.rise-active .ranking-entry {
    background-color: transparent !important;
    background: transparent !important;
    background-image: none !important;
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
}

#app.rise-active .recommend-card:hover,
#app.rise-active .radio-card:hover,
#app.rise-active .playlist-entry:hover,
#app.rise-active .ranking-entry:hover {
    box-shadow: none !important;
}

#app.rise-active .radio-left .play-button {
    background: rgba(255, 255, 255, 0.15) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    box-shadow: none !important;
    color: #fff !important;
}

/* ===== 深色模式 ===== */
html.dark #app.blur-glass {
    --glass-opacity: 0.75;
    --glass-card-opacity: 0.80;
    --glass-sidebar-opacity: 0.70;
    --glass-header-opacity: 0.65;
    --glass-player-opacity: 0.75;
    --glass-hover-opacity: 0.55;
    --glass-input-opacity: 0.10;
    --glass-input-focus-opacity: 0.18;
    --glass-border: 0.08;
}

html.dark #app.blur-acrylic {
    --glass-opacity: 0.07;
    --glass-card-opacity: 0.10;
    --glass-sidebar-opacity: 0.05;
    --glass-header-opacity: 0.05;
    --glass-player-opacity: 0.07;
    --glass-hover-opacity: 0.14;
    --glass-input-opacity: 0.04;
    --glass-input-focus-opacity: 0.09;
    --glass-border: 0.10;
}

html.dark #app.blur-blur {
    --glass-opacity: 0.60;
    --glass-card-opacity: 0.65;
    --glass-sidebar-opacity: 0.50;
    --glass-header-opacity: 0.45;
    --glass-player-opacity: 0.58;
    --glass-hover-opacity: 0.40;
    --glass-input-opacity: 0.05;
    --glass-input-focus-opacity: 0.12;
    --glass-border: 0.05;
}

html.dark #app.blur-clear {
    --glass-opacity: 0.45;
    --glass-card-opacity: 0.50;
    --glass-sidebar-opacity: 0.35;
    --glass-header-opacity: 0.30;
    --glass-player-opacity: 0.42;
    --glass-hover-opacity: 0.30;
    --glass-input-opacity: 0.03;
    --glass-input-focus-opacity: 0.08;
    --glass-border: 0.03;
}

/* 深色模式下背景色覆写 */
html.dark #app.rise-active header,
html.dark #app.rise-active .side-navigation,
html.dark #app.rise-active .player-container,
html.dark #app.rise-active .settings-container,
html.dark #app.rise-active .page-content,
html.dark #app.rise-active input[type="text"],
html.dark #app.rise-active input[type="search"],
html.dark #app.rise-active .search-input {
    background-color: rgba(0, 0, 0, var(--glass-opacity)) !important;
}


html.dark #app.rise-active .side-navigation {
    background-color: rgba(0, 0, 0, var(--glass-sidebar-opacity)) !important;
}

html.dark #app.rise-active header {
    background-color: transparent !important;
}

html.dark #app.rise-active .player-container {
    background-color: transparent !important;
}
</style>
