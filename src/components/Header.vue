<template>
    <div class="drag-bar"></div>
    <transition name="search-fade">
        <div v-show="searchVisible" class="floating-search-bar">
            <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                :placeholder="$t('sou-suo-yin-le-ge-shou-ge-dan')"
                @keydown.enter="getSearch"
                @blur="onSearchBlur"
            >
            <router-link to="/recognize" class="header-recognize-entry" title="听歌识曲">
                <i class="fas fa-microphone"></i>
            </router-link>
        </div>
    </transition>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { MoeAuthStore } from '../stores/store';
import { useI18n } from 'vue-i18n';

const MoeAuth = MoeAuthStore();
const searchQuery = ref('');
const searchVisible = ref(false);
const searchInputRef = ref(null);
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const showNewBadge = ref(false);
const appVersion = ref('');
const platform = ref('');
const IGNORE_KEYS = new Set([
    'Escape', 'Tab', 'CapsLock', 'Shift', 'Control', 'Alt', 'Meta',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete',
    'NumLock', 'ScrollLock', 'Pause', 'ContextMenu',
    'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute',
    'MediaTrackNext', 'MediaTrackPrevious', 'MediaPlayPause', 'MediaStop',
]);

onMounted(() => {
    if (window.electron) {
        window.electron.ipcRenderer.on('version', (_event, version) => {
            appVersion.value = version;
            platform.value = window.electron.platform;
            localStorage.setItem('version', version);
        });
    } else {
        appVersion.value = __VERSION__ || '';
        platform.value = 'Web';
    }
    window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
});

const handleGlobalKeydown = async (e) => {
    // 如果焦点在 input/textarea/select 上，不拦截
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable) {
        return;
    }

    // Escape 隐藏搜索栏
    if (e.key === 'Escape') {
        if (searchVisible.value) {
            hideSearch();
        }
        return;
    }

    // 只响应 26 个字母 + 数字
    if (!/^[a-zA-Z0-9]$/.test(e.key)) return;
    // 忽略 Ctrl/Alt/Meta 组合键（如 Ctrl+T, Alt+F4 等）
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // 呼出搜索栏，不吞按键，交给输入法
    searchVisible.value = true;
    nextTick(() => searchInputRef.value?.focus());
};

const showSearch = async (key = '') => {
    searchQuery.value = key;
    searchVisible.value = true;
    await nextTick();
    if (searchInputRef.value) {
        searchInputRef.value.focus();
        if (key) searchInputRef.value.setSelectionRange(key.length, key.length);
    }
};

const hideSearch = () => {
    searchVisible.value = false;
    searchQuery.value = '';
};

// 进入搜索页显示，离开隐藏
watch(() => route.path, (path) => {
    if (path.startsWith('/search')) {
        searchVisible.value = true;
        setTimeout(() => searchInputRef.value?.focus(), 100);
    } else {
        hideSearch();
    }
});

const onSearchBlur = (e) => {
    // 点击听歌识曲图标时不隐藏
    if (e.relatedTarget?.closest?.('.header-recognize-entry')) return;
    if (!searchQuery.value.trim()) {
        setTimeout(() => {
            if (!searchQuery.value.trim() && document.activeElement?.tagName !== 'A') {
                hideSearch();
            }
        }, 200);
    }
};

const Disclaimer = () => {
    isDisclaimerVisible.value = !isDisclaimerVisible.value;
};

const getSearch = () => {
    const keyword = searchQuery.value.trim();
    if (keyword !== '') {
        if (keyword.includes('collection_')) {
            router.push({ path: '/PlaylistDetail', query: { global_collection_id: keyword } });
            hideSearch();
            return;
        }
        router.push({ path: '/search', query: { q: keyword } });
    }
};
</script>

<style lang="scss" scoped>
.drag-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 100px;
    height: 28px;
    z-index: 79;
    -webkit-app-region: drag;
}

.search-fade-enter-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.search-fade-leave-active {
    transition: opacity 0.1s ease;
}
.search-fade-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(-6px);
}
.search-fade-leave-to {
    opacity: 0;
}

.floating-search-bar {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 80;
    display: flex;
    align-items: center;
    -webkit-app-region: drag;

    input {
        -webkit-app-region: no-drag;
        box-sizing: border-box;
        padding: 8px 42px 8px 15px;
        border-radius: 20px;
        border: 1px solid var(--secondary-color);
        font-size: 14px;
        width: 250px;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);

        &:focus {
            outline: none;
            border-color: var(--primary-color);
            background: rgba(255, 255, 255, 0.8);
        }
    }
}

.header-recognize-entry {
    position: absolute;
    top: 50%;
    right: 1px;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #6a6a6a;
    text-decoration: none;
    transition: 0.2s;
    transform: translateY(-50%);

    &:hover {
        color: var(--color-primary);
    }
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    position: relative;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    max-width: 700px;
    width: 90%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    text-align: left;
    animation: fadeIn 0.3s ease;

    .modal-banner {
        position: absolute;
        top: 0;
        right: 15px;
        width: 180px;
        max-width: 35%;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
    }

    h2 {
        margin-top: 20px;
        color: var(--primary-color);
    }

    p {
        margin: 10px 0;
        line-height: 1.6;
    }

    button {
        margin-top: 15px;
        padding: 8px 12px;
        background-color: var(--primary-color);
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.version-number {
    position: absolute;
    bottom: 10px;
    right: 10px;
    font-size: 12px;
    color: #666;
}
</style>
