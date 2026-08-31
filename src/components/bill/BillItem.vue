<template>
  <view class="bill-item" @click="handleClick">
    <view class="bill-left">
      <view class="category-icon" :style="getCategoryStyle().bg">
        <text class="category-icon-text">{{ categoryIcon }}</text>
      </view>
      <view class="bill-info">
        <text class="category">{{ bill.category }}</text>
        <text class="remark" v-if="bill.remark">{{ bill.remark }} · {{ formatDate(bill.bill_date) }}</text>
        <text class="date" v-else>{{ formatDate(bill.bill_date) }}</text>
      </view>
    </view>
    <view class="bill-right">
      <text class="amount">-{{ formatMoney(bill.amount) }}</text>
      <image v-if="bill.voucher" src="/static/icon/voucher.png" class="voucher-icon"></image>
    </view>
  </view>
</template>

<script>
import { formatDate, formatMoney } from '../../utils/format'

export default {
  name: 'BillItem',
  props: {
    bill: {
      type: Object,
      required: true
    }
  },
  computed: {
    categoryIcon() {
      const icons = {
        '设计费': '📐',
        '硬装': '🏠',
        '水电': '💧',
        '水电改造': '💧',
        '瓷砖': '🧱',
        '地板': '🪵',
        '门窗': '🚪',
        '橱柜': '🗄️',
        '家具': '🛋️',
        '家电': '📺',
        '软装': '🛏️',
        '人工杂费': '👷',
        '防水工程': '🛡️',
        '吊顶': '🏗️',
        '其他': '📦'
      }
      return icons[this.bill.category] || '💰'
    }
  },
  methods: {
    formatDate,
    formatMoney,
    getCategoryStyle() {
      const styles = {
        '设计费': { bg: 'background: linear-gradient(180deg, #DBEAFE 0%, #93C5FD 100%);' },
        '硬装': { bg: 'background: linear-gradient(180deg, #FCE7F3 0%, #F9A8D4 100%);' },
        '水电': { bg: 'background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);' },
        '水电改造': { bg: 'background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);' },
        '瓷砖': { bg: 'background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);' },
        '地板': { bg: 'background: linear-gradient(180deg, #D1FAE5 0%, #86EFAC 100%);' },
        '门窗': { bg: 'background: linear-gradient(180deg, #FEE2E2 0%, #FECACA 100%);' },
        '橱柜': { bg: 'background: linear-gradient(180deg, #FCE7F3 0%, #F9A8D4 100%);' },
        '家具': { bg: 'background: linear-gradient(180deg, #DBEAFE 0%, #93C5FD 100%);' },
        '家电': { bg: 'background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);' },
        '软装': { bg: 'background: linear-gradient(180deg, #FCE7F3 0%, #F9A8D4 100%);' },
        '人工杂费': { bg: 'background: linear-gradient(180deg, #E0E7FF 0%, #C7D2FE 100%);' },
        '防水工程': { bg: 'background: linear-gradient(180deg, #D1FAE5 0%, #86EFAC 100%);' },
        '吊顶': { bg: 'background: linear-gradient(180deg, #E0E7FF 0%, #C7D2FE 100%);' },
        '其他': { bg: 'background: linear-gradient(180deg, #F3F4F6 0%, #D1D5DB 100%);' }
      }
      return styles[this.bill.category] || { bg: 'background: linear-gradient(180deg, #F3F4F6 0%, #D1D5DB 100%);' }
    },
    handleClick() {
      this.$emit('click', this.bill)
    }
  }
}
</script>

<style scoped>
.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  background: #fff;
  border-radius: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #F3F4F6;
}

.bill-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.category-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.category-icon-text {
  font-size: 44rpx;
}

.bill-info {
  display: flex;
  flex-direction: column;
}

.category {
  font-size: 32rpx;
  color: #1F2937;
  font-weight: 600;
}

.remark {
  font-size: 26rpx;
  color: #9CA3AF;
  margin-top: 6rpx;
}

.date {
  font-size: 26rpx;
  color: #9CA3AF;
  margin-top: 6rpx;
}

.bill-right {
  display: flex;
  align-items: center;
}

.amount {
  font-size: 36rpx;
  color: #1F2937;
  font-weight: bold;
}

.voucher-icon {
  width: 32rpx;
  height: 32rpx;
  margin-left: 16rpx;
}
</style>
