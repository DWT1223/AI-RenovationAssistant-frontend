<template>
  <view class="collect-page">
    <!-- 标签栏 -->
    <StickyTab
      v-model="currentTab"
      :tabs="tabs"
      @change="onTabChange"
      @click="onTabClick"
    />

    <!-- 收藏列表 -->
    <scroll-view scroll-y class="collect-list" @scrolltolower="loadMore">
      <view class="list-content">
        <!-- 笔记收藏 -->
        <view v-if="currentTab === 'note'">
          <template v-for="item in getNoteCollects()" :key="item.id">
            <view class="note-card" @click="goToNoteDetail(item.target_data)">
              <view class="note-header">
                <image v-if="item.target_data.user_avatar" :src="item.target_data.user_avatar" class="avatar" mode="aspectFill"></image>
                <view v-else class="avatar avatar-default">{{ getInitial(item.target_data.user_nickname) }}</view>
                <view class="user-info">
                  <text class="nickname">{{ item.target_data.user_nickname || '匿名用户' }}</text>
                  <text class="time">{{ formatTime(item.target_data.created_at) }}</text>
                </view>
              </view>
              <view class="note-content">
                <text class="title">{{ item.target_data.title }}</text>
                <text class="desc" v-if="item.target_data.content">{{ truncateText(item.target_data.content, 80) }}</text>
              </view>
              <view class="note-images" v-if="getImages(item.target_data).length > 0">
                <image
                  v-for="(img, index) in getImages(item.target_data).slice(0, 3)"
                  :key="index"
                  :src="img"
                  class="note-image"
                  mode="aspectFill"
                ></image>
              </view>
              <view class="note-footer">
                <view class="tags" v-if="item.target_data.category || item.target_data.stage">
                  <text class="tag" v-if="item.target_data.category">{{ item.target_data.category }}</text>
                  <text class="tag tag-stage" v-if="item.target_data.stage">{{ item.target_data.stage }}</text>
                </view>
                <view class="actions">
                  <view class="action">
                    <text class="icon">👍</text>
                    <text>{{ item.target_data.like_count || 0 }}</text>
                  </view>
                </view>
              </view>
            </view>
          </template>
          <EmptyState v-if="getNoteCollects().length === 0 && !loading" text="暂无收藏的笔记" />
        </view>

        <!-- 风格收藏 -->
        <view v-else-if="currentTab === 'style'">
          <template v-for="item in getStyleCollects()" :key="item.id">
            <view class="style-card" @click="goToStyleDetail(item)">
              <view class="style-cover-wrapper" :style="getStyleBg(item.target_data)">
                <text class="style-emoji">{{ getStyleEmoji(item.target_data) }}</text>
              </view>
              <view class="style-info">
                <text class="style-name">{{ item.target_data.name || '未知风格' }}</text>
                <text class="style-desc">{{ item.target_data.description || '暂无描述' }}</text>
              </view>
            </view>
          </template>
          <EmptyState v-if="getStyleCollects().length === 0 && !loading" text="暂无收藏的风格" />
        </view>

        <LoadingState v-if="loading && collects.length === 0" />
      </view>
    </scroll-view>
  </view>
</template>

<script>
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingState from '../../components/common/LoadingState.vue'
import StickyTab from '../../components/common/StickyTab.vue'
import { getCollects } from '../../api/collect'

