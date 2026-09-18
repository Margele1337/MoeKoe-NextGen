import { ref } from 'vue';
import { get } from '../../utils/request';
import { MoeAuthStore } from '../../stores/store';


export function useHelpers(t) {
  const isInputFocused = ref(false);
  const checkFocus = () => {
    const activeElement = document.activeElement;
    isInputFocused.value = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.isContentEditable;
  };
  const isElectron = () => typeof window !== 'undefined' && typeof window.electron !== 'undefined';
  const handleVolumeScroll = (e) => {
    if (!isElectron()) return;
    window.electron.ipcRenderer.send('volume-change', { deltaY: e.deltaY });
  };
  const handleKeyDown = (e, callbacks) => {
    if (isInputFocused.value) return;
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        callbacks.togglePlayPause?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        callbacks.seekBackward?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        callbacks.seekForward?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        callbacks.volumeUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        callbacks.volumeDown?.();
        break;
      case 'Escape':
        e.preventDefault();
        callbacks.exitFullscreen?.();
        break;
    }
  };
  const desktopLyrics = (visible) => {
    if (!isElectron()) return;
    window.electron.ipcRenderer.send(visible ? 'show-desktop-lyrics' : 'hide-desktop-lyrics');
  };
  const throttle = (fn, delay) => {
    let timer = null;
    return function (...args) {
      if (timer) return;
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delay);
    };
  };

  // 获取VIP
  const getVip = async () => {
    if (typeof MoeAuthStore !== 'function') return;

    const MoeAuth = MoeAuthStore();
    if (!MoeAuth.isAuthenticated) return;

    const todayKey = new Date().toISOString().split('T')[0];
    const lastVipDate = localStorage.getItem('lastVipRequestDate');

    if (lastVipDate === todayKey) {
      return;
    }

    try {
      await get('/youth/day/vip',{
        receive_day: todayKey
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      await get('/youth/day/vip/upgrade');
    } catch (error) {
      console.error('领取VIP失败:', error);
    }
    localStorage.setItem('lastVipRequestDate', todayKey);
  };

  return {
    isInputFocused,
    isElectron,
    handleVolumeScroll,
    checkFocus,
    handleKeyDown,
    desktopLyrics,
    throttle,
    getVip
  };
}