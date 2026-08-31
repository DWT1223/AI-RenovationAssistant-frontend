<template>
  <view class="publish-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="page-title">发布笔记</text>
      <view class="header-right">
        <button class="publish-btn" :disabled="loading" @click="handlePublish">
          {{ loading ? '发布中...' : '发布' }}
        </button>
      </view>
    </view>

    <view class="page-content">
      <!-- 表单卡片 -->
      <view class="form-card">
        <!-- 标题 -->
        <view class="form-item title-item">
          <input type="text" v-model="formData.title" placeholder="标题" class="title-input" />
        </view>

        <!-- 内容 -->
        <view class="form-item content-item">
          <textarea v-model="formData.content" placeholder="分享你的装修经验，心得..." class="content-input" />
        </view>

        <!-- 图片 -->
        <view class="form-item">
          <view class="form-label">图片</view>
          <view class="images-grid">
            <view class="image-item" v-for="(img, index) in formData.images" :key="index">
              <image :src="img" mode="aspectFill"></image>
              <view class="delete-btn" @click.stop="removeImage(index)">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view class="add-image" @click="chooseImage" v-if="formData.images.length < 9">
              <text class="add-icon">📷</text>
              <text class="add-text">添加图片</text>
            </view>
          </view>
        </view>

        <!-- 分类 -->
        <view class="form-item">
          <view class="form-label">分类</view>
          <picker :value="categoryIndex" :range="categories" range-key="label" @change="onCategoryChange">
            <view class="picker-value">
              <text class="picker-text">{{ categories[categoryIndex]?.label || '请选择' }}</text>
              <text class="arrow-icon">›</text>
            </view>
          </picker>
        </view>

        <!-- 装修阶段 -->
        <view class="form-item">
          <view class="form-label">装修阶段</view>
          <picker :value="stageIndex" :range="stages" range-key="label" @change="onStageChange">
            <view class="picker-value">
              <text class="picker-text">{{ stages[stageIndex]?.label || '请选择' }}</text>
              <text class="arrow-icon">›</text>
            </view>
          </picker>
        </view>

        <!-- 公开开关 -->
        <view class="form-item switch-item">
          <view class="switch-row">
            <view class="switch-info">
              <text class="switch-label">公开笔记</text>
              <text class="switch-desc">公开后其他人可见</text>
            </view>
            <view class="switch-wrapper" :class="{ active: formData.isPublic }" @click="onSwitchChange">
              <view class="switch-thumb"></view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { createNote } from '../../api/note'
import { NOTE_CATEGORIES, DECORATION_STAGES } from '../../utils/const'
import { uploadImage } from '../../api/house'

export default {
  data() {
    return {
      categories: NOTE_CATEGORIES,
      stages: DECORATION_STAGES,
      categoryIndex: 0,
      stageIndex: 0,
      formData: {
        title: '',
        content: '',
        images: [],
        isPublic: false,
        status: 1
      },
      loading: false
    }
  },
  onLoad(options) {
    if (options.title) {
      this.formData.title = decodeURIComponent(options.title)
    }
    if (options.content) {
      this.formData.content = decodeURIComponent(options.content)
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    onCategoryChange(e) {
      this.categoryIndex = e.detail.value
    },
    onStageChange(e) {
      this.stageIndex = e.detail.value
    },
    onSwitchChange() {
      this.formData.isPublic = !this.formData.isPublic
    },
    async chooseImage() {
      uni.chooseImage({
        count: 9 - this.formData.images.length,
        success: async (res) => {
          for (const path of res.tempFilePaths) {
            try {
              const result = await uploadImage(path)
              this.formData.images.push(result.url)
            } catch (e) {
              console.error('上传失败', e)
            }
          }
        }
      })
    },
    removeImage(index) {
      this.formData.images.splice(index, 1)
    },
    async handlePublish() {
      if (!this.formData.title) {
        uni.showToast({ title: '请输入标题', icon: 'none' })
        return
      }

      this.loading = true
      try {
        const data = {
          title: this.formData.title,
          content: this.formData.content,
          images: JSON.stringify(this.formData.images),
          category: this.categories[this.categoryIndex].value,
          stage: this.stages[this.stageIndex].value,
          is_public: this.formData.isPublic ? 1 : 0,
          status: this.formData.status
        }
        await createNote(data)
        uni.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (e) {
        uni.showToast({ title: '发布失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.publish-page {
  background: #F5F6FA;

  padding-bottom: env(safe-area-inset-bottom);
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: #fff;
  border-bottom: 1rpx solid #F3F4F6;
}

.back-btn {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
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
  flex: 1;
  text-align: center;
}

.header-right {
  width: 120rpx;
  display: flex;
  justify-content: flex-end;
}

.publish-btn {
  padding: 12rpx 32rpx;
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  border-radius: 9999rpx;
  border: none;
  line-height: 1.2;
}

.publish-btn[disabled] {
  opacity: 0.6;
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

/* 标题输入 */
.title-item {
  border-bottom: 1rpx solid #F3F4F6;
  padding-bottom: 24rpx;
}

.title-input {
  width: 100%;
  font-size: 36rpx;
  font-weight: bold;
  color: #111827;
}

/* 内容输入 */
.content-item {
  margin-top: 24rpx;
}

.content-input {
  width: 100%;
  min-height: 300rpx;
  font-size: 30rpx;
  line-height: 1.8;
  color: #374151;
}

/* 标签样式 */
.form-label {
  font-size: 28rpx;
  color: #6B7280;
  margin-bottom: 16rpx;
}

/* 图片网格 */
.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 16rpx;
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
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #D1D5DB;
}

.add-icon {
  font-size: 48rpx;
}

.add-text {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 8rpx;
}

/* 选择器 */
.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #F3F4F6;
  border-radius: 24rpx;
}

.picker-text {
  font-size: 30rpx;
  color: #1F2937;
}

.arrow-icon {
  font-size: 32rpx;
  color: #9CA3AF;
}

/* 开关 */
.switch-item {
  background: #F9FAFB;
  margin: 0 -32rpx;
  padding: 24rpx 32rpx;
  border-radius: 0;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-info {
  display: flex;
  flex-direction: column;
}

.switch-label {
  font-size: 30rpx;
  color: #1F2937;
  font-weight: 500;
}

.switch-desc {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 4rpx;
}

.switch-wrapper {
  width: 100rpx;
  height: 56rpx;
  background: #E5E7EB;
  border-radius: 28rpx;
  position: relative;
  transition: background 0.3s;
}

.switch-wrapper.active {
  background: #6366F1;
}

.switch-thumb {
  width: 48rpx;
  height: 48rpx;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  transition: transform 0.3s;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.switch-wrapper.active .switch-thumb {
  transform: translateX(44rpx);
}
</style>
