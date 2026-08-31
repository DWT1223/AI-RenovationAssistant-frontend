<template>
  <view class="ai-page">
    <!-- 头部 -->
    <view class="header">
      <view class="title">AI智能装修助手</view>
      <view class="subtitle">输入你的需求，AI帮你生成专属装修方案</view>
    </view>

    <!-- 功能入口 -->
    <view class="feature-grid">
      <view class="feature-card" @click="goToPlan">
        <view class="feature-icon">🤖</view>
        <view class="feature-info">
          <text class="feature-title">AI装修方案</text>
          <text class="feature-desc">输入户型、面积、风格等，生成完整装修方案</text>
        </view>
        <text class="arrow">&gt;</text>
      </view>

      <view class="feature-card" @click="goToRender">
        <view class="feature-icon">🎨</view>
        <view class="feature-info">
          <text class="feature-title">AI效果图</text>
          <text class="feature-desc">上传户型图，生成装修效果图</text>
        </view>
        <text class="arrow">&gt;</text>
      </view>
    </view>

    <!-- 使用流程 -->
    <view class="section">
      <view class="section-title">使用流程</view>
      <view class="steps">
        <view class="step">
          <view class="step-num">1</view>
          <view class="step-info">
            <text class="step-title">选择风格</text>
            <text class="step-desc">浏览并收藏喜欢的装修风格</text>
          </view>
        </view>
        <view class="step">
          <view class="step-num">2</view>
          <view class="step-info">
            <text class="step-title">填写需求</text>
            <text class="step-desc">输入户型、面积、预算等信息</text>
          </view>
        </view>
        <view class="step">
          <view class="step-num">3</view>
          <view class="step-info">
            <text class="step-title">生成方案</text>
            <text class="step-desc">AI智能生成专属装修方案</text>
          </view>
        </view>
        <view class="step">
          <view class="step-num">4</view>
          <view class="step-info">
            <text class="step-title">保存分享</text>
            <text class="step-desc">保存方案或分享给家人参考</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 历史记录 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">最近生成</text>
        <text class="section-more" @click="goToHistory">查看全部 ></text>
      </view>
      <view class="history-list">
        <view class="history-item" v-for="item in history" :key="item.id" @click="viewRecord(item)">
          <view class="history-icon">{{ item.type === 'plan' ? '📝' : '🖼️' }}</view>
          <view class="history-info">
            <text class="history-title">{{ item.type === 'plan' ? '装修方案' : '效果图' }}</text>
            <text class="history-time">{{ formatRelativeTime(item.created_at) }}</text>
          </view>
        </view>
        <EmptyState v-if="history.length === 0" text="暂无生成记录" />
      </view>
    </view>
  </view>
</template>

<script>
import EmptyState from '../../components/common/EmptyState.vue'
import { getAIRecords } from '../../api/ai'
import { formatRelativeTime } from '../../utils/format'

export default {
  components: { EmptyState },
  data() {
    return {
      history: []
    }
  },
  onLoad() {
    this.loadHistory()
  },
  methods: {
    async loadHistory() {
      try {
        const res = await getAIRecords({ page: 1, page_size: 5 })
        this.history = res?.items || []
      } catch (e) {
        console.error('加载历史失败', e)
      }
    },
    goToPlan() {
      uni.navigateTo({ url: '/pages/ai/plan' })
    },
    goToRender() {
      uni.navigateTo({ url: '/pages/ai/render' })
    },
    goToHistory() {
      uni.navigateTo({ url: '/pages/ai/history' })
    },
    viewRecord(item) {
      if (item.type === 'render') {
        // 通过 ID 跳转到渲染图详情
        uni.navigateTo({ url: `/pages/ai/imageAnalysisResult?id=${item.id}` })
      } else {
        // 跳转到方案详情，装修方案内容保存在 analysis_result 字段
        uni.setStorageSync('aiPlanContent', item.analysis_result || '')
        uni.setStorageSync('aiPlanParams', item.params || '{}')
        uni.setStorageSync('aiPlanTime', item.created_at)
        uni.navigateTo({ url: '/pages/ai/planResult' })
      }
    },
    formatRelativeTime
  }
}
</script>

<style scoped>
.ai-page {
  background: #f8f8f8;
  padding-bottom: 30rpx;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx;
  color: #fff;
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  opacity: 0.9;
}

.feature-grid {
  padding: 30rpx;
  margin-top: 10rpx;
}

.feature-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.feature-icon {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50rpx;
  margin-right: 24rpx;
}

.feature-info {
  flex: 1;
}

.feature-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
  display: block;
  margin-bottom: 8rpx;
}

.feature-desc {
  font-size: 26rpx;
  color: #909399;
}

.arrow {
  font-size: 32rpx;
  color: #c0c4cc;
}

.section {
  padding: 30rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #303133;
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-more {
  font-size: 26rpx;
  color: #909399;
}

.steps {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.step {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.step:last-child {
  margin-bottom: 0;
}

.step-num {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.step-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #303133;
  display: block;
  margin-bottom: 6rpx;
}

.step-desc {
  font-size: 26rpx;
  color: #909399;
}

.history-list {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.history-item:last-child {
  border-bottom: none;
}

.history-icon {
  width: 80rpx;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.history-title {
  font-size: 30rpx;
  color: #303133;
  display: block;
  margin-bottom: 6rpx;
}

.history-time {
  font-size: 24rpx;
  color: #909399;
}
</style>
