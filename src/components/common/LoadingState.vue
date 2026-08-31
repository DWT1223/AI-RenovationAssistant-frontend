<template>
  <view class="loading-state" v-if="show">
    <view class="loading-content">
      <view class="loading-spinner">
        <view class="spinner-ring"></view>
      </view>
      <text class="loading-text">{{ text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'LoadingState',
  props: {
    show: {
      type: Boolean,
      default: true
    },
    text: {
      type: String,
      default: '加载中...'
    }
  }
}
</script>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  width: 100%;
  height: 100%;
  border: 4rpx solid #E5E7EB;
  border-top-color: #6366F1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #9CA3AF;
}
</style>
