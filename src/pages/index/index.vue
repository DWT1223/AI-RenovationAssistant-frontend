<template>
  <view class="index-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="搜索装修风格、笔记、效果图..." v-model="keyword" @confirm="handleSearch" />
      </view>
    </view>

    <!-- 功能入口区 -->
    <view class="nav-grid">
      <view class="nav-item" @click="goTo('/pages/ai/plan')">
        <view class="nav-icon ai-gradient">🤖</view>
        <text class="nav-text">AI方案</text>
      </view>
      <view class="nav-item" @click="goTo('/pages/ai/render')">
        <view class="nav-icon render-gradient">🎨</view>
        <text class="nav-text">效果图</text>
      </view>
      <view class="nav-item" @click="goTo('/pages/style/list')">
        <view class="nav-icon style-gradient">🏠</view>
        <text class="nav-text">风格库</text>
      </view>
      <view class="nav-item" @click="goTo('/pages/bills/add')">
        <view class="nav-icon bill-gradient">💰</view>
        <text class="nav-text">记一笔</text>
      </view>
    </view>

    <!-- 快捷操作区 -->
    <view class="quick-section">
      <view class="quick-row">
        <view class="quick-card" @click="goTo('/pages/notes/publish')">
          <view class="quick-icon yellow-gradient">📝</view>
          <view class="quick-info">
            <text class="quick-title">发布笔记</text>
            <text class="quick-desc">分享你的装修经验</text>
          </view>
        </view>
        <view class="quick-card" @click="goTo('/pages/house/index')">
          <view class="quick-icon blue-gradient">📐</view>
          <view class="quick-info">
            <text class="quick-title">户型图</text>
            <text class="quick-desc">上传和管理户型图</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 热门风格 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">热门风格</text>
      </view>
      <scroll-view scroll-x class="style-scroll">
        <view class="style-item" v-for="item in hotStyles" :key="item.id" @click="goToStyleDetail(item)">
          <view class="style-cover" :style="getStyleBg(item)">
            <text class="style-emoji">{{ getStyleEmoji(item) }}</text>
          </view>
          <text class="style-name">{{ item.name }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 最新笔记 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">最新笔记</text>
      </view>
      <view class="notes-list">
        <NoteCard v-for="note in latestNotes" :key="note.id" :note="note" @note-click="goToNoteDetail" />
        <EmptyState v-if="latestNotes.length === 0" text="暂无笔记" />
      </view>
    </view>

    <!-- 底部TabBar占位 -->
    <view class="tabbar-placeholder"></view>
  </view>
</template>

<script>
import NoteCard from '../../components/note/NoteCard.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import { getAllStyles } from '../../api/style'
import { getNotes } from '../../api/note'

export default {
  components: { NoteCard, EmptyState },
  data() {
    return {
      keyword: '',
      hotStyles: [],
      latestNotes: []
    }
  },
  onLoad() {
    this.loadData()
  },
  onShow() {
    if (this.hotStyles.length > 0) {
      this.loadLatestNotes()
    }
  },
  methods: {
    async loadData() {
      await Promise.all([
        this.loadHotStyles(),
        this.loadLatestNotes()
      ])
    },
    async loadHotStyles() {
      try {
        const res = await getAllStyles()
        this.hotStyles = res?.slice(0, 6) || []
      } catch (e) {
        console.error('加载风格失败', e)
      }
    },
    async loadLatestNotes() {
      try {
        const res = await getNotes({ page: 1, page_size: 3, my_notes: false })
        this.latestNotes = res?.items || []
      } catch (e) {
        console.error('加载笔记失败', e)
      }
    },
    handleSearch() {
      uni.showToast({ title: '搜索功能开发中', icon: 'none' })
    },
    goTo(url) {
      uni.navigateTo({ url })
    },
    goToStyleDetail(style) {
      uni.navigateTo({ url: `/pages/style/detail?id=${style.id}` })
    },
    goToNoteDetail(note) {
      uni.navigateTo({ url: `/pages/notes/detail?id=${note.id}` })
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
        'linear-gradient(180deg, #EC4899 0%, #F472B6 100%)',
        'linear-gradient(180deg, #0EA5E9 0%, #38BDF8 100%)',
        'linear-gradient(180deg, #10B981 0%, #34D399 100%)',
        'linear-gradient(180deg, #F59E0B 0%, #FBBF24 100%)',
        'linear-gradient(180deg, #8B5CF6 0%, #A78BFA 100%)',
        'linear-gradient(180deg, #EC4899 0%, #F472B6 100%)',
        'linear-gradient(180deg, #06B6D4 0%, #22D3EE 100%)',
        'linear-gradient(180deg, #F97316 0%, #FB923C 100%)'
      ]
      const index = (style.id || 0) % colors.length
      return { background: colors[index] }
    }
  }
}
</script>

