<template>
    <div class="library-page">
        <div class="profile-section">
            <div class="profile-header">
                <div class="profile-info">
                    <div class="profile-pic-wrapper" @click="toggleProfileMenu">
                        <img class="profile-pic" :src="user.pic" :alt="$t('yong-hu-tou-xiang')" />
                        <div v-if="showProfileMenu" class="profile-menu-dropdown" @click.stop>
                            <ul>
                                <li><router-link to="/settings"><i class="fas fa-cog"></i> {{ $t('she-zhi') }}</router-link></li>
                                <li>
                                    <a v-if="MoeAuth.isAuthenticated" @click="logout"><i class="fas fa-sign-out-alt"></i> {{ $t('tui-chu') }}</a>
                                    <router-link v-else to="/login"><i class="fas fa-sign-in-alt"></i> {{ $t('deng-lu') }}</router-link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="user-details">
                        <div class="user-name-row">
                            <h2 class="user-name">{{ animatedName }}</h2>
                            <BirthdayEasterEgg :birthday="userDetail.birthday" :nickname="user.nickname"
                                :player-control="props.playerControl" />
                        </div>
                        <div class="user-signature">{{ userDetail.descri || '' }}</div>
                        <div class="user-stats">
                            <div class="stat-item"><span class="stat-value">{{ userDetail.follows || 0 }}</span><span
                                    class="stat-label">{{ $t('guan-zhu') }}</span></div>
                            <div class="stat-item"><span class="stat-value">{{ userDetail.fans || 0 }}</span><span
                                    class="stat-label">{{ $t('fen-si') }}</span></div>
                            <div class="stat-item"><span class="stat-value">{{ userDetail.friends || 0 }}</span><span
                                    class="stat-label">{{ $t('hao-you') }}</span></div>
                            <div class="stat-item"><span class="stat-value">{{ userDetail.hvisitors || 0 }}</span><span
                                    class="stat-label">{{ $t('fang-wen') }}</span></div>
                        </div>
                        <div class="user-meta">
                            <span class="user-gender" :title="userGenderTitle">
                                <i :class="userGenderIcon"></i>
                            </span>
                            <span class="user-duration">{{ formatDuration(userDetail.duration || 0) }} {{
                                $t('ting-ge-shi-chang') }}</span>
                            <span class="user-age">{{ formatRegTime(userDetail.rtime || 0) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showDailySection" class="favorite-header">
            <h2 class="section-title" @click="addAllSongsToQueue">{{ $t('mei-ri-tui-jian') }}</h2>
        </div>
        <div v-if="showDailySection" class="favorite-section">
            <div class="song-list">
                <CommonSkeleton v-if="isLoadingDaily" variant="compact-grid" :count="15" />
                <ul v-else>
                    <li v-for="(song, index) in dailyRecommendations" :key="index" class="song-item"
                        @click="playSong(song.hash, song.ori_audio_name, $getCover(song.sizable_cover, 480), song.author_name)">
                        <img :src="$getCover(song.sizable_cover, 120)" :alt="$t('feng-mian')" class="album-cover" />
                        <div class="song-info">
                            <p class="album-name">{{ song.ori_audio_name }}</p>
                            <p class="singer-name">{{ song.author_name }}</p>
                        </div>
                        <i class="song-play-icon fas fa-play"></i>
                    </li>
                </ul>
            </div>
        </div>


        <HomeRecommendations :playerControl="props.playerControl" />

        <!-- 音乐卡片网格（显示歌单或关注的歌手） -->
        <div class="music-grid">
            <template v-if="selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 2">
                <div v-if="selectedCategory === 0 && !isLoadingDaily" class="music-card create-playlist-button">
                    <router-link :to="{
                        path: '/CloudDrive'
                    }">
                        <div class="album-image-wrap">
                            <img :src="`./assets/images/cloud-disk.png`" class="album-image" />
                        </div>
                        <div class="album-info">
                            <h3>我的云盘</h3>
                            <p>(*/ω＼*)</p>
                        </div>
                    </router-link>
                </div>
                <div v-if="selectedCategory === 0 && !isLoadingDaily" class="music-card create-playlist-button">
                    <router-link :to="{
                        path: '/LocalMusic'
                    }">
                        <div class="album-image-wrap">
                            <img :src="`./assets/images/local-music.png`" class="album-image" />
                        </div>
                        <div class="album-info">
                            <h3>本地音乐</h3>
                            <p>(〃'▽'〃)</p>
                        </div>
                    </router-link>
                </div>
                <div class="music-card"
                    v-for="(item, index) in (selectedCategory === 0 ? userPlaylists : selectedCategory === 1 ? collectedPlaylists : collectedAlbums)"
                    :key="index">
                    <router-link :to="{
                        path: '/PlaylistDetail',
                        query: { global_collection_id: item.list_create_gid || item.global_collection_id, listid: item.listid }
                    }">
                        <div class="album-image-wrap">
                            <img :src="item.pic ? $getCover(item.pic, 480) : './assets/images/live.png'"
                                class="album-image" />
                        </div>
                        <div class="album-info">
                            <h3>{{ item.name }}</h3>
                            <p>{{ item.count }} <span>{{ $t('shou-ge') }}</span></p>
                        </div>
                    </router-link>
                </div>
                <div v-if="selectedCategory === 0 && !isLoadingDaily" class="music-card create-playlist-button">
                    <i class="fas fa-plus"></i>
                    <div class="album-image-wrap" @click="createPlaylist">
                        <img :src="`./assets/images/ti111mg.png`" class="album-image" />
                    </div>
                    <div class="album-info" @click="createPlaylist">
                        <h3>{{ $t('chuang-jian-ge-dan') }}</h3>
                        <p>(≧∀≦)♪</p>
                    </div>
                </div>
            </template>
            <div v-if="selectedCategory === 3 || selectedCategory === 4" class="music-card"
                v-for="(artist, index) in (selectedCategory === 3 ? followedArtists : selectedCategory === 4 ? collectedFriends : [])"
                :key="index" @click="goToArtistDetail(artist)">
                <div class="album-image-wrap">
                    <img :src="artist.pic" class="album-image" />
                </div>
                <div class="album-info">
                    <h3>{{ artist.nickname }}</h3>
                </div>
            </div>
        </div>
        <div v-if="
            (selectedCategory == 0 && userPlaylists.length === 0) ||
            (selectedCategory == 1 && collectedPlaylists.length === 0) ||
            (selectedCategory == 2 && collectedAlbums.length === 0) ||
            (selectedCategory == 3 && followedArtists.length === 0) ||
            (selectedCategory == 4 && collectedFriends.length === 0)" class="empty-container">
            <div class="empty-image">
                <img src="/assets/images/empty.png" alt="暂无数据" />
            </div>
            <div class="empty-description">{{ t('zhe-li-shi-mo-du-mei-you') }}</div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { get } from '../utils/request';
