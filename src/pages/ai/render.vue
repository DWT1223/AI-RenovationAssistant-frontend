<template>
  <view class="render-page">
    <!-- 提示信息 -->
    <view class="tip-card">
      <text class="tip-icon">💡</text>
      <text class="tip-text">上传户型图，AI将分析并生成效果图提示词</text>
    </view>

    <!-- 上传户型图 -->
    <view class="upload-section">
      <view class="section-title">上传户型图</view>
      <view class="upload-area" @click="chooseImage">
        <image v-if="houseImage" :src="houseImage" class="preview-image" mode="aspectFit"></image>
        <view v-else class="upload-placeholder">
          <text class="upload-icon">+</text>
          <text class="upload-text">点击上传户型图</text>
        </view>
      </view>
    </view>

    <!-- 选择风格 -->
    <view class="style-section">
      <view class="section-title">选择装修风格</view>
      <view class="style-grid">
        <view
          v-for="(style, index) in styles"
          :key="index"
          :class="['style-item', { active: selectedStyleIndex === index }]"
          @click="selectStyle(index)"
        >
          <text class="style-emoji">{{ getStyleEmoji(style) }}</text>
          <text class="style-name">{{ style }}</text>
        </view>
      </view>
    </view>

    <!-- 房间类型 -->
    <view class="room-section">
      <view class="section-title">选择房间</view>
      <view class="room-grid">
        <view
          v-for="(room, index) in rooms"
          :key="index"
          :class="['room-item', { active: selectedRoomIndex === index }]"
          @click="selectRoom(index)"
        >
          <text class="room-text">{{ room }}</text>
        </view>
      </view>
    </view>

    <!-- 需求描述 -->
    <view class="requirement-section">
      <view class="section-title">补充需求（选填）</view>
      <textarea
        v-model="requirement"
        placeholder="例如：有老人同住，需要无障碍设计；喜欢开放式厨房；有宠物需要考虑..."
        class="requirement-input"
      />
    </view>

    <!-- 生成按钮 -->
    <view class="btn-wrapper">
      <button class="btn-generate" :disabled="loading || !houseImage" @click="handleAnalyze">
        {{ loading ? '分析中...' : 'AI分析并生成提示词' }}
      </button>
    </view>

    <!-- AI Loading 遮罩 -->
    <view class="loading-overlay" v-if="loading">
      <view class="loading-card">
        <view class="ai-avatar">
          <view class="ai-face">
            <view class="ai-eye left"></view>
            <view class="ai-eye right"></view>
            <view class="ai-mouth"></view>
          </view>
          <view class="ai-brains">
            <view class="brain-wave"></view>
            <view class="brain-wave delay-1"></view>
            <view class="brain-wave delay-2"></view>
          </view>
        </view>
        <view class="loading-text">
          <text class="main-text">AI 分析中</text>
          <view class="loading-dots">
            <text class="dot">.</text>
            <text class="dot">.</text>
            <text class="dot">.</text>
          </view>
        </view>
        <view class="loading-tips">
          <text class="tip-text">正在分析户型图并生成提示词...</text>
        </view>
        <view class="progress-bar">
          <view class="progress-inner"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { uploadImage } from '../../api/house'
import { DECORATION_STYLES } from '../../utils/const'

