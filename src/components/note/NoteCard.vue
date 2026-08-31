<template>
  <view class="note-card">
    <!-- 用户信息行 -->
    <view class="note-header">
      <view class="avatar-wrapper">
        <image v-if="note.user_avatar" :src="note.user_avatar" class="avatar" mode="aspectFill"></image>
        <view v-else class="avatar avatar-default" :style="getAvatarGradient()">
          <text class="avatar-text">{{ note.user_nickname?.charAt(0) || 'U' }}</text>
        </view>
      </view>
      <view class="user-info">
        <text class="nickname">{{ note.user_nickname || '匿名用户' }}</text>
        <text class="time">{{ formatRelativeTime(note.created_at) }}</text>
      </view>
      <!-- 操作按钮 -->
      <view class="card-actions" v-if="showActions">
        <text class="action-btn edit" v-if="isOwner" @click.stop="handleEdit">编辑</text>
        <text class="action-btn delete" v-if="isOwner" @click.stop="handleDelete">删除</text>
      </view>
    </view>

    <!-- 笔记内容 -->
    <view class="note-content" @click="handleClick">
      <text class="title">{{ note.title }}</text>
      <text class="desc" v-if="note.content">{{ truncateText(note.content, 100) }}</text>
    </view>

    <!-- 笔记图片 -->
    <view class="note-images" v-if="images.length > 0" @click="handleClick">
      <image
        v-for="(img, index) in images.slice(0, 3)"
        :key="index"
        :src="img"
        class="note-image"
        mode="aspectFill"
      ></image>
    </view>

    <!-- 底部标签和互动 -->
    <view class="note-footer">
      <view class="tags" v-if="note.category || note.stage">
        <text class="tag tag-category" v-if="note.category">{{ note.category }}</text>
        <text class="tag tag-stage" v-if="note.stage">{{ note.stage }}</text>
      </view>
      <view class="actions">
        <view class="action">
          <text class="action-icon">👍</text>
          <text>{{ note.like_count || 0 }}</text>
        </view>
        <view class="action">
          <text class="action-icon">⭐</text>
          <text>{{ note.favorite_count || 0 }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatRelativeTime, truncateText } from '../../utils/format'

export default {
  name: 'NoteCard',
  props: {
    note: {
      type: Object,
      required: true
    },
    showActions: {
      type: Boolean,
      default: false
    },
    isOwner: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    images() {
      if (!this.note.images) return []
      try {
        return JSON.parse(this.note.images)
      } catch {
        return []
      }
    }
  },
  methods: {
    formatRelativeTime,
    truncateText,
    getAvatarGradient() {
      const gradients = [
        'linear-gradient(180deg, #6366F1 0%, #818CF8 100%)',
        'linear-gradient(180deg, #EC4899 0%, #F472B6 100%)',
        'linear-gradient(180deg, #10B981 0%, #34D399 100%)',
        'linear-gradient(180deg, #F59E0B 0%, #FBBF24 100%)',
        'linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%)'
      ]
      const index = (this.note.user_nickname?.charCodeAt(0) || 0) % gradients.length
      return { background: gradients[index] }
    },
    handleClick() {
      this.$emit('note-click', this.note)
    },
    handleEdit() {
      this.$emit('edit', this.note)
    },
    handleDelete() {
      this.$emit('delete', this.note)
    }
  }
}
</script>

<style scoped>
.note-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #F3F4F6;
}

/* 用户信息行 */
.note-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  position: relative;
}

.avatar-wrapper {
  margin-right: 24rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar-default {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
}

.user-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.nickname {
  font-size: 28rpx;
  color: #1F2937;
  font-weight: 600;
}

.time {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 4rpx;
}

/* 操作按钮 */
.card-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.action-btn.edit {
  color: #6366F1;
  background: rgba(99, 102, 241, 0.1);
}

.action-btn.delete {
  color: #EF4444;
  background: rgba(239, 68, 68, 0.1);
}

/* 笔记内容 */
.note-content {
  margin-bottom: 24rpx;
}

.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #111827;
  display: block;
  margin-bottom: 12rpx;
  word-break: break-all;
  word-wrap: break-word;
  line-height: 1.4;
}

.desc {
  font-size: 28rpx;
  color: #6B7280;
  display: block;
  line-height: 1.6;
  word-break: break-all;
  word-wrap: break-word;
}

/* 笔记图片 */
.note-images {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.note-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 24rpx;
}

/* 底部标签和互动 */
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
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
}

.tag-category {
  background: #F3F4F6;
  color: #6B7280;
}

.tag-stage {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.actions {
  display: flex;
  gap: 32rpx;
}

.action {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #9CA3AF;
  font-size: 26rpx;
}

.action-icon {
  font-size: 32rpx;
}
</style>
