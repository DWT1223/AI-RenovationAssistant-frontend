<template>
  <view class="style-card" @click="handleClick">
    <image :src="style.cover || '/static/placeholder.png'" class="cover" mode="aspectFill"></image>
    <view class="card-overlay">
      <text class="style-emoji">{{ getStyleEmoji() }}</text>
    </view>
    <view class="info">
      <text class="name">{{ style.name }}</text>
      <text class="desc" v-if="style.description">{{ truncateText(style.description, 30) }}</text>
    </view>
    <view class="action" @click.stop="handleCollect">
      <view class="collect-btn" :class="{ collected: isCollected }">
        <text class="collect-icon">{{ isCollected ? '❤️' : '🤍' }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { truncateText } from '../../utils/format'

export default {
  name: 'StyleCard',
  props: {
    style: {
      type: Object,
      required: true
    },
    isCollected: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    truncateText,
    getStyleEmoji() {
      const emojis = {
        '现代简约': '🏢',
        '奶油风': '🍰',
        '轻奢': '✨',
        '原木风': '🪵',
        '北欧风': '❄️',
        '日式': '⛩️',
        '美式': '🏠',
        '极简': '⬜',
        '新中式': '🏯',
        'ins风': '📸'
      }
      return emojis[this.style.name] || '🏠'
    },
    handleClick() {
      this.$emit('click', this.style)
    },
    handleCollect() {
      this.$emit('collect', this.style)
    }
  }
}
</script>

<style scoped>
.style-card {
  position: relative;
  border-radius: 32rpx;
  overflow: hidden;
  background: #fff;
  margin-bottom: 24rpx;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #F3F4F6;
}

.cover {
  width: 100%;
  height: 400rpx;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200rpx;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 24rpx;
}

.style-emoji {
  font-size: 48rpx;
  opacity: 0.9;
}

.info {
  padding: 24rpx;
}

.name {
  font-size: 32rpx;
  font-weight: bold;
  color: #1F2937;
  display: block;
  margin-bottom: 8rpx;
}

.desc {
  font-size: 26rpx;
  color: #6B7280;
  line-height: 1.5;
  display: block;
}

.action {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
}

.collect-btn {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.collect-icon {
  font-size: 32rpx;
}

.collect-btn.collected {
  background: rgba(239, 68, 68, 0.1);
}
</style>
