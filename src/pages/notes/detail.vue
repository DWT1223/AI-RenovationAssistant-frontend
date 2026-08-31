<template>
  <view class="detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-state">
      <text>{{ error }}</text>
      <view class="retry-btn" @click="loadDetail">重新加载</view>
    </view>

    <!-- 笔记内容 -->
    <view v-else-if="note" class="note-detail">
      <!-- 用户信息 -->
      <view class="note-header">
        <image v-if="note.user_avatar" :src="note.user_avatar" class="avatar" mode="aspectFill"></image>
        <view v-else class="avatar avatar-default">{{ note.user_nickname?.charAt(0) || 'U' }}</view>
        <view class="user-info">
          <text class="nickname">{{ note.user_nickname || '匿名用户' }}</text>
          <text class="time">{{ formatDate(note.created_at) }}</text>
        </view>
      </view>

      <!-- 标签 -->
      <view class="tags" v-if="note.category || note.stage">
        <text class="tag" v-if="note.category">{{ note.category }}</text>
        <text class="tag tag-stage" v-if="note.stage">{{ note.stage }}</text>
      </view>

      <!-- 标题 -->
      <text class="title">{{ note.title }}</text>

      <!-- 内容 -->
      <text class="content">{{ note.content }}</text>

      <!-- 图片 -->
      <view class="images" v-if="images.length > 0">
        <image
          v-for="(img, index) in images"
          :key="index"
          :src="img"
          class="note-image"
          mode="widthFix"
          @click="previewImage(index)"
        ></image>
      </view>

      <!-- 底部操作栏 -->
      <view class="action-bar">
        <view class="action-item" @click="toggleLike">
          <text class="icon">{{ liked ? '❤️' : '🤍' }}</text>
          <text>{{ likeCount }}</text>
        </view>
        <view class="action-item" @click="toggleFavorite">
          <text class="icon">{{ favorited ? '⭐' : '☆' }}</text>
          <text>{{ favoriteCount }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getNoteDetail, likeNote } from '../../api/note'
import { createCollect, deleteCollect } from '../../api/collect'
import { formatDate } from '../../utils/format'

export default {
  data() {
    return {
      noteId: null,
      note: null,
      loading: true,
      collectId: null,
      error: null,
      liked: false,
      favorited: false,
      likeCount: 0,
      favoriteCount: 0
    }
  },
  computed: {
    images() {
      if (!this.note?.images) return []
      try {
        return JSON.parse(this.note.images)
      } catch {
        return []
      }
    }
  },
  onLoad(options) {
    this.noteId = options.id
    if (this.noteId) {
      this.loadDetail()
    } else {
      this.error = '笔记不存在'
      this.loading = false
    }
  },
  methods: {
    formatDate,
    async loadDetail() {
      this.loading = true
      this.error = null

      try {
        const res = await getNoteDetail(this.noteId)
        if (res) {
          this.note = res
          this.likeCount = res.like_count || 0
          this.favoriteCount = res.favorite_count || 0
          this.liked = res.is_liked || false
          this.favorited = res.is_favorited || false
          this.collectId = res.collect_id || null
        } else {
          this.error = '笔记不存在'
        }
      } catch (e) {
        console.error('加载笔记详情失败', e)
        this.error = '加载失败，请重试'
      } finally {
        this.loading = false
      }
    },
    async toggleLike() {
      if (!this.liked) {
        try {
          await likeNote(this.noteId)
          this.liked = true
          this.likeCount++
        } catch (e) {
          console.error('点赞失败', e)
          if (e.message?.includes('登录')) {
            uni.showToast({ title: '请先登录', icon: 'none' })
          } else {
            uni.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    },
    toggleFavorite() {
      if (this.favorited) {
        // 取消收藏
        this.handleUnfavorite()
      } else {
        // 添加收藏
        this.handleFavorite()
      }
    },
    async handleFavorite() {
      try {
        const res = await createCollect({
          target_type: 'note',
          target_id: this.noteId
        })
        this.favorited = true
        this.favoriteCount++
        if (res && res.id) {
          this.collectId = res.id
        }
        uni.showToast({ title: '已收藏', icon: 'success' })
      } catch (e) {
        console.error('收藏失败', e)
        if (e.message?.includes('已收藏')) {
          this.favorited = true
        } else if (e.message?.includes('登录')) {
          uni.showToast({ title: '请先登录', icon: 'none' })
        } else {
          uni.showToast({ title: '收藏失败', icon: 'none' })
        }
      }
    },
    async handleUnfavorite() {
      if (!this.collectId) return
      try {
        await deleteCollect(this.collectId)
        this.favorited = false
        this.favoriteCount--
        this.collectId = null
        uni.showToast({ title: '已取消收藏', icon: 'success' })
      } catch (e) {
        console.error('取消收藏失败', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    previewImage(current) {
      uni.previewImage({
        current,
        urls: this.images
      })
    }
  }
}
</script>

<style scoped>
.detail-page {

  background: #fff;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  color: #909399;
}

.retry-btn {
  margin-top: 30rpx;
  padding: 16rpx 40rpx;
  background: #2979ff;
  color: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.note-detail {
  padding: 30rpx;
  padding-bottom: 150rpx;
  padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
}

.note-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.avatar-default {
  background: #2979ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 30rpx;
  color: #303133;
  font-weight: 500;
}

.time {
  font-size: 24rpx;
  color: #909399;
  margin-top: 4rpx;
}

.tags {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.tag {
  padding: 8rpx 20rpx;
  background: #f0f2f5;
  color: #606266;
  border-radius: 6rpx;
  font-size: 24rpx;
}

.tag-stage {
  background: #ecf5ff;
  color: #2979ff;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #303133;
  display: block;
  margin-bottom: 24rpx;
}

.content {
  font-size: 30rpx;
  color: #606266;
  line-height: 1.8;
  display: block;
  margin-bottom: 30rpx;
}

.images {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 30rpx;
}

.note-image {
  width: 100%;
  border-radius: 12rpx;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 30rpx;
  color: #606266;
  font-size: 28rpx;
}

.action-item .icon {
  font-size: 36rpx;
}
</style>
