import { createRouter, createWebHashHistory } from 'vue-router';
import HomeLayout from '@/layouts/HomeLayout.vue';
import Library from '@/views/Library.vue';
import Login from '@/views/Login.vue';
import Settings from '@/views/Settings.vue';
import PlaylistDetail from '@/views/PlaylistDetail.vue';
import Search from '@/views/Search.vue';
import Lyrics from '@/views/Lyrics.vue';
import Ranking from '@/views/Ranking.vue';
import CloudDrive from '@/views/CloudDrive.vue';
import LocalMusic from '@/views/LocalMusic.vue';
import VideoPlayer from '@/views/VideoPlayer.vue';
import Recognize from '@/views/Recognize.vue';
import { MoeAuthStore } from '@/stores/store';


const routes = [
    {
        path: '/',
        component: HomeLayout,
        children: [
            { path: '', name: 'Index', redirect: '/library' },
            { path: '/share', redirect: '/library' },
            { path: '/discover', redirect: '/library' },
            { path: '/library', name: 'Library', component: Library, meta: { requiresAuth: true } },
            { path: '/login', name: 'Login', component: Login },
            { path: '/settings', name: 'Settings', component: Settings },
            { path: '/playlistDetail', name: 'PlaylistDetail', component: PlaylistDetail },
            { path: '/search', name: 'Search', component: Search, meta: { requiresAuth: true } },
            { path: '/ranking', name: 'Ranking', component: Ranking },
            { path: '/CloudDrive', name: 'CloudDrive', component: CloudDrive },
            { path: '/LocalMusic', name: 'LocalMusic', component: LocalMusic },
            { path: '/recognize', name: 'Recognize', component: Recognize },
        ],
    },
    { path: '/lyrics', name: 'Lyrics', component: Lyrics },
    { path: '/spectrum-hud', name: 'SpectrumHUD', component: () => import('@/views/SpectrumHUD.vue') },
    { path: '/video', name: 'VideoPlayer', component: VideoPlayer },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const MoeAuth = MoeAuthStore();
    const settings = JSON.parse(localStorage.getItem('settings')) || {};
    if (to.path === '/') return next({ name: 'Library' });

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!MoeAuth.isAuthenticated) {
            return next({ name: 'Login', query: { redirect: to.fullPath } });
        }
    }

    next();
});

export default router;