<style scoped>
.index-page {

  background: #F5F6FA;
}

/* 搜索栏 */
.search-bar {
  padding: 20rpx 32rpx;
  background: #fff;
}

.search-input {
  display: flex;
  align-items: center;
  background: #F2F3F7;
  border-radius: 9999rpx;
  padding: 0 32rpx;
  height: 88rpx;
}

.search-icon {
  font-size: 36rpx;
  color: #9CA3AF;
}

.search-input input {
  flex: 1;
  font-size: 28rpx;
  color: #374151;
  margin-left: 16rpx;
}

/* 功能入口区 */
.nav-grid {
  display: flex;
  justify-content: space-between;
  padding: 32rpx 56rpx;
  background: #fff;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.nav-icon {
  width: 112rpx;
  height: 112rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
  color: #fff;
  box-shadow: 0 4rpx 6px rgba(0, 0, 0, 0.1), 0 10rpx 15px rgba(0, 0, 0, 0.1);
}

.ai-gradient {
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
}

.render-gradient {
  background: linear-gradient(180deg, #EC4899 0%, #F472B6 100%);
}

.style-gradient {
  background: linear-gradient(180deg, #0EA5E9 0%, #38BDF8 100%);
}

.bill-gradient {
  background: linear-gradient(180deg, #10B981 0%, #34D399 100%);
}

.nav-text {
  font-size: 24rpx;
  color: #374151;
  font-weight: 500;
}

/* 快捷操作区 */
.quick-section {
    margin-top: 20rpx;
  padding: 0 48rpx 32rpx;
}

.quick-row {
  display: flex;
  gap: 24rpx;
}

.quick-card {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #F3F4F6;
}

.quick-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 24rpx;
}

.yellow-gradient {
  background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);
  color: #F59E0B;
}

.blue-gradient {
  background: linear-gradient(180deg, #DBEAFE 0%, #BFDBFE 100%);
  color: #3B82F6;
}

.quick-info {
  display: flex;
  flex-direction: column;
}

.quick-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1F2937;
}

.quick-desc {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 4rpx;
}

/* 区块样式 */
.section {
  padding: 0 48rpx 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #111827;
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.more-text {
  font-size: 26rpx;
  color: #6B7280;
}

.arrow-icon {
  font-size: 32rpx;
  color: #6B7280;
}

/* 风格横向滚动 */
.style-scroll {
  white-space: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.style-scroll::-webkit-scrollbar {
  display: none;
}

.style-item {
  display: inline-block;
  width: 280rpx;
  margin-right: 24rpx;
}

.style-cover {
  width: 280rpx;
  height: 320rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1), 0 4rpx 6rpx rgba(0, 0, 0, 0.1);
}

.style-emoji {
  font-size: 112rpx;
  opacity: 0.9;
}

.style-name {
  display: block;
  text-align: center;
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
  margin-top: 16rpx;
}

.notes-list {
  display: flex;
  flex-direction: column;
}

.tabbar-placeholder {
  height: 120rpx;
}
</style>
