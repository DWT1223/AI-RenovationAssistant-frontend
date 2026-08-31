<template>
  <view class="add-bill-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="page-title">记一笔</text>
      <view class="placeholder"></view>
    </view>

    <view class="page-content">
      <!-- 表单卡片 -->
      <view class="form-card">
        <!-- 消费分类 -->
        <view class="form-item">
          <view class="form-label">消费分类</view>
          <picker :value="categoryIndex" :range="categories" range-key="label" @change="onCategoryChange">
            <view class="picker-value">
              <view class="category-preview" v-if="categories[categoryIndex]">
                <view class="category-icon" :style="getCategoryStyle(categories[categoryIndex].value)">
                  <text class="icon-text">{{ getCategoryIcon(categories[categoryIndex].value) }}</text>
                </view>
                <text class="category-name">{{ categories[categoryIndex]?.label }}</text>
              </view>
              <text class="arrow-icon">›</text>
            </view>
          </picker>
        </view>

        <!-- 消费金额 -->
        <view class="form-item amount-item">
          <view class="form-label">消费金额</view>
          <view class="amount-input">
            <text class="symbol">¥</text>
            <input type="digit" v-model="formData.amount" placeholder="0.00" class="input" />
          </view>
        </view>

        <!-- 消费日期 -->
        <view class="form-item">
          <view class="form-label">消费日期</view>
          <picker mode="date" :value="formData.billDate" @change="onDateChange">
            <view class="picker-value">
              <text class="date-text">{{ formData.billDate || '请选择' }}</text>
              <text class="arrow-icon">›</text>
            </view>
          </picker>
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <view class="form-label">备注</view>
          <input type="text" v-model="formData.remark" placeholder="选填" class="remark-input" />
        </view>

        <!-- 消费凭证 -->
        <view class="form-item">
          <view class="form-label">消费凭证</view>
          <view class="images-grid">
            <view class="image-item" v-if="formData.voucher" @click="previewImage">
              <image :src="formData.voucher" mode="aspectFill"></image>
              <view class="delete-btn" @click.stop="removeVoucher">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view class="add-image" @click="chooseImage" v-else>
              <text class="add-icon">📷</text>
              <text class="add-text">添加凭证</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="btn-wrapper">
      <button class="btn-save" :disabled="loading" @click="handleSave">
        {{ loading ? '保存中...' : '保存账单' }}
      </button>
    </view>
  </view>
</template>

<script>
import { createBill } from '../../api/bill'
import { uploadImage } from '../../api/house'
import { BILL_CATEGORIES } from '../../utils/const'
import dayjs from 'dayjs'

