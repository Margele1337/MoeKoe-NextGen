<template>
    <div class="complex-search-results">
        <div v-if="visibleSectionCount === 0" class="complex-empty">
            暂无综合搜索结果
        </div>

        <template v-else>
            <section v-if="artistSection" class="complex-section">
                <ArtistGrid :artists="artistSection.lists" @artist-click="emit('artist-click', $event)" />
            </section>

            <section v-if="songSection" class="complex-section">
                <div class="section-header">
                    <h3>单曲</h3>
                    <button class="section-link" @click="goToSearch('song')">
                        查看更多({{ songSection.total || songSection.lists.length }})
                    </button>
                </div>
                <SongSearchList :songs="songSection.lists" @song-click="emit('song-play', $event)"
                    @song-contextmenu="handleSongContextMenu" />
            </section>

            <section v-if="albumSection" class="complex-section">
                <div class="section-header">
                    <h3>专辑</h3>
                    <button class="section-link" @click="goToSearch('album')">
                        查看更多({{ albumSection.total || albumSection.lists.length }})
                    </button>
                </div>
                <AlbumGrid :albums="albumSection.lists" @album-click="emit('album-click', $event)" />
            </section>

            <section v-if="playlistSection" class="complex-section">
                <div class="section-header">
                    <h3>歌单</h3>
                    <button class="section-link" @click="goToSearch('collect')">
                        查看更多({{ playlistSection.total || playlistSection.lists.length }})
                    </button>
                </div>
                <PlaylistGrid :playlists="playlistSection.lists" @playlist-click="emit('playlist-click', $event)" />
            </section>

            <section v-if="mvSection" class="complex-section">
                <div class="section-header">
                    <h3>MV</h3>
                    <button class="section-link" @click="goToSearch('mv')">
                        查看更多({{ mvSection.total || mvSection.lists.length }})
                    </button>
                </div>
                <MvGrid :mvs="mvSection.lists" @mv-click="emit('mv-click', $event)" />
            </section>

            <section v-if="programSection" class="complex-section">
                <div class="section-header">
                    <h3>节目</h3>
                </div>
                <div class="program-grid">
                    <div v-for="(program, index) in programSection.lists"
                        :key="`${program.albumid || program.title}-${index}`" class="program-card"
                        @click="emit('program-click', program)">
                        <img :src="getImage(program.img, 480)" class="program-cover" />
                        <div class="program-info">
                            <h4 :title="program.albumname">{{ program.albumname }}</h4>
                            <p class="program-title" :title="program.title">{{ program.title }}</p>
                            <div class="program-meta">
                                <span>{{ program.songcount }}首</span>
                                <span>{{ program.singer || getSingerNames(program.singers) }}</span>
                                <span>{{ formatDate(program.publish_time) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section v-if="musicPhotoSection" class="complex-section">
                <div class="section-header">
                    <h3>乐评</h3>
                </div>
                <div class="article-grid">
                    <article v-for="(item, index) in musicPhotoSection.lists"
                        :key="`${item.article_id || item.title}-${index}`" class="article-card">
                        <img :src="item.cover || './assets/images/ico.png'" class="article-cover" />
                        <div class="article-info">
                            <h4 :title="item.title">{{ item.title }}</h4>
                            <div class="article-author">
                                <img :src="item.header || './assets/images/ico.png'" class="author-avatar" />
                                <span>{{ item.nickname }}</span>
                            </div>
                            <div class="article-meta">
                                <span>{{ formatCount(item.scan_num) }}阅读</span>
                                <span>{{ formatCount(item.like_num) }}点赞</span>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </template>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import AlbumGrid from './AlbumGrid.vue';
import PlaylistGrid from './PlaylistGrid.vue';
import ArtistGrid from './ArtistGrid.vue';
import MvGrid from './MvGrid.vue';
import SongSearchList from './SongSearchList.vue';

const props = defineProps({
    data: {
        type: Object,
        default: null
    },
    keyword: {
        type: String,
        default: ''
    }
});

const emit = defineEmits([
    'song-play',
    'song-contextmenu',
    'artist-click',
    'album-click',
    'playlist-click',
    'mv-click',
    'program-click'
]);

const router = useRouter();
const searchTypeMap = {
    song: 'song',
    mv: 'mv',
    author: 'author',
    album: 'album',
    collect: 'special'
};

const getSection = (type) => {
    const list = props.data?.lists;
    if (!Array.isArray(list)) return null;

    const section = list.find((item) => item?.type === type);
    if (!section || !Array.isArray(section.lists) || section.lists.length === 0) {
        return null;
    }

    return section;
};

const songSection = computed(() => getSection('song'));
const artistSection = computed(() => getSection('author'));
const albumSection = computed(() => getSection('album'));
const playlistSection = computed(() => getSection('collect'));
const mvSection = computed(() => getSection('mv'));
const programSection = computed(() => getSection('program'));
const musicPhotoSection = computed(() => getSection('musicphoto'));

const visibleSectionCount = computed(() => {
    return [
        songSection.value,
        artistSection.value,
        albumSection.value,
        playlistSection.value,
        mvSection.value,
        programSection.value,
        musicPhotoSection.value
    ].filter(Boolean).length;
});

const getImage = (url, size) => {
    if (!url) return './assets/images/ico.png';
    return url.replace('{size}', size);
};

const getSingerNames = (singers = []) => {
    if (!Array.isArray(singers)) return '';
    return singers.map((item) => item.name).filter(Boolean).join('、');
};

const formatDate = (value) => {
    if (!value) return '';
    return String(value).split(' ')[0];
};

const formatCount = (value) => {
    const count = Number(value) || 0;
    if (count < 10000) return String(count);
    if (count < 100000000) return `${(count / 10000).toFixed(1)}万`;
    return `${(count / 100000000).toFixed(1)}亿`;
};

const goToSearch = (type) => {
    const targetType = searchTypeMap[type] || type;
    router.push({
        path: '/search',
        query: {
            q: props.keyword,
            type: targetType
        }
    });
};

const handleSongContextMenu = (event, song) => {
    emit('song-contextmenu', event, song);
};
</script>

<style lang="scss" scoped>
.complex-search-results {
    display: grid;
    gap: 24px;
}

.complex-section {
    display: grid;
    gap: 16px;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h3 {
        margin: 0;
        font-size: 20px;
        color: #333;
    }
}

.section-link {
    padding: 0;
    border: none;
    background: none;
    color: #999;
    font-size: 13px;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
        color: var(--primary-color);
    }
}

.complex-empty {
    padding: 40px 0;
    text-align: center;
    font-size: 14px;
    color: #999;
}

.mv-grid,
.program-grid,
.article-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 18px;
}

.media-card,
.program-card,
.article-card {
    background-color: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.media-card,
.program-card {
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
    }
}

.media-cover,
.program-cover,
.article-cover {
    width: 100%;
    object-fit: cover;
}

.media-cover {
    position: relative;
    aspect-ratio: 16 / 9;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.media-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 4px 8px;
    border-radius: 999px;
    background-color: rgba(0, 0, 0, 0.65);
    color: #fff;
    font-size: 12px;
}

.media-info,
.program-info,
.article-info {
    padding: 14px;

    h4 {
        margin: 0;
        font-size: 16px;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.media-info p,
.program-title {
    margin: 8px 0 0;
    font-size: 14px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.media-meta,
.program-meta,
.article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;

    span {
        padding: 4px 8px;
        border-radius: 999px;
        background-color: #f5f5f5;
        color: #666;
        font-size: 12px;
    }
}

.program-cover,
.article-cover {
    aspect-ratio: 1 / 1;
}

.article-author {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    color: #666;
    font-size: 14px;
}

.author-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
}

@media (max-width: 768px) {
    .result-meta {
        min-width: 88px;
        padding-right: 0;
    }

    .mv-grid,
    .program-grid,
    .article-grid {
        grid-template-columns: 1fr;
    }
}
</style>
