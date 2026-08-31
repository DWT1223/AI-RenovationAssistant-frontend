<template>
  <view class="bills-page">
    <!-- 预算概览 -->
    <view class="budget-overview" v-if="budget" @click="goToBudget">
      <view class="overview-content">
        <view class="overview-header">
          <text class="overview-title">预算概览</text>
          <view class="edit-hint">
            <text class="edit-icon">✏️</text>
            <text class="edit-text">点击编辑</text>
          </view>
        </view>

        <view class="budget-stats">
          <view class="stat-row">
            <text class="stat-label">总预算</text>
            <text class="stat-value total">¥{{ formatMoney(budget.total_budget) }}</text>
          </view>
          <view class="stat-row">
            <text class="stat-label">已花费</text>
            <text class="stat-value spent">¥{{ formatMoney(budget.spent_amount) }}</text>
          </view>
          <view class="stat-row">
            <text class="stat-label">剩余</text>
            <text class="stat-value remaining" :class="budget.remaining_amount < 0 ? 'negative' : 'positive'">
              ¥{{ formatMoney(budget.remaining_amount) }}
            </text>
          </view>
        </view>

        <view class="progress-section">
          <view class="progress-container">
            <view class="progress-dot"></view>
            <view class="progress-track">
              <view class="progress-fill" :style="{ width: progressWidth + '%' }"></view>
            </view>
          </view>
          <text class="progress-text">已使用 {{ progressPercent }}%</text>
        </view>
      </view>
    </view>

    <!-- 无预算提示 -->
    <view class="no-budget" v-if="!budget" @click="goToBudget">
      <text class="no-budget-icon">💰</text>
      <text class="no-budget-text">设置装修预算</text>
      <text class="no-budget-arrow">›</text>
    </view>

    <!-- 月份选择 -->
    <view class="month-selector">
      <view class="month-card">
        <view class="month-btn" @click="changeMonth(-1)">
          <text class="btn-icon">‹</text>
        </view>
        <text class="month-text">{{ currentMonth }}</text>
        <view class="month-btn" @click="changeMonth(1)">
          <text class="btn-icon">›</text>
        </view>
      </view>
    </view>

    <!-- 支出明细区 -->
    <view class="section-header">
      <text class="section-title">支出明细</text>
      <view class="filter-btn">
        <text class="filter-icon">🔍</text>
        <text class="filter-text">筛选</text>
      </view>
    </view>

    <!-- 账单列表 -->
    <scroll-view scroll-y class="bills-list" @scrolltolower="loadMore">
      <view class="list-content">
        <BillItem
          v-for="bill in bills"
          :key="bill.id"
          :bill="bill"
          @click="goToDetail(bill)"
        />
        <EmptyState v-if="bills.length === 0 && !loading" text="本月暂无账单" />
        <LoadingState v-if="loading" />
      </view>
    </scroll-view>

    <!-- 底部悬浮区域 -->
    <view class="bottom-section">
      <view class="month-summary" v-if="bills.length > 0">
        <view class="summary-left">
          <text class="summary-label">本月支出</text>
          <text class="summary-amount">¥{{ formatMoney(monthTotal) }}</text>
        </view>
        <view class="summary-chart">
          <text class="chart-percent">{{ progressPercent }}%</text>
        </view>
      </view>

      <view class="fab-wrapper">
        <view class="fab-btn" @click="goToAdd">
          <text class="fab-icon">+</text>
        </view>
      </view>
    </view>

    <!-- TabBar占位 -->
    <view class="tabbar-placeholder"></view>
  </view>
</template>

<script>
import BillItem from '../../components/bill/BillItem.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingState from '../../components/common/LoadingState.vue'
import { getBills, getBudget } from '../../api/bill'
import { formatMoney, formatDate } from '../../utils/format'
import dayjs from 'dayjs'

export default {
  components: { BillItem, EmptyState, LoadingState },
  data() {
    return {
      currentMonth: dayjs().format('YYYY年MM月'),
      month: dayjs().format('YYYY-MM'),
      bills: [],
      budget: null,
      page: 1,
      pageSize: 20,
      hasMore: true,
      loading: false
    }
  },
  computed: {
    monthTotal() {
      return this.bills.reduce((sum, bill) => sum + Number(bill.amount), 0)
    },
    progressWidth() {
      if (!this.budget || this.budget.total_budget <= 0) return 0
      const percent = (this.budget.spent_amount / this.budget.total_budget) * 100
      return Math.min(percent, 100)
    },
    progressPercent() {
      if (!this.budget || this.budget.total_budget <= 0) return 0
      const percent = (this.budget.spent_amount / this.budget.total_budget) * 100
      return percent.toFixed(1)
    }
  },
  onLoad() {
    this.loadData()
  },
  onShow() {
    this.page = 1
    this.bills = []
    this.loadBills()
    this.loadBudget()
  },
  methods: {
    async loadData() {
      await Promise.all([
        this.loadBills(),
        this.loadBudget()
      ])
    },
    async loadBills() {
      if (this.loading) return
      this.loading = true

      try {
        const [startDate, endDate] = this.getMonthRange()
        const params = {
          page: this.page,
          page_size: this.pageSize,
          start_date: startDate,
          end_date: endDate
        }
        const res = await getBills(params)
        const items = res?.items || []

        if (this.page === 1) {
          this.bills = items
        } else {
          this.bills = [...this.bills, ...items]
        }

        this.hasMore = items.length >= this.pageSize
      } catch (e) {
        console.error('加载账单失败', e)
      } finally {
        this.loading = false
      }
    },
    async loadBudget() {
      try {
        this.budget = await getBudget()
      } catch (e) {
        console.error('加载预算失败', e)
      }
    },
    loadMore() {
      if (!this.hasMore || this.loading) return
      this.page++
      this.loadBills()
    },
    changeMonth(delta) {
      const newMonth = dayjs(this.month).add(delta, 'month')
      this.month = newMonth.format('YYYY-MM')
      this.currentMonth = newMonth.format('YYYY年MM月')
      this.page = 1
      this.bills = []
      this.loadBills()
    },
    getMonthRange() {
      const start = dayjs(this.month).startOf('month').format('YYYY-MM-DD')
      const end = dayjs(this.month).endOf('month').format('YYYY-MM-DD')
      return [start, end]
    },
    formatMoney,
    formatDate,
    goToDetail(bill) {
      uni.navigateTo({ url: `/pages/bills/detail?id=${bill.id}` })
    },
    goToAdd() {
      uni.navigateTo({ url: '/pages/bills/add' })
    },
    goToBudget() {
      uni.navigateTo({ url: '/pages/bills/budget' })
    }
  }
}
</script>