import { getProfileBgColor } from '../utils/utils';
import { MoeAuthStore } from '../stores/store';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BirthdayEasterEgg from '../components/BirthdayEasterEgg.vue';
import CommonSkeleton from '../components/CommonSkeleton.vue';
import HomeRecommendations from '../components/home/HomeRecommendations.vue';
const { t } = useI18n();
const router = useRouter();
const MoeAuth = MoeAuthStore();
const showProfileMenu = ref(false);
const user = ref({});
const animatedName = ref('');
let nameAnimTimer = null;
let scrambleTimer = null;

const nameMinWidth = ref('auto');
const measureNameWidth = () => {
    const name = user.value.nickname || '';
    if (!name) { nameMinWidth.value = 'auto'; return; }
    const el = document.querySelector('.user-name');
    if (!el) return;
    // 临时设置为全名来测量宽度
    const prev = el.textContent;
    el.textContent = name;
    nameMinWidth.value = el.getBoundingClientRect().width + 'px';
    el.textContent = prev;
};

const FALLBACK_FONTS = [
  { family: "'Microsoft YaHei', sans-serif", weight: 400 },
  { family: "'SimHei', sans-serif", weight: 400 },
  { family: "'KaiTi', serif", weight: 400 },
  { family: "system-ui", weight: 400 },
  { family: "serif", weight: 400 },
  { family: "cursive", weight: 400 },
  { family: "monospace", weight: 400 },
];
let nameFonts = [...FALLBACK_FONTS];
let fontIndex = 0;