export default {
  components: { EmptyState, LoadingState, StickyTab },
  data() {
    return {
      tabs: [
        { label: '笔记', value: 'note' },
        { label: '风格', value: 'style' }
      ],
      currentTab: 'note',
      collects: [],
      page: 1,
      pageSize: 20,
      hasMore: true,
      loading: false
    }
  },
  onLoad() {
    this.loadCollects()
  },
  onShow() {
    this.refreshCollects()
  },
  methods: {
    getNoteCollects() {
      return this.collects.filter(item => item.target_type === 'note' && item.target_data)
    },
    getStyleCollects() {
      return this.collects.filter(item => item.target_type === 'style' && item.target_data)
    },
    getImages(note) {
      if (!note || !note.images) return []
      try {
        return typeof note.images === 'string' ? JSON.parse(note.images) : note.images
      } catch {
        return []
      }
    },
    getInitial(name) {
      if (!name) return 'U'
      return name.charAt(0).toUpperCase()
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      if (days > 30) {
        return date.toLocaleDateString('zh-CN')
      } else if (days > 0) {
        return `${days}天前`
      }
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours > 0) return `${hours}小时前`
      const minutes = Math.floor(diff / (1000 * 60))
      if (minutes > 0) return `${minutes}分钟前`
      return '刚刚'
    },
    truncateText(text, length) {
      if (!text || text.length <= length) return text
      return text.substring(0, length) + '...'
    },
    getStyleEmoji(style) {
      const emojis = {
        '现代简约': '🏢', '奶油风': '🍰', '轻奢': '✨', '原木风': '🪵',
        '北欧风': '❄️', '日式': '⛩️', '美式': '🏠', '极简': '⬜',
        '新中式': '🏯', 'ins风': '📸'
      }
      return emojis[style?.name] || '🏠'
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
      const index = (style?.id || 0) % colors.length
      return { background: colors[index] }
    },
    async loadCollects() {
      if (this.loading) return
      this.loading = true

      try {
        const res = await getCollects({
          page: this.page,
          page_size: this.pageSize,
          target_type: this.currentTab
        })
        const items = res?.items || []

        if (this.page === 1) {
          this.collects = items
        } else {
          this.collects = [...this.collects, ...items]
        }

        this.hasMore = items.length >= this.pageSize
      } catch (e) {
        console.error('加载收藏失败', e)
      } finally {
        this.loading = false
      }
    },
    refreshCollects() {
      this.page = 1
      this.collects = []
      this.loadCollects()
    },
    loadMore() {
      if (!this.hasMore || this.loading) return
      this.page++
      this.loadCollects()
    },
    changeTab(tab) {
      this.page = 1
      this.collects = []
      this.hasMore = true
      this.loadCollects()
    },
    onTabChange(tab) {
      this.changeTab(tab)
    },
    onTabClick(tab) {
      this.changeTab(tab)
    },
    goToNoteDetail(note) {
      uni.navigateTo({ url: `/pages/notes/detail?id=${note.id}` })
    },
    goToStyleDetail(item) {
      uni.navigateTo({ url: `/pages/style/detail?id=${item.target_data.id}` })
    }
  }
}
</script>

<style scoped>
.collect-page {

  background: #f8f8f8;
}

.collect-list {
  min-height: calc(100vh);
  margin-top: 100rpx;
}

.list-content {
  padding: 20rpx;
}

/* 笔记卡片样式 */
.note-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.note-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.avatar-default {
  background: #2979ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.user-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.nickname {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
}

.time {
  font-size: 24rpx;
  color: #909399;
  margin-top: 4rpx;
}

.note-content {
  margin-bottom: 20rpx;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
  display: block;
  margin-bottom: 10rpx;
  word-break: break-all;
  word-wrap: break-word;
}

.desc {
  font-size: 28rpx;
  color: #606266;
  display: block;
  line-height: 1.5;
  word-break: break-all;
  word-wrap: break-word;
}

.note-images {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.note-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags {
  display: flex;
  gap: 16rpx;
}

.tag {
  padding: 6rpx 16rpx;
  background: #f0f2f5;
  color: #606266;
  border-radius: 4rpx;
  font-size: 24rpx;
}

.tag-stage {
  background: #ecf5ff;
  color: #2979ff;
}

.actions {
  display: flex;
  gap: 30rpx;
}

.action {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #909399;
  font-size: 26rpx;
}

.icon {
  font-size: 28rpx;
}

/* 风格卡片样式 */
.style-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.style-cover-wrapper {
  width: 160rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.style-cover-placeholder {
  width: 160rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
}

.style-emoji {
  font-size: 60rpx;
}

.style-info {
  flex: 1;
  min-width: 0;
}

.style-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10rpx;
  display: block;
}

.style-desc {
  font-size: 26rpx;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