export default {
  data() {
    return {
      styles: DECORATION_STYLES,
      rooms: ['整套房', '客厅', '卧室', '厨房', '卫生间', '餐厅', '书房', '阳台', '玄关'],
      houseImage: '',
      selectedStyleIndex: 0,
      selectedRoomIndex: 0,
      requirement: '',
      loading: false
    }
  },
  methods: {
    getStyleEmoji(style) {
      const emojis = {
        '现代简约': '🏢', '奶油风': '🍰', '轻奢': '✨', '原木风': '🪵',
        '北欧风': '❄️', '日式': '⛩️', '美式': '🏠', '极简': '⬜',
        '新中式': '🏯', 'ins风': '📸'
      }
      return emojis[style] || '🏠'
    },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.houseImage = res.tempFilePaths[0]
        }
      })
    },
    selectStyle(index) {
      this.selectedStyleIndex = index
    },
    selectRoom(index) {
      this.selectedRoomIndex = index
    },
    async handleAnalyze() {
      if (!this.houseImage) {
        uni.showToast({ title: '请先上传户型图', icon: 'none' })
        return
      }

      this.loading = true

      try {
        const style = this.styles[this.selectedStyleIndex]
        const room = this.rooms[this.selectedRoomIndex]

        // 上传图片获取URL（用于显示）
        let imageUrl = this.houseImage
        try {
          const uploadRes = await uploadImage(this.houseImage)
          imageUrl = uploadRes.url || this.houseImage
        } catch (e) {
          console.error('上传失败，使用本地路径:', e)
        }

        // 保存数据到存储
        const analysisData = {
          uploadedImage: imageUrl,
          localFilePath: this.houseImage, // 传递本地路径用于base64
          style: style,
          room: room,
          requirement: this.requirement,
          styleIndex: this.selectedStyleIndex,
          roomIndex: this.selectedRoomIndex
        }
        uni.setStorageSync('imageAnalysisUploadData', JSON.stringify(analysisData))

        // 跳转到结果页面
        uni.navigateTo({
          url: '/pages/ai/imageAnalysisResult'
        })
      } catch (e) {
        console.error('分析失败:', e)
        uni.showToast({ title: '分析失败，请重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.render-page {
  background: #f8f8f8;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.tip-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.tip-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.tip-text {
  color: #fff;
  font-size: 28rpx;
  flex: 1;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
  margin-bottom: 20rpx;
}

.upload-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.upload-area {
  width: 100%;
  height: 400rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  border: 2rpx dashed #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 80rpx;
  color: #ccc;
  line-height: 1;
}

.upload-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 16rpx;
}

.style-section,
.room-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16rpx;
}

.style-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 10rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.style-item.active {
  background: #f0e6ff;
  border-color: #764ba2;
}

.style-emoji {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.style-name {
  font-size: 22rpx;
  color: #606266;
}

.style-item.active .style-name {
  color: #764ba2;
  font-weight: 500;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.room-item {
  padding: 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  text-align: center;
  border: 2rpx solid transparent;
}

.room-item.active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.room-text {
  font-size: 28rpx;
  color: #606266;
}

.room-item.active .room-text {
  color: #1890ff;
  font-weight: 500;
}

/* 需求描述 */
.requirement-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.requirement-input {
  width: 100%;
  min-height: 160rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.btn-wrapper {
  padding: 20rpx 0;
}

.btn-generate {
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

.btn-generate[disabled] {
  opacity: 0.5;
}

/* AI Loading 遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-card {
  width: 560rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
}

.ai-avatar {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
}

.ai-face {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.ai-eye {
  width: 16rpx;
  height: 16rpx;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 40rpx;
}

.ai-eye.left { left: 30rpx; }
.ai-eye.right { right: 30rpx; }

.ai-mouth {
  width: 40rpx;
  height: 20rpx;
  border: 4rpx solid #fff;
  border-top: none;
  border-radius: 0 0 40rpx 40rpx;
  position: absolute;
  bottom: 30rpx;
  animation: talk 0.5s ease-in-out infinite alternate;
}

@keyframes talk {
  0% { height: 10rpx; }
  100% { height: 24rpx; }
}

.ai-brains {
  position: absolute;
  right: 0;
  top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.brain-wave {
  width: 30rpx;
  height: 8rpx;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4rpx;
  animation: wave 1.5s ease-in-out infinite;
}

.brain-wave.delay-1 { animation-delay: 0.2s; }
.brain-wave.delay-2 { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
  50% { opacity: 1; transform: scaleX(1.2); }
}

.loading-text {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.main-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #1F2937;
}

.loading-dots {
  display: flex;
  margin-left: 4rpx;
}

.loading-dots .dot {
  font-size: 48rpx;
  color: #667eea;
  animation: blink 1.5s ease-in-out infinite;
  line-height: 1;
}

.loading-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

.loading-tips {
  margin-bottom: 30rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #9CA3AF;
}

.progress-bar {
  width: 100%;
  height: 8rpx;
  background: #F3F4F6;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4rpx;
  animation: progress 3s ease-in-out infinite;
}

@keyframes progress {
  0% { width: 0%; }
  20% { width: 20%; }
  50% { width: 60%; }
  80% { width: 85%; }
  100% { width: 95%; }
}
</style>
