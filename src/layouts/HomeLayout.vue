<template>
    <RiseBackground />
    <Header v-if="navigationMode === 'top'" />
    <SidebarNavigation v-else />
    <main
        ref="mainScrollRef"
        class="app-main-scroll"
        :class="{ 'side-navigation-main-content': navigationMode === 'side', collapsed: sidebarCollapsed }"
        @scroll="handleMainScroll"
    >
        <div v-if="!isOnline" class="network-status">
            网络连接已断开
        </div>
        <div class="main-content-shell">
            <router-view v-slot="{ Component, route: currentRoute }">
                <div
                    class="page-route-view"
                    :class="{ 'page-route-enter-active': isPageRouteEntering }"
                >
                    <KeepAlive :max="pageCacheMax">
                        <component
                            v-if="shouldCacheRoute(currentRoute)"
                            :is="Component"
                            :key="getRouteCacheKey(currentRoute)"
                            :playerControl="playerControl"
                        />
                    </KeepAlive>
                    <component
                        v-if="!shouldCacheRoute(currentRoute)"
                        :is="Component"
                        :key="currentRoute.fullPath"
                        :playerControl="playerControl"
                    />
                </div>
            </router-view>
        </div>
    </main>
    <PlayerControl ref="playerControl" />
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import Header from "@/components/Header.vue";
import SidebarNavigation from "@/components/SidebarNavigation.vue";
import PlayerControl from "@/components/PlayerControl.vue";
import { setTheme, applyColorTheme, applyCustomFont } from '../utils/utils';

const route = useRoute();
const playerControl = ref(null);
const mainScrollRef = ref(null);
const isOnline = ref(navigator.onLine);
const navigationMode = ref('top');
const playerBarLayout = ref('full');
const isPageRouteEntering = ref(false);
// const routeViewKey = computed(() => route.fullPath);
const routeViewKey = computed(() => route.name);
const cacheableRouteNames = new Set([
    'Library',
    'Search',
    'Ranking'
]);
const pageCacheMax = cacheableRouteNames.size;
const routeScrollPositions = new Map();
let pageRouteAnimationFrame = null;

// 监听网络状态变化
const handleNetworkChange = (online) => {
    isOnline.value = online;

    const title = online ? '网络已连接' : '网络已断开';
    const body = online ? '您已恢复网络连接' : '请检查网络设置';

    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    new Notification(title, {
        body,
        icon: './assets/images/logo.png'
    });
};

const handleOnline = () => handleNetworkChange(true);
const handleOffline = () => handleNetworkChange(false);
const loadNavigationMode = () => {
    navigationMode.value = 'top';
    playerBarLayout.value = 'full';
    applyPlayerBarLayout();
};
const handleSettingsChange = (event) => {
    loadNavigationMode(event.detail?.settings);
};
const applyPlayerBarLayout = () => {
    document.body.classList.remove('player-bar-content-layout');
    document.documentElement.style.removeProperty('--side-navigation-width');
};

const shouldCacheRoute = (currentRoute) => cacheableRouteNames.has(String(currentRoute?.name || ''));

const getRouteCacheKey = (currentRoute) => String(currentRoute?.name || currentRoute?.path || '');

const getScrollRouteKey = (currentRoute) => String(currentRoute?.fullPath || currentRoute?.path || '');

const saveRouteScrollPosition = (currentRoute, scrollTop) => {
    routeScrollPositions.set(getScrollRouteKey(currentRoute), scrollTop);
};

const restoreRouteScrollPosition = (currentRoute) => {
    nextTick(() => {
        if (!mainScrollRef.value) return;
        const scrollTop = routeScrollPositions.get(getScrollRouteKey(currentRoute)) ?? 0;
        mainScrollRef.value.scrollTop = scrollTop;
    });
};

const handleMainScroll = (event) => {
    saveRouteScrollPosition(route, event.target.scrollTop);
};

const stopPageRouteAnimation = () => {
    if (pageRouteAnimationFrame !== null) {
        window.cancelAnimationFrame(pageRouteAnimationFrame);
        pageRouteAnimationFrame = null;
    }
};

const replayPageRouteAnimation = () => {
    stopPageRouteAnimation();
    isPageRouteEntering.value = false;
    pageRouteAnimationFrame = window.requestAnimationFrame(() => {
        isPageRouteEntering.value = true;
        pageRouteAnimationFrame = null;
    });
};

