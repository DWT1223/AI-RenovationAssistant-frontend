<template>
  <view class="house-page">
    <!-- 顶部Tab筛选 -->
    <view class="filter-bar">
      <view
        v-for="type in imgTypes"
        :key="type.value"
        :class="['filter-item', { active: currentType === type.value }]"
        @click="changeType(type.value)"
      >
        {{ type.label }}
      </view>
    </view>

    <!-- 户型效果图列表 -->
    <scroll-view scroll-y class="house-list" @scrolltolower="loadMore">
      <view class="list-content">
        <!-- 加载状态 -->
        <LoadingState v-if="loading && list.length === 0" />

        <!-- 空状态 -->
        <EmptyState
          v-else-if="list.length === 0 && !loading"
          text="暂无户型效果图"
          sub-text="点击下方按钮上传您的户型效果图"
        />

        <!-- 列表 -->
        <view v-else class="house-grid">
          <view
            v-for="item in list"
            :key="item.id"
            class="house-item"
            @click="previewImage(item)"
          >
            <image :src="item.img_url" class="house-img" mode="aspectFill" />
            <view class="house-info">
              <text class="house-title">{{ item.title || '未命名' }}</text>
              <text class="house-type">{{ getTypeLabel(item.img_type) }}</text>
            </view>
            <view class="house-actions">
              <text class="action-btn delete" @click.stop="handleDelete(item)">删除</text>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="loading && list.length > 0" class="loading-more">
          <text>加载中...</text>
        </view>
        <view v-else-if="!hasMore && list.length > 0" class="no-more">
          <text>没有更多了</text>
        </view>
      </view>
    </scroll-view>

    <!-- 上传按钮 -->
    <view class="upload-bar">
      <button class="upload-btn" @click="handleUpload">
        <text class="icon">+</text>
        <text>上传户型效果图</text>
      </button>
    </view>

    <!-- 上传弹窗 -->
    <view v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <view class="upload-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">上传户型效果图</text>
          <text class="modal-close" @click="closeUploadModal">×</text>
        </view>

        <view class="modal-body">
          <!-- 图片预览 -->
          <view class="preview-area" @click="chooseImage">
            <image v-if="uploadForm.img_url" :src="uploadForm.img_url" class="preview-img" mode="aspectFit" />
            <view v-else class="preview-placeholder">
              <text class="placeholder-icon">📷</text>
              <text class="placeholder-text">点击选择图片</text>
            </view>
          </view>

          <!-- 表单 -->
          <view class="form-item">
            <text class="form-label">名称</text>
            <input
              v-model="uploadForm.title"
              class="form-input"
              placeholder="请输入户型效果图名称"
              maxlength="50"
            />
          </view>

          <view class="form-item">
            <text class="form-label">类型</text>
            <picker
              :value="typeIndex"
              :range="imgTypes"
              range-key="label"
              @change="onTypeChange"
            >
              <view class="form-picker">
                <text>{{ imgTypes[typeIndex]?.label || '请选择类型' }}</text>
                <text class="arrow">›</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="modal-footer">
          <button class="btn-cancel" @click="closeUploadModal">取消</button>
          <button class="btn-confirm" :disabled="!canSubmit" @click="submitUpload">确定上传</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingState from '../../components/common/LoadingState.vue'
import { getHouseImgs, createHouseImg, deleteHouseImg, uploadImage } from '../../api/house'