export default {
  data() {
    return {
      categories: BILL_CATEGORIES,
      categoryIndex: 0,
      formData: {
        category: '其他',
        amount: '',
        billDate: dayjs().format('YYYY-MM-DD'),
        remark: '',
        voucher: ''
      },
      loading: false
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    onCategoryChange(e) {
      this.categoryIndex = e.detail.value
      this.formData.category = this.categories[this.categoryIndex].value
    },
    onDateChange(e) {
      this.formData.billDate = e.detail.value
    },
    getCategoryIcon(category) {
      const icons = {
        '设计费': '📐', '硬装': '🏠', '水电': '💧', '水电改造': '💧',
        '瓷砖': '🧱', '地板': '🪵', '门窗': '🚪', '橱柜': '🗄️',
        '家具': '🛋️', '家电': '📺', '软装': '🛏️', '人工杂费': '👷',
        '防水工程': '🛡️', '吊顶': '🏗️', '其他': '📦'
      }
      return icons[category] || '💰'
    },
    getCategoryStyle(category) {
      const styles = {
        '设计费': { bg: 'linear-gradient(180deg, #DBEAFE 0%, #93C5FD 100%)', color: '#3B82F6' },
        '硬装': { bg: 'linear-gradient(180deg, #FCE7F3 0%, #F9A8D4 100%)', color: '#EC4899' },
        '水电': { bg: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)', color: '#F59E0B' },
        '水电改造': { bg: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)', color: '#F59E0B' },
        '瓷砖': { bg: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)', color: '#F59E0B' },
        '地板': { bg: 'linear-gradient(180deg, #D1FAE5 0%, #86EFAC 100%)', color: '#10B981' },
        '门窗': { bg: 'linear-gradient(180deg, #FEE2E2 0%, #FECACA 100%)', color: '#EF4444' },
        '橱柜': { bg: 'linear-gradient(180deg, #FCE7F3 0%, #F9A8D4 100%)', color: '#EC4899' },
        '家具': { bg: 'linear-gradient(180deg, #DBEAFE 0%, #93C5FD 100%)', color: '#3B82F6' },
        '家电': { bg: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)', color: '#F59E0B' },
        '软装': { bg: 'linear-gradient(180deg, #FCE7F3 0%, #F9A8D4 100%)', color: '#EC4899' },
        '人工杂费': { bg: 'linear-gradient(180deg, #E0E7FF 0%, #C7D2FE 100%)', color: '#6366F1' },
        '防水工程': { bg: 'linear-gradient(180deg, #D1FAE5 0%, #86EFAC 100%)', color: '#10B981' },
        '吊顶': { bg: 'linear-gradient(180deg, #E0E7FF 0%, #C7D2FE 100%)', color: '#6366F1' },
        '其他': { bg: 'linear-gradient(180deg, #F3F4F6 0%, #D1D5DB 100%)', color: '#6B7280' }
      }
      return styles[category] || { bg: 'linear-gradient(180deg, #F3F4F6 0%, #D1D5DB 100%)', color: '#6B7280' }
    },
    async chooseImage() {
      uni.chooseImage({
        count: 1,
        success: async (res) => {
          try {
            const result = await uploadImage(res.tempFilePaths[0])
            this.formData.voucher = result.url
          } catch (e) {
            console.error('上传失败', e)
          }
        }
      })
    },
    removeVoucher() {
      this.formData.voucher = ''
    },
    previewImage() {
      uni.previewImage({ urls: [this.formData.voucher] })
    },
    async handleSave() {
      if (!this.formData.amount || Number(this.formData.amount) <= 0) {
        uni.showToast({ title: '请输入正确金额', icon: 'none' })
        return
      }

      this.loading = true
      try {
        await createBill({
          category: this.formData.category,
          amount: this.formData.amount,
          bill_date: this.formData.billDate,
          remark: this.formData.remark,
          voucher: this.formData.voucher
        })
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (e) {
        uni.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.add-bill-page {

  background: #F5F6FA;
  padding-bottom: 180rpx;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: #fff;
}

.back-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 60rpx;
  color: #374151;
  font-weight: bold;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #111827;
}

.placeholder {
  width: 72rpx;
}

.page-content {
  padding: 32rpx 48rpx;
}

/* 表单卡片 */
.form-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #F3F4F6;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 28rpx;
  color: #6B7280;
  margin-bottom: 16rpx;
}

/* 分类选择器 */
.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #F3F4F6;
  border-radius: 24rpx;
}

.category-preview {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.category-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-text {
  font-size: 32rpx;
}

.category-name {
  font-size: 30rpx;
  color: #1F2937;
  font-weight: 500;
}

.arrow-icon {
  font-size: 32rpx;
  color: #9CA3AF;
}

/* 金额输入 */
.amount-item {
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  margin: 0 -32rpx;
  padding: 32rpx;
  border-radius: 0;
}

.amount-item .form-label {
  color: #6366F1;
}

.amount-input {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.symbol {
  font-size: 64rpx;
  font-weight: bold;
  color: #EF4444;
}

.input {
  flex: 1;
  font-size: 64rpx;
  font-weight: bold;
  color: #1F2937;
}

/* 日期选择器 */
.date-text {
  font-size: 30rpx;
  color: #1F2937;
}

/* 备注输入 */
.remark-input {
  padding: 24rpx;
  background: #F3F4F6;
  border-radius: 24rpx;
  font-size: 30rpx;
  color: #1F2937;
}

/* 图片上传 */
.images-grid {
  display: flex;
  gap: 24rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 24rpx;
  overflow: hidden;
}

.image-item image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  font-size: 32rpx;
  color: #fff;
}

.add-image {
  width: 200rpx;
  height: 200rpx;
  background: #F3F4F6;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #D1D5DB;
}

.add-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.add-text {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 底部保存按钮 */
.btn-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 48rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -1rpx 3rpx rgba(0, 0, 0, 0.05);
}

.btn-save {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(99, 102, 241, 0.3);
}

.btn-save[disabled] {
  opacity: 0.6;
}
</style>
