<template>
  <view class="edit-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 编辑表单 -->
    <view v-else class="form-card">
      <view class="form-item">
        <input type="text" v-model="formData.title" placeholder="标题" class="title-input" />
      </view>

      <view class="form-item">
        <textarea v-model="formData.content" placeholder="分享你的装修经验、心得..." class="content-input" />
      </view>

      <view class="form-item">
        <view class="form-label">图片</view>
        <view class="images-grid">
          <view class="image-item" v-for="(img, index) in formData.images" :key="index">
            <image
              :src="img"
              mode="aspectFill"
              class="preview-image"
              @error="onImageError(index)"
            ></image>
            <view class="delete-btn" @click="removeImage(index)">×</view>
          </view>
          <view class="add-image" @click="chooseImage" v-if="formData.images.length < 9">
            <text class="icon">+</text>
            <text class="text">添加图片</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">分类</view>
        <picker :value="categoryIndex" :range="categories" range-key="label" @change="onCategoryChange">
          <view class="picker-value">
            {{ categories[categoryIndex]?.label || '请选择' }}
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">装修阶段</view>
        <picker :value="stageIndex" :range="stages" range-key="label" @change="onStageChange">
          <view class="picker-value">
            {{ stages[stageIndex]?.label || '请选择' }}
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <view class="switch-row">
          <text>公开笔记</text>
          <switch :checked="formData.isPublic" @change="onSwitchChange" color="#2979ff" />
        </view>
      </view>
    </view>

    <view class="btn-wrapper">
      <button class="btn-save" :disabled="loading" @click="handleSave">
        {{ loading ? '保存中...' : '保存修改' }}
      </button>
    </view>
  </view>
</template>

<script>
import { getNoteDetail, updateNote } from '../../api/note'
import { NOTE_CATEGORIES, DECORATION_STAGES } from '../../utils/const'
import { uploadImage } from '../../api/house'

export default {
  data() {
    return {
      noteId: null,
      loading: true,
      saving: false,
      categories: NOTE_CATEGORIES,
      stages: DECORATION_STAGES,
      categoryIndex: 0,
      stageIndex: 0,
      formData: {
        title: '',
        content: '',
        images: [],
        isPublic: false
      }
    }
  },
  onLoad(options) {
    this.noteId = options.id
    if (this.noteId) {
      this.loadNote()
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
  },
  methods: {
    async loadNote() {
      try {
        const res = await getNoteDetail(this.noteId)
        console.log('加载笔记响应:', res)
        console.log('原始images字段:', res.images)
        const images = this.parseImages(res.images)
        console.log('解析后images:', images)
        this.formData = {
          title: res.title || '',
          content: res.content || '',
          images: images,
          isPublic: res.is_public === 1
        }
        // 设置分类索引
        const catIdx = this.categories.findIndex(c => c.value === res.category)
        this.categoryIndex = catIdx >= 0 ? catIdx : 0
        // 设置阶段索引
        const stageIdx = this.stages.findIndex(s => s.value === res.stage)
        this.stageIndex = stageIdx >= 0 ? stageIdx : 0
      } catch (e) {
        console.error('加载笔记失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    parseImages(images) {
      if (!images) return []
      // 如果已经是数组，直接返回
      if (Array.isArray(images)) return images
      // 如果是字符串，尝试解析
      try {
        const parsed = JSON.parse(images)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    },
    onCategoryChange(e) {
      this.categoryIndex = e.detail.value
    },
    onStageChange(e) {
      this.stageIndex = e.detail.value
    },
    onSwitchChange(e) {
      this.formData.isPublic = e.detail.value
    },
    async chooseImage() {
      uni.chooseImage({
        count: 9 - this.formData.images.length,
        success: async (res) => {
          for (const path of res.tempFilePaths) {
            try {
              uni.showLoading({ title: '上传中...' })
              const result = await uploadImage(path)
              this.formData.images.push(result.url)
              uni.hideLoading()
            } catch (e) {
              uni.hideLoading()
              console.error('上传失败', e)
              uni.showToast({ title: '上传失败', icon: 'none' })
            }
          }
        },
        fail: (err) => {
          console.error('选择图片失败', err)
        }
      })
    },
    removeImage(index) {
      this.formData.images.splice(index, 1)
    },
    onImageError(index) {
      console.error('图片加载失败:', index)
    },
    async handleSave() {
      if (!this.formData.title) {
        uni.showToast({ title: '请输入标题', icon: 'none' })
        return
      }

      this.saving = true
      try {
        await updateNote(this.noteId, {
          title: this.formData.title,
          content: this.formData.content,
          images: JSON.stringify(this.formData.images),
          category: this.categories[this.categoryIndex].value,
          stage: this.stages[this.stageIndex].value,
          is_public: this.formData.isPublic ? 1 : 0
        })
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      } catch (e) {
        console.error('保存失败', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.edit-page {

  background: #f8f8f8;
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
  font-size: 28rpx;
}

.form-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.title-input {
  font-size: 32rpx;
  font-weight: bold;
  border-bottom: 1rpx solid #f5f5f5;
  padding-bottom: 20rpx;
}

.content-input {
  width: 100%;
  min-height: 300rpx;
  font-size: 28rpx;
  line-height: 1.6;
}

.form-label {
  font-size: 30rpx;
  color: #303133;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #dcdee0;
}

.add-image .icon {
  font-size: 60rpx;
  color: #909399;
}

.add-image .text {
  font-size: 24rpx;
  color: #909399;
  margin-top: 10rpx;
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

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 30rpx;
  color: #303133;
}

.btn-wrapper {
  padding: 30rpx;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
}

.btn-save {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn-save[disabled] {
  opacity: 0.7;
}
</style>