<style scoped>
.bills-page {
  background: #F5F6FA;
  display: flex;
  flex-direction: column;
}

/* 预算概览 */
.budget-overview {
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
  padding: 40rpx 64rpx 64rpx;
  border-radius: 0 0 64rpx 64rpx;
}

.overview-content {
  display: flex;
  flex-direction: column;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48rpx;
}

.overview-title {
  font-size: 34rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.edit-hint {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999rpx;
  padding: 12rpx 24rpx;
}

.edit-icon {
  font-size: 28rpx;
}

.edit-text {
  font-size: 26rpx;
  color: #fff;
}

.budget-stats {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.stat-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
}

.stat-value.total {
  color: #fff;
  font-size: 56rpx;
}

.stat-value.spent {
  color: #fff;
}

.stat-value.remaining.positive {
  color: #86EFAC;
}

.stat-value.remaining.negative {
  color: #FCA5A5;
}

.progress-section {
  margin-top: 40rpx;
}

.progress-container {
  position: relative;
  height: 32rpx;
  display: flex;
  align-items: center;
}

.progress-dot {
  position: absolute;
  left: 0;
  width: 34rpx;
  height: 32rpx;
  background: #fff;
  border-radius: 9999rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1), 0 4rpx 6rpx rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.progress-track {
  flex: 1;
  height: 16rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 9999rpx;
  margin-left: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 9999rpx;
  transition: width 0.3s;
}

.progress-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
  margin-top: 12rpx;
}

/* 无预算提示 */
.no-budget {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 40rpx;
  background: #fff;
  margin: 32rpx;
  border-radius: 32rpx;
  color: #6366F1;
}

.no-budget-icon {
  font-size: 40rpx;
}

.no-budget-text {
  font-size: 30rpx;
}

.no-budget-arrow {
  font-size: 28rpx;
}

/* 月份选择 */
.month-selector {
  padding: 32rpx 48rpx;
}

.month-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 32rpx;
  padding: 24rpx 32rpx;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
}

.month-btn {
  width: 64rpx;
  height: 64rpx;
  background: #F3F4F6;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon {
  font-size: 40rpx;
  color: #6B7280;
}

.month-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #1F2937;
}

/* 支出明细区标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48rpx 32rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #111827;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.filter-icon {
  font-size: 32rpx;
}

.filter-text {
  font-size: 26rpx;
  color: #6B7280;
}

/* 账单列表 */
.bills-list {
  flex: 1;
  min-height: 0;
}

.list-content {
  padding: 0 48rpx 32rpx;
}

/* 底部区域 */
.bottom-section {
  position: fixed;
  bottom: 96rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48rpx 32rpx;
  background: linear-gradient(to top, #F5F6FA 70%, transparent);
  padding-top: 120rpx;
}

.month-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 32rpx;
  padding: 10rpx 32rpx;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #F3F4F6;
  flex: 1;
  max-width: 480rpx;
}

.summary-left {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 28rpx;
  color: #6B7280;
}

.summary-amount {
  font-size: 52rpx;
  font-weight: bold;
  color: #EF4444;
  margin-top: 4rpx;
}

.summary-chart {
  width: 128rpx;
  height: 128rpx;
  border-radius: 9999rpx;
  border: 8rpx solid #FEE2E2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-percent {
  font-size: 24rpx;
  font-weight: 600;
  color: #EF4444;
}

.fab-wrapper {
  padding-left: 32rpx;
}

.fab-btn {
  width: 112rpx;
  height: 112rpx;
  border-radius: 9999rpx;
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 6rpx rgba(165, 180, 252, 0.5), 0 10rpx 15rpx rgba(165, 180, 252, 0.5);
}

.fab-icon {
  font-size: 56rpx;
  color: #fff;
  font-weight: 300;
}

.tabbar-placeholder {
  height: 120rpx;
}
</style>
