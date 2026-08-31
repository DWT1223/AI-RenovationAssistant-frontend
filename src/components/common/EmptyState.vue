<template>
  <view class="empty-state">
    <image v-if="image" :src="image" mode="aspectFit" class="empty-image"></image>
    <view v-else class="empty-icon-wrapper">
      <view class="empty-icon">📭</view>
    </view>
    <text class="empty-text">{{ text }}</text>
    <view v-if="showButton" class="empty-btn" @click="handleClick">
      {{ buttonText }}
    </view>
  </view>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    text: {
      type: String,
      default: '暂无数据'
    },
    image: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: '去操作'
    },
    showButton: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClick() {
      this.$emit('click')
    }
  }
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  color: #9CA3AF;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 32rpx;
}

.empty-icon-wrapper {
  width: 200rpx;
  height: 200rpx;
  background: #F3F4F6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.empty-icon {
  font-size: 100rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 28rpx;
  color: #9CA3AF;
  margin-bottom: 32rpx;
}

.empty-btn {
  padding: 20rpx 48rpx;
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
  color: #fff;
  border-radius: 9999rpx;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(99, 102, 241, 0.3);
}
</style>
