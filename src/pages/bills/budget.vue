<template>
  <view class="budget-page">
    <!-- 预算概览卡片 -->
    <view class="budget-card">
      <view class="card-header">
        <text class="card-title">装修总预算</text>
        <text class="edit-btn" @click="toggleEdit">{{ isEditing ? '保存' : '编辑' }}</text>
      </view>

      <view class="budget-amount">
        <text class="currency">¥</text>
        <input
          v-if="isEditing"
          type="digit"
          v-model="formData.total_budget"
          class="amount-input"
          placeholder="请输入总预算"
        />
        <text v-else class="amount">{{ formatNumber(displayTotalBudget) }}</text>
      </view>

      <view class="budget-stats" v-if="budget">
        <view class="stat-item">
          <text class="stat-label">已花费</text>
          <text class="stat-value warning">¥{{ formatNumber(budget.spent_amount) }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">剩余</text>
          <text class="stat-value" :class="budget.remaining_amount < 0 ? 'error' : 'success'">
            ¥{{ formatNumber(budget.remaining_amount) }}
          </text>
        </view>
      </view>

      <!-- 预算进度 -->
      <view class="progress-section" v-if="budget && budget.total_budget > 0">
        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
            :class="{ 'over-budget': progressPercent > 100 }"
          ></view>
        </view>
        <text class="progress-text">{{ progressPercent.toFixed(1) }}%</text>
      </view>
    </view>

    <!-- 分类支出明细 -->
    <view class="detail-section">
      <view class="section-header">
        <text class="section-title">支出明细</text>
      </view>

      <view class="detail-list" v-if="categorySpentList.length > 0">
        <view
          class="detail-item"
          v-for="item in categorySpentList"
          :key="item.category"
        >
          <view class="detail-left">
            <text class="detail-icon">{{ getCategoryIcon(item.category) }}</text>
            <text class="detail-name">{{ getCategoryLabel(item.category) }}</text>
          </view>
          <text class="detail-amount">¥{{ formatNumber(item.amount) }}</text>
        </view>
      </view>

      <view class="empty-detail" v-else>
        <text>暂无支出记录</text>
      </view>
    </view>

    <!-- 底部占位 -->
    <view class="bottom-placeholder"></view>
  </view>
</template>

<script>
import { getBudget, setBudget } from '../../api/bill'
import { BILL_CATEGORIES } from '../../utils/const'

export default {
  data() {
    return {
      budget: null,
      isEditing: false,
      formData: {
        total_budget: ''
      },
      categories: BILL_CATEGORIES
    }
  },
  computed: {
    progressPercent() {
      if (!this.budget || this.budget.total_budget <= 0) return 0
      return (this.budget.spent_amount / this.budget.total_budget) * 100
    },
    displayTotalBudget() {
      return this.budget ? this.budget.total_budget : 0
    },
    categorySpentList() {
      if (!this.budget || !this.budget.category_spent) return []
      return this.budget.category_spent.filter(item => item.amount > 0)
    }
  },
  onLoad() {
    this.loadBudget()
  },
  methods: {
    async loadBudget() {
      try {
        const res = await getBudget()
        this.budget = res
        this.formData.total_budget = (this.budget && this.budget.total_budget) ? this.budget.total_budget.toString() : ''
      } catch (e) {
        console.error('加载预算失败', e)
      }
    },
    toggleEdit() {
      if (this.isEditing) {
        this.saveBudget()
      } else {
        this.isEditing = true
      }
    },
    async saveBudget() {
      const totalBudget = parseFloat(this.formData.total_budget)
      if (isNaN(totalBudget) || totalBudget <= 0) {
        uni.showToast({ title: '请输入有效的总预算', icon: 'none' })
        return
      }

      try {
        await setBudget({
          total_budget: totalBudget
        })
        uni.showToast({ title: '保存成功', icon: 'success' })
        this.isEditing = false
        this.loadBudget()
      } catch (e) {
        console.error('保存预算失败', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },
    getCategoryLabel(category) {
      const cat = this.categories.find(c => c.value === category)
      return cat?.label || category
    },
    getCategoryIcon(category) {
      const cat = this.categories.find(c => c.value === category)
      return cat?.icon || '📦'
    },
    formatNumber(num) {
      if (!num) return '0'
      return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    }
  }
}
</script>

<style scoped>
.budget-page {

  background: #f5f5f5;
  padding: 20rpx;
}

.budget-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  color: #fff;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.card-title {
  font-size: 28rpx;
  opacity: 0.9;
}

.edit-btn {
  font-size: 28rpx;
  color: #fff;
  padding: 8rpx 20rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
}

.budget-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 40rpx;
}

.currency {
  font-size: 36rpx;
  margin-right: 8rpx;
}

.amount {
  font-size: 72rpx;
  font-weight: bold;
}

.amount-input {
  font-size: 72rpx;
  font-weight: bold;
  color: #fff;
  background: transparent;
  border: none;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.5);
  outline: none;
  width: 400rpx;
}

.budget-stats {
  display: flex;
  justify-content: space-around;
  padding: 30rpx 0;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.8;
  display: block;
  margin-bottom: 8rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
}

.progress-section {
  display: flex;
  align-items: center;
  margin-top: 30rpx;
  gap: 20rpx;
}

.progress-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 8rpx;
  transition: width 0.3s;
}

.progress-fill.over-budget {
  background: #ff6b6b;
}

.progress-text {
  font-size: 28rpx;
  min-width: 100rpx;
  text-align: right;
}

.detail-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
}

.detail-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.detail-icon {
  font-size: 36rpx;
}

.detail-name {
  font-size: 28rpx;
  color: #303133;
}

.detail-amount {
  font-size: 32rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.empty-detail {
  text-align: center;
  padding: 60rpx 0;
  color: #909399;
  font-size: 28rpx;
}

.bottom-placeholder {
  height: 100rpx;
}
</style>
