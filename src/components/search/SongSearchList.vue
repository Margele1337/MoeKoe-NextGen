<template>
  <ul class="song-list">
    <li v-for="(song, index) in songs" :key="index" class="result-item" @click="emit('song-click', song)"
      @contextmenu.prevent="emit('song-contextmenu', $event, song)">
      <img :src="$getCover(song.Image, 100)" alt="Cover" />
      <div class="result-info">
        <p class="result-name">
          <span class="result-name-text">{{ song.OriSongName || song.SongName }}</span>
          <span v-if="Number(song?.IsOriginal) === 1" class="original-tag">原唱</span>
        </p>
        <p class="result-type">{{ song.SingerName }}</p>
      </div>
      <div class="result-meta">
        <div class="meta-column">
          <p class="result-duration">{{ $formatMilliseconds(song.Duration) }}</p>
          <p class="result-publish-date">{{ song.PublishDate || song.PublishTime }}</p>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup>
const props = defineProps({
  songs: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['song-click', 'song-contextmenu']);
</script>

<style lang="scss" scoped>
.song-list {
  --search-result-text: var(--text-color);
  --search-result-secondary: #666;
  --search-result-meta: #888;
  --search-result-meta-muted: #999;

  &:is(.dark .song-list) {
    --search-result-text: rgba(255, 255, 255, 0.86);
    --search-result-secondary: rgba(255, 255, 255, 0.62);
    --search-result-meta: rgba(255, 255, 255, 0.56);
    --search-result-meta-muted: rgba(255, 255, 255, 0.42);
  }
}

.song-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
  cursor: pointer;
  border-radius: 5px;
  gap: 10px;

  &:hover {
    background-color: #f5f5f5;
  }

  img {
    width: 50px;
    height: 50px;
    border-radius: 5px;
    margin-right: 10px;
  }
}

.result-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.result-meta {
  display: flex;
  margin-left: auto;
  min-width: 120px;
  justify-content: flex-end;
  padding-right: 20px;
}

.meta-column {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.result-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
  height: 23px;
  margin: 0;
  max-width: 900px;
  min-width: 0;
}

.result-name-text {
  color: var(--search-result-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.original-tag {
  flex-shrink: 0;
  padding: 0 4px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 14px;
  color: #fff;
  background-color: var(--primary-color);
}

.result-duration,
.result-publish-date {
  font-size: 14px;
  color: var(--search-result-meta);
  margin: 0;
  white-space: nowrap;
}

.result-duration {
  color: var(--search-result-secondary);
}

.result-publish-date {
  font-size: 12px;
  color: var(--search-result-meta-muted);
}

.result-type {
  font-size: 14px;
  color: var(--search-result-secondary);
  margin: 6px 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
