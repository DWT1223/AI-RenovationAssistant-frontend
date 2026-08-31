<template>
  <view class="style-list-page">
    <view class="style-grid">
      <view class="style-item" v-for="item in styles" :key="item.id" @click="goToDetail(item)">
        <view class="style-cover" :style="getStyleBg(item)">
          <text class="style-emoji">{{ getStyleEmoji(item) }}</text>
        </view>
        <view class="style-info">
          <text class="style-name">{{ item.name }}</text>
          <text class="style-desc">{{ item.description }}</text>
        </view>
      </view>
    </view>
    <EmptyState v-if="styles.length === 0 && !loading" text="暂无收藏的风格" />
    <LoadingState v-if="loading" />
  </view>
</template>

<script>
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingState from '../../components/common/LoadingState.vue'
import { getCollects } from '../../api/collect'

export default {
  components: { EmptyState, LoadingState },
  data() {
    return {
      styles: [],
      loading: false
    }
  },
  onLoad() {
    this.loadStyles()
  },
  onShow() {
    this.loadStyles()
  },
  methods: {
    async loadStyles() {
      this.loading = true
      try {
        const res = await getCollects({
          target_type: 'style'
        })
        const items = res?.items || []
        // 提取 target_data
        this.styles = items
          .filter(item => item.target_data)
          .map(item => item.target_data)
      } catch (e) {
        console.error('加载风格失败', e)
      } finally {
        this.loading = false
      }
    },
    goToDetail(style) {
      uni.navigateTo({ url: `/pages/style/detail?id=${style.id}` })
    },
    getStyleEmoji(style) {
      const emojis = {
        '现代简约': '🏢', '奶油风': '🍰', '轻奢': '✨', '原木风': '🪵',
        '北欧风': '❄️', '日式': '⛩️', '美式': '🏠', '极简': '⬜',
        '新中式': '🏯', 'ins风': '📸'
      }
      return emojis[style.name] || '🏠'
    },
    getStyleBg(style) {
      const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
      ]
      const index = (style.id || 0) % colors.length
      return { background: colors[index] }
    }
  }
}
</script>

<style scoped>
.style-list-page {

  background: #f8f8f8;
  padding: 20rpx;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.style-item {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.style-cover {
  width: 100%;
  height: 280rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.style-emoji {
  font-size: 100rpx;
}

.style-info {
  padding: 20rpx;
}

.style-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #303133;
  display: block;
  margin-bottom: 10rpx;
}

.style-desc {
  font-size: 24rpx;
  color: #909399;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