(async () => {
  try {
    if (window.queryLocalFonts) {
      const fonts = await window.queryLocalFonts();
      const seen = new Set();
      const list = [];
      for (const f of fonts) {
        if (!f.family || seen.has(f.family)) continue;
        seen.add(f.family);
        list.push({ family: `'${f.family}', sans-serif`, weight: 400 });
        if (list.length >= 200) break;
      }
      const bold = list.slice(0, 50).map(f => ({ ...f, weight: 700 }));
      nameFonts = [...list, ...bold];
    }
  } catch { /* keep fallback */ }
})();

const startNameAnimation = () => {
  const name = user.value.nickname || '';
  if (!name) { animatedName.value = ''; return; }
  const el = document.querySelector('.user-name');
  const ScrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const settleState = {};
  let step = 0;
  const max = name.length * 2 + 27;
  let cycleCount = 0;
  let prevLen = 0;
  let currentLen = 0;

  // 长度变化：400ms
  const lengthTick = () => {
    const pos = step % max;
    if (pos === 0 && step > 0) {
      cycleCount++;
      fontIndex = Math.floor(Math.random() * nameFonts.length);
      if (el) {
        el.style.fontFamily = nameFonts[fontIndex].family;
        el.style.fontWeight = nameFonts[fontIndex].weight;
      }
      for (const k in settleState) delete settleState[k];
      for (const k in scrambleCount) delete scrambleCount[k];
    }
    let len;
    if (pos < 2) {
      len = 0;
    } else if (pos <= name.length + 1) {
      len = pos - 1;
    } else if (pos <= name.length + 25) {
      len = name.length; // 停留约 10 秒 (25步 × 400ms)
    } else {
      len = name.length * 2 + 25 - pos;
    }
    currentLen = Math.max(0, Math.min(name.length, len));
    if (currentLen > prevLen) {
      for (let i = prevLen; i < currentLen; i++) delete settleState[i];
    }
    if (currentLen === 0) {
      for (const k in settleState) delete settleState[k];
      for (const k in scrambleCount) delete scrambleCount[k];
      animatedName.value = ' ';
    }
    prevLen = currentLen;
    step++;
  };

  // 乱码刷新：60ms，每个位置最多跳 8 次后稳定
  const scrambleCount = {};
  const scrambleTick = () => {
    if (currentLen <= 0) return;
    for (let i = 0; i < currentLen; i++) {
      if (!settleState[i]) {
        scrambleCount[i] = (scrambleCount[i] || 0) + 1;
        if (scrambleCount[i] >= 8) {
          settleState[i] = true;
        }
      }
    }
    let result = '';
    for (let i = 0; i < currentLen; i++) {
      result += settleState[i] ? name[i] : ScrambleChars[Math.floor(Math.random() * ScrambleChars.length)];
    }
    animatedName.value = result;
  };

  lengthTick();
  nameAnimTimer = setInterval(lengthTick, 400);
  scrambleTimer = setInterval(scrambleTick, 60);
  if (el) {
    el.style.fontFamily = nameFonts[0].family;
    el.style.fontWeight = nameFonts[0].weight;
  }
  tick();
  nameAnimTimer = setInterval(tick, 400);
};
const stopNameAnimation = () => {
  clearInterval(nameAnimTimer);
  clearInterval(scrambleTimer);
  animatedName.value = user.value.nickname || '';
};

