<template>
  <view class="analysis-result-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="page-title">AI户型分析</text>
      <view class="header-right">
<!--        <text class="action-btn" @click="handleCopy">复制</text>-->
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content-scroll" scroll-y>
      <view class="content-wrapper">
        <!-- 上传的户型图 -->
        <view class="uploaded-image-card" v-if="uploadedImage">
          <view class="card-title">
            <text class="title-icon">📐</text>
            <text>上传的户型图</text>
          </view>
          <image :src="uploadedImage" class="uploaded-image" mode="aspectFit"></image>
        </view>

        <!-- AI分析结果 -->
        <view class="analysis-card">
          <view class="card-title">
            <text class="title-icon">🤖</text>
            <text>AI分析结果</text>
          </view>
          <view class="analysis-content">
            <rich-text :nodes="formattedAnalysis"></rich-text>
          </view>
        </view>

        <!-- 预留效果图位置 -->
        <view class="generated-image-card">
          <view class="card-title">
            <text class="title-icon">🎨</text>
            <text>效果图</text>
          </view>
          <view class="image-placeholder" v-if="!generatedImage">
            <view class="placeholder-content">
              <text class="placeholder-icon">🖼️</text>
              <text class="placeholder-text">效果图将在这里展示</text>
            </view>
          </view>
          <view class="generated-image-wrapper" v-else>
            <image :src="generatedImage" class="generated-image" mode="aspectFit" @click="previewImage"></image>
            <view class="image-actions">
              <view class="action-btn" @click="saveImage">
                <text class="btn-icon">💾</text>
                <text class="btn-text">保存图片</text>
              </view>
              <view class="action-btn" @click="regeneratePrompt">
                <text class="btn-icon">🔄</text>
                <text class="btn-text">重新生成</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 生成按钮 -->
        <view class="generate-section" v-if="!generatedImage">
          <button class="btn-generate" :disabled="loading" @click="handleGenerateImage">
            {{ loading ? '生成中...' : '生成效果图' }}
          </button>
        </view>
      </view>
    </scroll-view>

    <!-- AI Loading 遮罩 -->
    <view class="loading-overlay" v-if="loading">
      <view class="loading-card">
        <view class="robot-container">
          <text class="robot-icon">🤖</text>
          <view class="robot-antenna"></view>
        </view>
        <view class="loading-text">
          <text class="main-text">{{ loadingText }}</text>
          <view class="loading-dots">
            <text class="dot">.</text>
            <text class="dot">.</text>
            <text class="dot">.</text>
          </view>
        </view>
        <view class="loading-tips">
          <text class="tip-text">请稍候...</text>
        </view>
        <view class="progress-bar">
          <view class="progress-inner"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      uploadedImage: '',
      localFilePath: '',  // 本地文件路径，用于传递给 AI 生成图片
      analysisResult: '',
      imagePrompt: '',
      generatedImage: '',
      loading: true,
      loadingText: 'AI 分析中',
      style: '',
      room: '',
      requirement: ''
    }
  },
  computed: {
    formattedAnalysis() {
      if (!this.analysisResult) return ''
      return this.analysisResult
        .split('\n')
        .map(line => {
          const trimmed = line.trim()
          if (!trimmed) return '<br/>'
          // 处理标题
          if (trimmed.startsWith('#') || /^[一二三四五六七]、/.test(trimmed)) {
            return `<p style="font-size: 32rpx; font-weight: bold; color: #1F2937; margin: 24rpx 0 12rpx;">${trimmed}</p>`
          }
          // 处理列表
          if (/^[-*•]\s/.test(trimmed)) {
            return `<p style="padding-left: 16rpx; margin: 8rpx 0; color: #4B5563;">${trimmed}</p>`
          }
          // 处理表格
          if (trimmed.startsWith('|')) {
            const cells = trimmed.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
            return `<p style="margin: 4rpx 0; color: #4B5563;">${cells.map(c => c.trim()).join(' | ')}</p>`
          }
          return `<p style="margin: 8rpx 0; color: #4B5563; line-height: 1.8;">${trimmed}</p>`
        })
        .join('')
    }
  },
  onLoad(options) {
    // 检查是否有 ID 参数（从历史记录进入）
    if (options.id) {
      this.loadFromHistory(options.id)
      return
    }
    // 正常分析流程
    this.loadAndAnalyze()
  },
  methods: {
    async loadFromHistory(id) {
      this.loading = true
      try {
        const { getRenderRecordDetail } = await import('../../api/ai')
        const record = await getRenderRecordDetail(id)

        let params = {}
        try {
          if (record.params) {
            params = JSON.parse(record.params)
          }
        } catch (e) {}

        this.uploadedImage = record.source_img || ''
        this.analysisResult = record.analysis_result || ''
        this.imagePrompt = record.prompt || ''
        this.generatedImage = record.generated_img || ''
        this.style = params.style || ''
        this.room = params.room || ''
        this.requirement = params.requirement || ''
      } catch (e) {
        console.error('加载历史记录失败:', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    async loadAndAnalyze() {
      this.loading = true
      this.loadingText = 'AI 分析中'

      try {
        // 获取上传数据
        const uploadDataStr = uni.getStorageSync('imageAnalysisUploadData')
        if (!uploadDataStr) {
          uni.showToast({ title: '数据加载失败', icon: 'none' })
          uni.navigateBack()
          return
        }

        const uploadData = JSON.parse(uploadDataStr)
        this.uploadedImage = uploadData.uploadedImage || ''
        this.localFilePath = uploadData.localFilePath || ''  // 保存本地文件路径
        this.style = uploadData.style || ''
        this.room = uploadData.room || ''
        this.requirement = uploadData.requirement || ''

        // 调用 AI 分析
        console.log('开始调用 analyzeFloorPlan')
        const { analyzeFloorPlan } = await import('../../utils/ai')
        const result = await analyzeFloorPlan({
          imageUrl: uploadData.uploadedImage,
          localFilePath: uploadData.localFilePath,
          style: uploadData.style,
          room: uploadData.room,
          requirement: uploadData.requirement
        })
        console.log('analyzeFloorPlan 返回结果:', result)

        this.analysisResult = result.analysis
        this.imagePrompt = result.prompt
        console.log('分析完成，准备生成图片')
        console.log('this.imagePrompt:', this.imagePrompt)

        // 分析成功后，自动调用图片生成
        await this.handleGenerateImage()

      } catch (e) {
        console.error('AI 分析失败:', e)
        console.error('错误详情:', e.message || e)
        uni.showToast({ title: '分析失败，请重试', icon: 'none' })
        this.loading = false
      }
    },
    goBack() {
      uni.navigateBack()
    },
    handleCopy() {
      const text = `【户型分析】\n${this.analysisResult}\n\n【生图提示词】\n${this.imagePrompt}`
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '已复制', icon: 'success' })
        }
      })
    },
    copyPrompt() {
      uni.setClipboardData({
        data: this.imagePrompt,
        success: () => {
          uni.showToast({ title: '提示词已复制', icon: 'success' })
        }
      })
    },
    previewImage() {
      if (this.generatedImage) {
        uni.previewImage({ urls: [this.generatedImage] })
      }
    },
    saveImage() {
      if (!this.generatedImage) return

      uni.showLoading({ title: '保存中...' })

      // 如果是 Agnes CDN 的图片，需要通过代理下载以解决跨域问题
      if (this.generatedImage.includes('platform-outputs.agnes-ai')) {
        const proxyUrl = this.generatedImage.replace('https://platform-outputs.agnes-ai.space', '/agnes-cdn')
        this.downloadAndSave(proxyUrl)
      } else if (this.generatedImage.startsWith('http')) {
        this.downloadAndSave(this.generatedImage)
      } else {
        // 本地图片直接保存
        uni.saveImageToPhotosAlbum({
          filePath: this.generatedImage,
          success: () => {
            uni.hideLoading()
            uni.showToast({ title: '保存成功', icon: 'success' })
          },
          fail: (err) => {
            uni.hideLoading()
            console.error('保存失败:', err)
            uni.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      }
    },
    downloadAndSave(url) {
      uni.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                uni.hideLoading()
                uni.showToast({ title: '保存成功', icon: 'success' })
              },
              fail: (err) => {
                uni.hideLoading()
                console.error('保存失败:', err)
                // 如果 uni API 失败，尝试使用 H5 API
                this.saveImageH5(res.tempFilePath)
              }
            })
          } else {
            uni.hideLoading()
            uni.showToast({ title: '下载失败', icon: 'none' })
          }
        },
        fail: (err) => {
          uni.hideLoading()
          console.error('下载失败:', err)
          uni.showToast({ title: '下载失败', icon: 'none' })
        }
      })
    },
    saveImageH5(dataUrl) {
      // H5 环境使用 base64 保存
      if (!dataUrl) {
        uni.showToast({ title: '保存失败', icon: 'none' })
        return
      }
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `装修效果图_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      uni.showToast({ title: '已触发下载', icon: 'success' })
    },
    regeneratePrompt() {
      // 重新执行完整 AI 流程
      this.loading = true
      this.loadingText = 'AI 重新分析中'
      this.generatedImage = ''  // 清空当前图片
      this.analysisResult = ''  // 清空分析结果
      this.imagePrompt = ''      // 清空提示词

      this.loadAndAnalyze()
    },
    async handleGenerateImage() {
      console.log('handleGenerateImage 被调用，this.imagePrompt:', this.imagePrompt)
      if (!this.imagePrompt) {
        uni.showToast({ title: '请先生成分析结果', icon: 'none' })
        return
      }

      this.loading = true
      this.loadingText = 'AI 渲染中'

      try {
        const { generateImage, getImageBase64 } = await import('../../utils/ai')
        const { saveRenderRecord } = await import('../../api/ai')

        // 准备参考图片（户型图）
        let referenceImage = null
        let referenceImageType = 'url'

        // 优先使用本地文件路径转换为 base64
        if (this.localFilePath) {
          console.log('有 localFilePath，尝试转换为 base64')
          try {
            referenceImage = await getImageBase64(this.localFilePath)
            // getImageBase64 返回的已经是 data:image/xxx;base64,xxx 格式
            // Agnes AI 需要去掉前缀，直接传 base64 数据
            const base64Match = referenceImage.match(/base64,(.+)/)
            referenceImage = base64Match ? base64Match[1] : referenceImage
            referenceImageType = 'base64'
            console.log('使用本地文件转换为 base64 传递户型图')
          } catch (e) {
            console.error('转换本地图片失败:', e)
            // 转换失败，尝试使用 uploadedImage
            if (this.uploadedImage) {
              referenceImage = this.uploadedImage
              referenceImageType = 'url'
              console.log('转换失败，使用 uploadedImage')
            }
          }
        } else if (this.uploadedImage) {
          // 如果有 uploadedImage，尝试转换为 base64
          console.log('没有 localFilePath，尝试将 uploadedImage 转换为 base64')
          try {
            referenceImage = await getImageBase64(this.uploadedImage)
            const base64Match = referenceImage.match(/base64,(.+)/)
            referenceImage = base64Match ? base64Match[1] : referenceImage
            referenceImageType = 'base64'
            console.log('uploadedImage 转换为 base64 成功')
          } catch (e) {
            console.error('uploadedImage 转换 base64 失败:', e)
            // 如果 uploadedImage 不包含 localhost（公开 URL），可以直接使用
            if (!this.uploadedImage.includes('localhost')) {
              referenceImage = this.uploadedImage
              referenceImageType = 'url'
            } else {
              console.error('无法获取图片，uploadedImage 是本地地址')
            }
          }
        }

        const imageUrl = await generateImage(this.imagePrompt, {
          n: 1,
          size: '1024x1024',
          referenceImage: referenceImage,
          referenceImageType: referenceImageType
        })
        this.generatedImage = imageUrl

        // 如果是 base64 图片，先上传到服务器
        let savedImageUrl = imageUrl
        if (imageUrl.startsWith('data:')) {
          try {
            const { uploadAiImage } = await import('../../utils/ai')
            savedImageUrl = await uploadAiImage(imageUrl)
          } catch (e) {
            console.error('上传图片失败，使用原始 base64:', e)
          }
        }

        // 保存到后端
        try {
          await saveRenderRecord({
            source_img: this.uploadedImage,
            prompt: this.imagePrompt,
            analysis_result: this.analysisResult,
            generated_img: savedImageUrl,
            style: this.style,
            room: this.room,
            requirement: this.requirement
          })
        } catch (e) {
          console.error('保存记录失败:', e)
        }

        uni.showToast({ title: '生成成功', icon: 'success' })
      } catch (e) {
        console.error('生成失败:', e)
        uni.showToast({ title: '生成失败，请重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.analysis-result-page {
  min-height: 100vh;
  background: #F5F6FA;
  display: flex;
  flex-direction: column;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn { width: 60rpx; }

.back-icon {
  font-size: 60rpx;
  color: #fff;
  font-weight: bold;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  flex: 1;
  text-align: center;
}

.header-right { width: 100rpx; display: flex; justify-content: flex-end; }

.action-btn {
  font-size: 28rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 12rpx 24rpx;
  border-radius: 9999rpx;
}

/* 内容区域 */
.content-scroll {
  flex: 1;
  height: calc(100vh - 100rpx);
}

.content-wrapper {
  padding: 32rpx 48rpx;
  padding-bottom: 120rpx;
}

/* 卡片样式 */
.uploaded-image-card,
.analysis-card,
.prompt-card,
.generated-image-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 30rpx;
  font-weight: bold;
  color: #1F2937;
  margin-bottom: 24rpx;
}

.title-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

/* 上传的户型图 */
.uploaded-image {
  width: 100%;
  height: 400rpx;
  border-radius: 16rpx;
  background: #f8f8f8;
}

/* 分析结果 */
.analysis-content {
  font-size: 28rpx;
  line-height: 1.8;
  color: #4B5563;
}

/* 提示词 */
.prompt-content {
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.prompt-text {
  font-size: 28rpx;
  line-height: 1.8;
  color: #374151;
}

.prompt-actions {
  display: flex;
  justify-content: flex-end;
}

.copy-prompt-btn {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  background: #F3F4F6;
  border-radius: 32rpx;
}

.btn-icon { font-size: 28rpx; margin-right: 8rpx; }
.btn-text { font-size: 26rpx; color: #4B5563; }

/* 预留效果图位置 */
.image-placeholder {
  width: 100%;
  height: 400rpx;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
  border-radius: 16rpx;
  border: 2rpx dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.placeholder-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.placeholder-text { font-size: 28rpx; color: #9ca3af; }

.generated-image-wrapper { width: 100%; }

.generated-image {
  width: 100%;
  height: 500rpx;
  border-radius: 16rpx;
  background: #f8f8f8;
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin-top: 20rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 32rpx;
  background: #f8f8f8;
  border-radius: 32rpx;
}

/* 生成按钮 */
.generate-section {
  margin-top: 20rpx;
}

.btn-generate {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-generate[disabled] { opacity: 0.7; }

/* AI Loading */
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

.robot-container {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.robot-icon {
  font-size: 120rpx;
  animation: bounce 1s ease-in-out infinite;
}

.robot-antenna {
  width: 8rpx;
  height: 20rpx;
  background: #667eea;
  border-radius: 4rpx;
  margin-top: -10rpx;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
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

.loading-tips { margin-bottom: 30rpx; }
.tip-text { font-size: 26rpx; color: #9CA3AF; }

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