watch(routeViewKey, (to, from) => {
    if (from && mainScrollRef.value) {
        saveRouteScrollPosition({ fullPath: from }, mainScrollRef.value.scrollTop);
    }
    replayPageRouteAnimation();
    restoreRouteScrollPosition(route);
});

onMounted(() => {
    const savedConfig = JSON.parse(localStorage.getItem('settings'));
    if (savedConfig) {
        applyColorTheme(savedConfig['themeColor']);
        applyCustomFont(savedConfig.font || '');
    }
    loadNavigationMode();
    setTheme('light');

    // 添加网络状态监听
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('settings-change', handleSettingsChange);

    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    replayPageRouteAnimation();
});

// 组件卸载时移除事件监听
onUnmounted(() => {
    stopPageRouteAnimation();
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('settings-change', handleSettingsChange);
    document.body.classList.remove('player-bar-content-layout');
    document.documentElement.style.removeProperty('--side-navigation-width');
});
</script>

<style>
/* Rise 字体 */
@font-face {
    font-family: 'HarmonyOS Sans SC';
    src: url('/assets/fonts/HarmonyOS_Sans_SC_Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

:root {
    /* 粉红色主色调 - 用于主要按钮、强调元素 */
    --primary-color: #FF69B4;
    /* 粉红色主色调的RGB值 - 用于需要RGB格式的样式 */
    --primary-color-rgb: '255, 105, 180';
    /* 浅粉红色辅助色 - 用于次要按钮、提示信息 */
    --secondary-color: #FFB6C1;
    /* 文本颜色 - 用于正文内容 */
    --text-color: #333;
    /* 半透明背景 - 用于页面主背景，透出底层动画 */
    --background-color: rgba(255, 240, 245, var(--glass-opacity));
    /* 次要背景色 - 用于卡片、侧边栏背景 */
    --background-color-secondary: rgba(255, 230, 240, var(--glass-opacity));
    /* 高亮色 - 用于交互元素如按钮、链接 */
    --color-primary: #ea33e4;
    /* 高亮色的浅色版本 - 用于选中状态背景 */
    --color-primary-light: rgba(255, 105, 180, 0.1);
    /* 边框颜色 - 用于分隔线、边框 */
    --border-color: rgba(255, 217, 230, var(--glass-border));
    /* 悬停颜色 - 用于元素悬停状态 */
    --hover-color: rgba(255, 233, 242, calc(var(--glass-opacity) * 0.8));
    /* 半透明背景 - 用于覆盖层、提示框 */
    --color-secondary-bg-for-transparent: rgba(209, 209, 214, 0.22);
    /* 阴影颜色 - 用于卡片、弹窗阴影 */
    --color-box-shadow: rgba(255, 105, 180, 0.15);
}

* {
    user-select: none;
}

body,
html {
    margin: 0;
    padding: 0;
    font-family: 'HarmonyOS Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: transparent;
    color: var(--text-color);
    height: 100%;
}

body {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: rgba(26, 154, 186, 0.3);
    border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(26, 154, 186, 0.5);
}

main {
    height: 100vh;
    width: 100%;
    margin: 0;
    padding-top: 10px;
    padding-bottom: 150px;
    box-sizing: border-box;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    position: relative;
    z-index: 1;
    background-color: transparent;
}

.main-content-shell {
    width: min(1200px, 100%);
    margin: 0 auto;
    position: relative;
    overflow: visible;
}

.page-route-view {
    width: 100%;
}

.page-route-enter-active {
    animation: page-route-enter 0.45s ease-out;
    will-change: opacity;
}

@keyframes page-route-enter {
    from {
        opacity: 0;
        transform: translate3d(0, 6px, 0);
    }

    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

main.side-navigation-main-content {
    --side-main-width: 226px;
    width: calc(100% - var(--side-main-width));
    margin-left: var(--side-main-width);
    margin-right: 0;
    padding-top: 52px;
}

main.side-navigation-main-content.collapsed {
    --side-main-width: 64px;
}

a {
    text-decoration: none;
    color: inherit;
    display: block;
}

.network-status {
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    background-color: #ff4757;
    color: white;
    text-align: center;
    padding: 8px;
    z-index: 1000;
}

body.player-bar-content-layout .side-navigation {
    bottom: 0;
}

body:not(.player-bar-content-layout) .side-navigation {
    z-index: 98;
}

body.player-bar-content-layout .player-container {
    left: var(--side-navigation-width);
    width: calc(100% - var(--side-navigation-width));
}
</style>