const userPlaylists = ref([]); // 创建的歌单
const collectedPlaylists = ref([]); // 收藏的歌单
const collectedAlbums = ref([]); // 收藏的专辑
const collectedFriends = ref([]); // 好友
const followedArtists = ref([]); // 关注的歌手
const dailyRecommendations = ref([]); // 每日推荐
const userVip = ref({});
const userDetail = ref({}); // 新增：用户详细信息
const categories = ref([t('wo-chuang-jian-de-ge-dan'), t('wo-shou-cang-de-ge-dan'), t('wo-shou-cang-de-zhuan-ji'), t('wo-guan-zhu-de-ge-shou'), t('wo-guan-zhu-de-hao-you')]);
const selectedCategory = ref(0);
const isLoadingDaily = ref(true);
const DEFAULT_PROFILE_BG_COLOR = 'rgb(44, 32, 34)';
const showDailySection = computed(() => isLoadingDaily.value || dailyRecommendations.value.length > 0);
const profileBgColor = ref(DEFAULT_PROFILE_BG_COLOR);
const profileBackgroundImage = ref('');
const profileHeaderStyle = computed(() => ({
    '--profile-bg-image': profileBackgroundImage.value ? `url(${profileBackgroundImage.value})` : 'none',
    '--profile-bg-color': profileBgColor.value
}));
const userGenderIcon = computed(() => {
    const gender = userDetail.value.gender;
    if (gender === 1) return 'fas fa-mars';
    if (gender === 0) return 'fas fa-venus';
    return 'fas fa-user-secret';
});
const userGenderTitle = computed(() => {
    const gender = userDetail.value.gender;
    if (gender === 1) return '男';
    if (gender === 0) return '女';
    return '保密';
});

const selectCategory = (index) => {
    selectedCategory.value = index;
    // router.replace({ path: '/library', query: { category: index } });
};

