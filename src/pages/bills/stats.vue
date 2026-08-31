<template>
  <view class="stats-page">
    <!-- 总览卡片 -->
    <view class="overview-card">
      <view class="overview-item">
        <text class="overview-label">总支出</text>
        <text class="overview-value">¥{{ formatAmount(stats.total_amount) }}</text>
      </view>
      <view class="overview-item">
        <text class="overview-label">账单数</text>
        <text class="overview-value">{{ stats.total_count || 0 }}</text>
      </view>
    </view>

    <!-- 分类统计 -->
    <view class="section">
      <view class="section-title">分类支出</view>
      <view class="category-list" v-if="stats.category_stats?.length > 0">
        <view class="category-item" v-for="item in stats.category_stats" :key="item.category">
          <view class="category-info">
            <text class="category-name">{{ getCategoryName(item.category) }}</text>
            <text class="category-count">{{ item.count }}笔</text>
          </view>
          <text class="category-amount">¥{{ formatAmount(item.amount) }}</text>
        </view>
      </view>
      <EmptyState v-else text="暂无账单数据" />
    </view>

    <!-- 每月统计 -->
    <view class="section">
      <view class="section-title">月度趋势</view>
      <view class="monthly-chart" v-if="stats.monthly_stats?.length > 0">
        <view class="chart-bar" v-for="item in stats.monthly_stats" :key="item.month">
          <view class="bar-wrapper">
            <view class="bar" :style="{ height: getBarHeight(item.amount) + '%' }"></view>
          </view>
          <text class="bar-label">{{ formatMonth(item.month) }}</text>
          <text class="bar-amount">¥{{ formatAmount(item.amount) }}</text>
        </view>
      </view>
      <EmptyState v-else text="暂无月度数据" />
    </view>
  </view>
</template>

<script>
import EmptyState from '../../components/common/EmptyState.vue'
import { getBillStats } from '../../api/bill'

export default {
  components: { EmptyState },
  data() {
    return {
      stats: {
        total_amount: 0,
        total_count: 0,
        category_stats: [],
        daily_stats: [],
        monthly_stats: []
      }
    }
  },
  onLoad() {
    this.loadStats()
  },
  onShow() {
    this.loadStats()
  },
  methods: {
    async loadStats() {
      try {
        const res = await getBillStats()
        if (res) {
          this.stats = res
        }
      } catch (e) {
        console.error('加载统计失败', e)
      }
    },
    formatAmount(amount) {
      if (!amount) return '0.00'
      return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },
    formatMonth(month) {
      if (!month) return ''
      return month.split('-')[1] + '月'
    },
    getBarHeight(amount) {
      if (!this.stats.monthly_stats?.length) return 0
      const max = Math.max(...this.stats.monthly_stats.map(s => s.amount))
      if (max === 0) return 0
      return Math.max((amount / max) * 100, 5)
    },
    getCategoryName(category) {
      const names = {
        '设计费': '设计费',
        '硬装': '硬装',
        '水电': '水电',
        '瓷砖': '瓷砖',
        '家具': '家具',
        '家电': '家电',
        '软装': '软装',
        '人工杂费': '人工杂费'
      }
      return names[category] || category || '其他'
    }
  }
}
</script>

<style scoped>
.stats-page {

  background: #f8f8f8;
  padding: 20rpx;
}

/* 总览卡片 */
.overview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  display: flex;
  justify-content: space-around;
  margin-bottom: 30rpx;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.overview-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12rpx;
}

.overview-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
}

/* 区块 */
.section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
  margin-bottom: 30rpx;
}

/* 分类列表 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.category-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.category-info {
  display: flex;
  flex-direction: column;
}

.category-name {
  font-size: 30rpx;
  color: #303133;
  margin-bottom: 8rpx;
}

.category-count {
  font-size: 24rpx;
  color: #909399;
}

.category-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #2979ff;
}

/* 每月趋势图表 */
.monthly-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 300rpx;
  padding-top: 20rpx;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 10rpx;
}

.bar {
  width: 40rpx;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 8rpx 8rpx 0 0;
  min-height: 8rpx;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 22rpx;
  color: #909399;
  margin-top: 16rpx;
}

.bar-amount {
  font-size: 20rpx;
  color: #606266;
  margin-top: 8rpx;
}
</style>