export default {
  components: { EmptyState, LoadingState },
  data() {
    return {
      imgTypes: [
        { label: '全部', value: '' },
        { label: '原始户型', value: '原始户型' },
        { label: '改造户型', value: '改造户型' },
        { label: '竣工户型', value: '竣工户型' },
        { label: '毛坯实拍', value: '毛坯实拍' }
      ],
      currentType: '',
      list: [],
      page: 1,
      pageSize: 20,
      hasMore: true,
      loading: false,
      showUploadModal: false,
      uploadForm: {
        img_url: '',
        title: '',
        img_type: '原始户型'
      },
      tempFilePath: ''
    }
  },
  computed: {
    typeIndex() {
      const index = this.imgTypes.findIndex(t => t.value === this.currentType)
      return index >= 0 ? index : 0
    },
    canSubmit() {
      return this.uploadForm.img_url && this.uploadForm.title.trim()
    }
  },
  onLoad() {
    this.loadList()
  },
  onShow() {
    // 每次显示时刷新
    this.refreshList()
  },
  methods: {
    async loadList() {
      if (this.loading) return
      this.loading = true

      try {
        const res = await getHouseImgs({
          page: this.page,
          page_size: this.pageSize,
          img_type: this.currentType || undefined
        })

        const items = res?.items || []

        if (this.page === 1) {
          this.list = items
        } else {
          this.list = [...this.list, ...items]
        }

        this.hasMore = items.length >= this.pageSize
      } catch (e) {
        console.error('加载户型效果图失败', e)
        if (e.message?.includes('登录')) {
          uni.showToast({ title: '请先登录', icon: 'none' })
        }
      } finally {
        this.loading = false
      }
    },
    refreshList() {
      this.page = 1
      this.list = []
      this.hasMore = true
      this.loadList()
    },
    loadMore() {
      if (!this.hasMore || this.loading) return
      this.page++
      this.loadList()
    },
    changeType(type) {
      if (this.currentType === type) return
      this.currentType = type
      this.refreshList()
    },
    getTypeLabel(type) {
      const item = this.imgTypes.find(t => t.value === type)
      return item ? item.label : type || '未知'
    },
    handleUpload() {
      // 检查登录
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再上传户型效果图',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/user/login' })
            }
          }
        })
        return
      }
      this.resetUploadForm()
      this.showUploadModal = true
    },
    closeUploadModal() {
      this.showUploadModal = false
      this.resetUploadForm()
    },
    resetUploadForm() {
      this.uploadForm = {
        img_url: '',
        title: '',
        img_type: '原始户型'
      }
      this.tempFilePath = ''
    },
    async chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.tempFilePath = tempFilePath

          // 先显示本地图片
          this.uploadForm.img_url = tempFilePath

          // 上传到服务器
          try {
            uni.showLoading({ title: '上传中...' })
            const result = await uploadImage(tempFilePath)
            // 兼容处理：可能返回 {url: "..."} 或直接返回字符串
            this.uploadForm.img_url = result.url || result
            uni.hideLoading()
            uni.showToast({ title: '上传成功', icon: 'success' })
          } catch (e) {
            console.error('上传失败', e)
            uni.hideLoading()
            uni.showToast({ title: '上传失败', icon: 'none' })
            // 清空已显示的本地图片
            this.uploadForm.img_url = ''
          }
        }
      })
    },
    onTypeChange(e) {
      const index = e.detail.value
      this.uploadForm.img_type = this.imgTypes[index]?.value || '原始户型'
    },
    async submitUpload() {
      if (!this.canSubmit) return

      try {
        uni.showLoading({ title: '提交中...' })
        await createHouseImg({
          img_url: this.uploadForm.img_url,
          title: this.uploadForm.title.trim(),
          img_type: this.uploadForm.img_type
        })
        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
        this.closeUploadModal()
        this.refreshList()
      } catch (e) {
        uni.hideLoading()
        console.error('创建失败', e)
        uni.showToast({ title: e.message || '创建失败', icon: 'none' })
      }
    },
    handleDelete(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除"${item.title || '此户型效果图'}"吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteHouseImg(item.id)
              uni.showToast({ title: '已删除', icon: 'success' })
              this.refreshList()
            } catch (e) {
              console.error('删除失败', e)
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    },
    previewImage(item) {
      uni.previewImage({
        current: item.img_url,
        urls: [item.img_url]
      })
    }
  }
}
</script>

<style scoped>
.house-page {

  background: #f8f8f8;
  padding-bottom: 120rpx;
}

/* 筛选栏 */
.filter-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.filter-bar::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

.filter-item {
  flex-shrink: 0;
  padding: 16rpx 30rpx;
  font-size: 28rpx;
  color: #606266;
  position: relative;
  white-space: nowrap;
}

.filter-item.active {
  color: #2979ff;
  font-weight: bold;
}

.filter-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: #2979ff;
  border-radius: 3rpx;
}

/* 列表 */
.house-list {
  height: calc(100vh);
  margin-top: 100rpx;
}

.list-content {
  padding: 20rpx;
}

.house-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.house-item {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
}

.house-img {
  width: 100%;
  height: 400rpx;
  background: #f0f2f5;
}

.house-info {
  padding: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.house-title {
  font-size: 30rpx;
  color: #303133;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.house-type {
  font-size: 24rpx;
  color: #909399;
  background: #f0f2f5;
  padding: 6rpx 16rpx;
  border-radius: 4rpx;
  margin-left: 20rpx;
}

.house-actions {
  padding: 0 20rpx 20rpx;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  border-radius: 8rpx;
}

.action-btn.delete {
  color: #fa3534;
  background: #fef0f0;
}

/* 加载更多 */
.loading-more,
.no-more {
  text-align: center;
  padding: 30rpx;
  color: #909399;
  font-size: 26rpx;
}

/* 上传按钮 */
.upload-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 30rpx;
  border-radius: 44rpx;
  border: none;
}

.upload-btn::after {
  border: none;
}

.upload-btn .icon {
  font-size: 36rpx;
  margin-right: 10rpx;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.upload-modal {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.preview-area {
  width: 100%;
  height: 400rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.placeholder-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.placeholder-text {
  font-size: 28rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #303133;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.form-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #606266;
}

.form-picker .arrow {
  font-size: 36rpx;
  color: #999;
}

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  gap: 20rpx;
  border-top: 1rpx solid #eee;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  border-radius: 44rpx;
  border: none;
}

.btn-cancel {
  background: #f0f2f5;
  color: #606266;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-confirm[disabled] {
  opacity: 0.5;
}

.btn-cancel::after,
.btn-confirm::after {
  border: none;
}
</style>