// 格式化听歌时长（分钟转为小时和分钟）
const formatDuration = (minutes) => {
    if (!minutes) return '0';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}${t('xiao-shi')} ${mins}${t('fen-zhong')}`;
    }
    return `${mins}${t('fen-zhong')}`;
};

// 格式化注册时间
const formatRegTime = (timestamp) => {
    if (!timestamp) return '';
    const registerDate = new Date(timestamp * 1000);
    const now = new Date();
    const years = now.getFullYear() - registerDate.getFullYear();
    return `${t('le-ling')} ${years} ${t('nian')}`;
};

const updateProfileBackground = (src) => {
    const targetSrc = src;
    const image = new Image();
    image.onload = () => {
        profileBackgroundImage.value = targetSrc;
    };
    image.src = targetSrc;
    profileBgColor.value = DEFAULT_PROFILE_BG_COLOR;
    getProfileBgColor(targetSrc).then(color => {
        profileBgColor.value = color;
    }).catch(() => {
        profileBgColor.value = DEFAULT_PROFILE_BG_COLOR;
    });
};

const playSong = (hash, name, img, author) => {
    props.playerControl.addSongToQueue(hash, name, img, author);
};

const props = defineProps({
    playerControl: Object
});

onMounted(() => {
    if (MoeAuth.isAuthenticated) {
        user.value = MoeAuth.UserInfo;
        // 获取用户vip信息
        getVipInfo();
    }
    document.addEventListener('click', handleClickOutsideMenu);
    startNameAnimation();
});

onUnmounted(() => {
    stopNameAnimation();
});

watch(() => user.value.nickname, (name) => {
    if (name) {
        stopNameAnimation();
        animatedName.value = name;
        setTimeout(() => {
            startNameAnimation();
        }, 50);
    }
});
const getUserDetails = () => {
    // 获取用户详细信息
    getUserDetail();
    // 获取每日推荐
    getDailyRecommendations().finally(() => {
        isLoadingDaily.value = false;
    })
    // 获取用户创建和收藏的歌单
    getplaylist()
    // 获取用户关注的歌手
    getfollow()
    selectedCategory.value = parseInt(router.currentRoute.value.query.category || 0);
}

// 获取用户详细信息
const getUserDetail = async () => {
    try {
        const detailResponse = await get('/user/detail');
        if (detailResponse.status === 1) {
            userDetail.value = detailResponse.data;
            if (detailResponse.data.nickname) user.value.nickname = detailResponse.data.nickname;
            if (detailResponse.data.pic) user.value.pic = detailResponse.data.pic;
            updateProfileBackground(userDetail.value.bg_pic || './assets/images/banner.png');
        }
    } catch (error) {
        console.error('Failed to get user details:', error);
    }
}

const getVipInfo = async () => {
    try {
        const VipInfoResponse = await get('/user/vip/detail');
        if (VipInfoResponse.status === 1) {
            userVip.value = VipInfoResponse.data.busi_vip
            getUserDetails();
        }
    } catch (error) {
        window.$modal.alert(t('deng-lu-shi-xiao-qing-zhong-xin-deng-lu'));
        router.push('/login');
    }
}

const getDailyRecommendations = async () => {
    const response = await get('/everyday/recommend');
    if (response.status == 1) {
        dailyRecommendations.value = response.data.song_list.sort(() => Math.random() - 0.5);
    }
}
const getfollow = async () => {
    const followResponse = await get('/user/follow');
    if (followResponse.status === 1) {
        if (followResponse.data.total == 0) return;
        const artists = followResponse.data.lists.map(artist => ({
            ...artist,
            pic: artist.pic.replace('/100/', '/480/')
        }));
        collectedFriends.value = artists.filter(artist => !artist.singerid);
        followedArtists.value = artists.filter(artist => artist.source == 7);
    }
}
const getplaylist = async () => {
    try {
        const playlistResponse = await get('/user/playlist', {
            pagesize: 500,
            t: localStorage.getItem('t')
        });
        if (playlistResponse.status === 1) {
            const sortedInfo = playlistResponse.data.info.sort((a, b) => {
                if (a.sort !== b.sort) return a.sort - b.sort;
                return 0;
            });

            userPlaylists.value = sortedInfo.filter(playlist => {
                if (playlist.name == '我喜欢') {
                    localStorage.setItem('like', playlist.listid);
                }
                return playlist.list_create_userid === user.value.userid || playlist.name === '我喜欢';
            }).sort((a, b) => a.name === '我喜欢' ? -1 : 1);

            collectedPlaylists.value = sortedInfo.filter(playlist =>
                playlist.list_create_userid !== user.value.userid && !playlist.authors
            );

            collectedAlbums.value = sortedInfo.filter(playlist =>
                playlist.list_create_userid !== user.value.userid && playlist.authors
            );

            const collectedIds = [];
            sortedInfo.forEach(playlist => {
                if (playlist.list_create_userid !== user.value.userid) {
                    collectedIds.push({
                        list_create_listid: playlist.list_create_listid,
                        listid: playlist.listid
                    });
                }
            });
            localStorage.setItem('collectedPlaylists', JSON.stringify(collectedIds));
        }
    } catch (error) {
        window.$modal.alert(t('xin-zeng-zhang-hao-qing-xian-zai-guan-fang-ke-hu-duan-zhong-deng-lu-yi-ci'));
    }
}
const createPlaylist = async () => {
    const result = await window.$modal.prompt(t('qing-shu-ru-xin-de-ge-dan-ming-cheng'), '');
    if (result) {
        try {
            const playlistResponse = await get('/playlist/add', { name: result, list_create_userid: user.value.userid });
            if (playlistResponse.status === 1) {
                localStorage.setItem('t', Date.now());
                getplaylist()
            }
        } catch (error) {
            window.$modal.alert(t('chuang-jian-shi-bai'));
        }
    }
}

const goToArtistDetail = (artist) => {
    if (!artist.singerid) return;
    router.push({
        path: '/PlaylistDetail',
        query: {
            singerid: artist.singerid,
            unfollow: true
        }
    });
};
const signIn = async () => {
    try {
        const res = await get('/youth/vip');
        if (res.status === 1) {
            window.$modal.alert(`签到成功，获得${res.data.award_vip_hour}小时VIP时长`);
        }
    } catch (error) {
        window.$modal.alert('签到失败![该接口将在未来被移除]');
    }
}
const getVip = async () => {
    try {
        const todayKey = new Date().toISOString().split('T')[0];
        const vipResponse = await get('/youth/day/vip', {
            receive_day: todayKey
        });
        const result = await window.$modal.confirm('是否继续升级至概念版VIP,享受更高音质?');
        if (result) {
            try {
                const vipResponse = await get('/youth/day/vip/upgrade');
                if (vipResponse.status === 1) {
                    window.$modal.alert('升级成功，获得1天概念版VIP');
                }
            } catch (error) {
                window.$modal.alert(error.error_msg || '升级VIP失败, 一天仅限一次');
            }
        } else if (vipResponse.status === 1) {
            window.$modal.alert(`签到成功，获得1天畅听VIP`);
        }
    } catch (error) {
        if (error.response.data.error_code == 131001) {
            window.$modal.alert('你今天已经签到过了');
            return;
        } else if (error.response.data.error_code == 20028) {
            window.$modal.alert('当前账号风控,请前往手机端领取');
            return;
        }
        window.$modal.alert('获取VIP失败-' + error.response.data.error_code);
    }
}
const addAllSongsToQueue = () => {
    props.playerControl.addPlaylistToQueue(dailyRecommendations.value.map(song => ({
        hash: song.hash,
        name: song.ori_audio_name,
        cover: song.sizable_cover?.replace("{size}", 480),
        author: song.author_name,
        timelen: song.duration
    })));
};

const toggleProfileMenu = () => {
    showProfileMenu.value = !showProfileMenu.value;
};

const logout = async () => {
    showProfileMenu.value = false;
    const result = await window.$modal.confirm('确认退出登录吗');
    if (result) {
        MoeAuth.clearData();
        router.push({ path: '/' });
    }
};

const handleUpdateClick = () => {
    showProfileMenu.value = false;
    window.open('https://github.com/iAJue/MoeKoeMusic/releases', '_blank');
};

const openDisclaimer = () => {
    showProfileMenu.value = false;
    window.$modal.alert('MoeKoe Music - 开源简洁高颜值的酷狗第三方客户端');
};

// 点击外部关闭菜单
const handleClickOutsideMenu = (e) => {
    if (showProfileMenu.value && !e.target.closest('.profile-pic-wrapper')) {
        showProfileMenu.value = false;
    }
};
</script>

<style lang="scss" scoped>
.sign-in {
    cursor: pointer;
    color: var(--primary-color);
    margin-left: 10px;
    border-radius: 5px;
    padding: 2px 8px;
    border: 1px solid var(--primary-color);
    font-size: 12px;
}

.library-page {
    padding: 20px;
    padding-top: 0;
    --library-favorite-card-bg: rgba(255, 255, 255, 0.9);
    --library-favorite-card-hover-bg: rgba(var(--primary-color-rgb), 0.08);
    --library-favorite-title: #2b2b2b;
    --library-favorite-text: #666;
}

:global(.dark) .library-page {
    --library-favorite-card-bg: rgba(39, 39, 39, 0.92);
    --library-favorite-card-hover-bg: rgba(var(--primary-color-rgb), 0.14);
    --library-favorite-title: rgba(255, 255, 255, 0.88);
    --library-favorite-text: rgba(255, 255, 255, 0.58);
}

.user-level {
    width: 50px;
    margin-left: 10px;
    cursor: pointer;
}

.section-title {
    font-size: 28px;
    font-weight: bold;
    color: var(--primary-color);
    cursor: cell;
    margin-bottom: 0px;
    display: inline-block;
}

.favorite-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.favorite-close-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: none!important;
    background-color: transparent!important;
    color: transparent!important;
    cursor: pointer;
    transition: color 0.2s ease;

    &:is(.dark .favorite-close-button ){
        background-color: transparent!important;
    }

    &:hover {
        color: #8a8a8a!important;
    }
}

.profile-section {
    display: flex;
    align-items: center;
}

.profile-header {
    width: 100%;
    height: 100%;
    min-height: 164px;
    border-radius: 15px;
    margin-bottom: 20px;
    display: flex;
    align-items: flex-end;
    padding: 20px;
    position: relative;
}

.profile-info {
    display: flex;
    align-items: center;
    gap: 15px;
    color: white;
    width: 100%;
    z-index: 3;
}

.profile-pic-wrapper {
    position: relative;
    cursor: pointer;
    flex-shrink: 0;
}

.user-name {
    flex-shrink: 0;
}

.profile-pic {
    border-radius: 50%;
    width: 90px;
    height: 90px;
    border: 3px solid white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s;

    .profile-pic-wrapper:hover & {
        transform: scale(1.05);
    }
}

.profile-menu-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    min-width: 140px;
    z-index: 10;
    padding: 6px 0;

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li a {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        color: #333;
        text-decoration: none;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.15s;

        &:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        i {
            width: 16px;
            text-align: center;
        }
    }
}

.user-details {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    flex: 1;
}

.user-name-row {
    display: flex;
    align-items: center;
    margin-bottom: 2px;
}

.user-name {
    font-size: 28px;
    font-weight: bold;
    margin: 0;
    line-height: 1.3;
    white-space: nowrap;
    overflow: visible;
    flex-shrink: 0;
    z-index: 2;
    position: relative;
    background: linear-gradient(135deg, #ff6b9d, #c44dff, #4da6ff, #44d9e6, #5ce6a8, #f0e644, #ff6b9d);
    background-size: 400% 400%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: name-gradient-flow 5s ease infinite;
}

@keyframes name-gradient-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

.user-level {
    font-size: 14px;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 10px;
    color: white;
}

.user-vip-icon {
    height: 22px;
    margin-left: 10px;
}

.user-signature {
    font-size: 14px;
    color: #eee;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}

.user-stats {
    display: flex;
    justify-content: flex-start;
    gap: 20px;
    margin-bottom: 5px;
    font-size: 14px;
    color: #fff;
}

.stat-item {
    text-align: center;
}

.stat-value {
    font-size: 18px;
    font-weight: bold;
    display: inline-block;
    margin-right: 3px;
}

.stat-label {
    display: inline-block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
}

.user-meta {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 12px;
    color: #fff;
    margin-bottom: 10px;
}

.user-gender i {
    font-size: 16px;
    color: #fff;
}

.user-duration,
.user-age {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 3px 8px;
    border-radius: 10px;
    color: white;
}

.user-actions {
    display: flex;
    gap: 10px;
    margin-top: 5px;
}

.action-button {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 4px 10px;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    font-size: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: background-color 0.3s ease;

    &:hover {
        background-color: rgba(255, 255, 255, 0.3);
    }
}

.favorite-section {
    display: flex;
    justify-content: space-between;
    padding-top: 15px;
    padding-bottom: 15px;
}

.favorite-playlist {
    background-color: var(--background-color);
    padding: 20px;
    border-radius: 12px;
    flex: 1;
    margin-right: 20px;
    border: 1px solid var(--secondary-color);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.playlist-info p {
    margin: 10px 0;
}

.play-button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background-color: var(--secondary-color);
    color: white;
    border: none;
    border-radius: 25px;
    padding: 10px 15px;
    cursor: pointer;

    i {
        font-size: 16px;
    }
}

.song-list {
    width: 100%;
    background: transparent;

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px;
    }

    li {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        min-height: 64px;
        cursor: pointer;
        border-radius: 8px;
        padding: 7px 40px 7px 8px;
        background-color: var(--library-favorite-card-bg);
        transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;

        &:hover {
            transform: translateY(-2px);
            background-color: var(--library-favorite-card-hover-bg);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);

            .song-play-icon {
                opacity: 1;
                transform: translateY(-50%) scale(1);
            }
        }
    }

    img {
        width: 50px;
        height: 50px;
        flex-shrink: 0;
        border-radius: 8px;
        object-fit: cover;
    }
}

.category-tabs {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;

    button {
        position: relative;
        overflow: hidden;
        padding: 10px 15px;
        border: none;
        background-color: #f5f5f5;
        border-radius: 20px;
        cursor: pointer;
        transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;

        &::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.45) 45%, transparent 70%);
            transform: translateX(-120%);
            pointer-events: none;
        }

        &:hover {
            transform: translateY(-2px);
        }

        &.active {
            background-color: var(--primary-color);
            color: white;
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
            transform: translateY(-2px);
            animation: categoryActivePop 0.28s cubic-bezier(0.22, 1, 0.36, 1);

            &::after {
                animation: categoryShine 0.55s ease;
            }
        }
    }
}

@keyframes categoryActivePop {
    0% {
        transform: translateY(0) scale(0.96);
    }

    100% {
        transform: translateY(-2px) scale(1);
    }
}

@keyframes categoryShine {
    0% {
        transform: translateX(-120%);
    }

    100% {
        transform: translateX(120%);
    }
}

.music-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 20px;
}

.music-card {
    min-width: 0;
    border-radius: 8px;
    padding-bottom: 10px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease;

    a {
        display: block;
        color: inherit;
        text-decoration: none;
    }

    &:hover {
        transform: translateY(-4px);

        .album-image-wrap {
            box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16);
        }

        .album-image {
            transform: scale(1.06);
            filter: saturate(1.06);
        }
    }
}

:global(.dark) .music-card:hover {
    background-color: rgba(var(--primary-color-rgb), 0.12);
}

.album-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.28s ease, filter 0.22s ease;
}

.album-image-wrap {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    transition: box-shadow 0.22s ease;
}

.album-info {
    h3 {
        margin: 10px 0 5px;
        font-size: 16px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    p {
        margin: 0;
        color: #666;
        font-size: 14px;
    }
}

.song-item {
    display: flex;
    align-items: center;
}

.album-cover {
    width: 50px;
    height: 50px;
    border-radius: 8px;
}

.song-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    flex: 1;
}

.album-name,
.singer-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.album-name {
    font-weight: bold;
    margin: 0 0 4px;
    font-size: 14px;
    color: var(--library-favorite-title);
}

.singer-name {
    margin: 0;
    font-size: 12px;
    color: var(--library-favorite-text);
}

.song-play-icon {
    position: absolute;
    top: 50%;
    right: 14px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: #fff;
    font-size: 10px;
    opacity: 0;
    transform: translateY(-50%) scale(0.9);
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.create-playlist-button {
    color: var(--primary-color);
    border-radius: 10px;
    cursor: pointer;
    position: relative;

    i {
        font-size: 30px;
        position: absolute;
        top: 32%;
        left: 29%;
        z-index: 1;
        pointer-events: none;
    }
}

.empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    width: 100%;
}

.empty-image {
    margin-bottom: 20px;
    display: flex;
    justify-content: center;

    img {
        width: 200px;
        height: 200px;
        opacity: 0.6;
    }
}

.empty-description {
    color: #909399;
    font-size: 14px;
    text-align: center;
    margin-left: 60px;
}
</style>
