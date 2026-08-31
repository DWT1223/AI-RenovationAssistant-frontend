<template>
  <view class="bill-detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 编辑表单 -->
    <view v-else class="form-card">
      <view class="form-item">
        <view class="form-label">消费分类</view>
        <picker :value="categoryIndex" :range="categories" range-key="label" @change="onCategoryChange">
          <view class="picker-value">
            {{ categories[categoryIndex]?.label || '请选择' }}
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">消费金额</view>
        <view class="amount-input">
          <text class="symbol">¥</text>
          <input type="digit" v-model="formData.amount" placeholder="0.00" class="input" />
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">消费日期</view>
        <picker mode="date" :value="formData.bill_date" @change="onDateChange">
          <view class="picker-value">
            {{ formData.bill_date || '请选择' }}
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <input type="text" v-model="formData.remark" placeholder="选填" class="remark-input" />
      </view>

      <view class="form-item">
        <view class="form-label">消费凭证</view>
        <view class="images-grid">
          <view class="image-item" v-if="formData.voucher" @click="previewImage">
            <image :src="formData.voucher" mode="aspectFill"></image>
            <view class="delete-btn" @click="removeVoucher">×</view>
          </view>
          <view class="add-image" @click="chooseImage" v-else>
            <text class="icon">📷</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="btn-wrapper" v-if="!loading">
      <button class="btn-delete" @click="handleDelete">删除账单</button>
      <button class="btn-save" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
    </view>
  </view>
</template>

<script>
import { getBillDetail, updateBill, deleteBill } from '../../api/bill'
import { uploadImage } from '../../api/house'
import { BILL_CATEGORIES } from '../../utils/const'

export default {
  data() {
    return {
      billId: null,
      loading: true,
      saving: false,
      categories: BILL_CATEGORIES,
      categoryIndex: 0,
      formData: {
        category: '',
        amount: '',
        bill_date: '',
        remark: '',
        voucher: ''
      }
    }
  },
  onLoad(options) {
    this.billId = options.id
    if (this.billId) {
      this.loadBill()
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
  },
  methods: {
    async loadBill() {
      try {
        const res = await getBillDetail(this.billId)
        this.formData = {
          category: res.category || '',
          amount: res.amount?.toString() || '',
          bill_date: res.bill_date || '',
          remark: res.remark || '',
          voucher: res.voucher || ''
        }
        // 设置分类索引
        const idx = this.categories.findIndex(c => c.value === this.formData.category)
        this.categoryIndex = idx >= 0 ? idx : 0
      } catch (e) {
        console.error('加载账单失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    onCategoryChange(e) {
      this.categoryIndex = e.detail.value
      this.formData.category = this.categories[this.categoryIndex].value
    },
    onDateChange(e) {
      this.formData.bill_date = e.detail.value
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
            uni.showToast({ title: '上传失败', icon: 'none' })
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

      this.saving = true
      try {
        await updateBill(this.billId, {
          category: this.formData.category,
          amount: Number(this.formData.amount),
          bill_date: this.formData.bill_date,
          remark: this.formData.remark,
          voucher: this.formData.voucher
        })
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      } catch (e) {
        console.error('保存失败', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.saving = false
      }
    },
    handleDelete() {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这笔账单吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteBill(this.billId)
              uni.showToast({ title: '删除成功', icon: 'success' })
              setTimeout(() => uni.navigateBack(), 1500)
            } catch (e) {
              console.error('删除失败', e)
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.bill-detail-page {

  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 150rpx;
  padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  color: #909399;
}

.form-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 30rpx;
  color: #303133;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.amount-input {
  display: flex;
  align-items: center;
}

.symbol {
  font-size: 48rpx;
  font-weight: bold;
  color: #ff6b6b;
  margin-right: 10rpx;
}

.input {
  flex: 1;
  font-size: 48rpx;
  font-weight: bold;
}

.remark-input {
  padding: 24rpx 30rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.images-grid {
  display: flex;
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
}

.image-item image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.delete-btn {
  position: absolute;
  top: -16rpx;
  right: -16rpx;
  width: 48rpx;
  height: 48rpx;
  background: #fa3534;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.add-image {
  width: 200rpx;
  height: 200rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #dcdee0;
}

.icon {
  font-size: 60rpx;
}

.btn-wrapper {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
}

.btn-delete {
  flex: 1;
  height: 96rpx;
  background: #fff;
  color: #fa3534;
  font-size: 32rpx;
  border-radius: 48rpx;
  border: 2rpx solid #fa3534;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-save {
  flex: 2;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-save[disabled] {
  opacity: 0.7;
}
</style>
