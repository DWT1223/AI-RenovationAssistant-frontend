<template>
  <view class="plan-result-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="page-title">装修方案</text>
      <view class="header-right">
<!--        <text class="action-btn" @click="handleCopy">复制</text>-->
      </view>
    </view>

    <!-- 方案内容 -->
    <scroll-view class="content-scroll" scroll-y>
      <view class="content-wrapper">
        <!-- 卡片头部 -->
        <view class="result-card">
          <view class="card-header">
            <view class="header-icon">
              <text>📋</text>
            </view>
            <view class="header-info">
              <text class="header-title">AI智能装修方案</text>
              <text class="header-time">{{ formattedTime }}</text>
            </view>
          </view>
        </view>

        <!-- 基本信息 -->
        <view class="info-card">
          <view class="info-title">
            <text class="info-icon">🏠</text>
            <text>基本信息</text>
          </view>
          <view class="info-grid">
            <view class="info-item">
              <text class="info-label">户型</text>
              <text class="info-value">{{ params.house_type }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">面积</text>
              <text class="info-value">{{ params.area }}㎡</text>
            </view>
            <view class="info-item">
              <text class="info-label">风格</text>
              <text class="info-value">{{ params.style }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">预算</text>
              <text class="info-value">{{ params.budget }}</text>
            </view>
          </view>
        </view>

        <!-- 方案内容 -->
        <view class="content-card">
          <view class="content-title">
            <text class="title-icon">✨</text>
            <text>装修方案</text>
          </view>
          <view class="content-body" v-if="content">
            <rich-text :nodes="formattedContent"></rich-text>
          </view>
          <view class="empty-content" v-else>
            <text class="empty-text">暂无方案内容</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-card">
          <button class="action-btn share" @click="handleCopy">
            <text class="btn-icon">📋</text>
            <text>复制方案</text>
          </button>
        </view>

        <!-- 底部提示 -->
        <view class="tip-section">
          <text class="tip-text">💡 温馨提示：建议保存到笔记以便随时查看，也可以分享给家人参考</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      content: '',
      params: {
        house_type: '',
        area: '',
        style: '',
        budget: ''
      },
      createdTime: ''
    }
  },
  computed: {
    formattedTime() {
      if (!this.createdTime) return ''
      const date = new Date(this.createdTime)
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    formattedContent() {
      if (!this.content) return ''

      // 将内容按段落分割并美化显示
      const lines = this.content.split('\n')
      let html = ''

      lines.forEach(line => {
        const trimmed = line.trim()
        if (!trimmed) {
          html += '<br/>'
          return
        }

        // 一级标题（以 # 开头或中文大写数字开头）
        if (trimmed.startsWith('# ') || /^[一二三四五六七]、/.test(trimmed)) {
          const text = trimmed.replace(/^#+\s*/, '').replace(/^[一二三四五六七]、/, '')
          html += `<div style="font-size: 36rpx; font-weight: bold; color: #1F2937; margin: 32rpx 0 16rpx; padding-left: 0;">${text}</div>`
          return
        }

        // 二级标题
        if (trimmed.startsWith('## ') || /^\d+\./.test(trimmed)) {
          const text = trimmed.replace(/^##+\s*/, '').replace(/^\d+\.\s*/, '')
          html += `<div style="font-size: 32rpx; font-weight: bold; color: #374151; margin: 24rpx 0 12rpx;">${text}</div>`
          return
        }

        // 三级标题
        if (trimmed.startsWith('### ')) {
          const text = trimmed.replace(/^###+\s*/, '')
          html += `<div style="font-size: 30rpx; font-weight: 600; color: #4B5563; margin: 20rpx 0 10rpx;">${text}</div>`
          return
        }

        // 列表项（以 -、*、• 开头）
        if (/^[-*•]\s/.test(trimmed)) {
          const text = trimmed.replace(/^[-*•]\s*/, '')
          html += `<div style="display: flex; align-items: flex-start; margin: 8rpx 0; padding-left: 16rpx;">
            <span style="color: #8B5CF6; margin-right: 12rpx;">•</span>
            <span style="color: #4B5563; line-height: 1.8; flex: 1;">${text}</span>
          </div>`
          return
        }

        // 表格行（包含 | 的行）
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          // 跳过表头分隔符行
          if (/^[\|\s\-:]+$/.test(trimmed)) {
            return
          }

          const cells = trimmed.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1)
          const isHeader = html.endsWith('<br/><br/>')

          if (isHeader) {
            // 表格标题行
            html += `<div style="display: flex; background: #F3F4F6; border-radius: 8rpx; margin: 8rpx 0;">`
            cells.forEach(cell => {
              html += `<div style="flex: 1; padding: 16rpx; font-size: 26rpx; font-weight: bold; color: #374151; text-align: center;">${cell.trim()}</div>`
            })
            html += `</div>`
          } else {
            html += `<div style="display: flex; border-bottom: 1rpx solid #E5E7EB;">`
            cells.forEach((cell, idx) => {
              const isFirst = idx === 0
              html += `<div style="flex: 1; padding: 16rpx; font-size: 26rpx; color: #4B5563; ${isFirst ? 'font-weight: 500;' : 'text-align: center;'}">${cell.trim()}</div>`
            })
            html += `</div>`
          }
          return
        }

        // 普通段落 - 检查是否包含表格后需要闭合
        html += `<p style="color: #4B5563; line-height: 1.8; margin: 8rpx 0; font-size: 28rpx;">${trimmed}</p>`
      })

      return html
    },
    // 精简后的内容用于保存为笔记
    simplifiedContent() {
      if (!this.content) return ''
      return this.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.match(/^#{1,3}\s/)) // 移除Markdown标题符号
        .filter(line => !/^[\|=\-:\s]+$/.test(line)) // 移除表格分隔符
        .map(line => {
          // 移除表格标记符
          if (line.startsWith('|') && line.endsWith('|')) {
            return line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim()).join(' | ')
          }
          return line.replace(/^[-*•]\s/, '')
        })
        .join('\n')
    }
  },
  onLoad(options) {
    // 优先从 URL 参数获取（兼容短内容）
    if (options.content) {
      this.content = decodeURIComponent(options.content)
    }
    if (options.params) {
      try {
        this.params = JSON.parse(decodeURIComponent(options.params))
      } catch (e) {
        console.error('解析参数失败', e)
      }
    }
    this.createdTime = options.time || new Date().toISOString()

    // 从本地存储获取（长内容场景）
    const storageContent = uni.getStorageSync('aiPlanContent')
    const storageParams = uni.getStorageSync('aiPlanParams')
    const storageTime = uni.getStorageSync('aiPlanTime')

    if (storageContent) {
      this.content = storageContent
    }
    if (storageParams) {
      try {
        this.params = JSON.parse(storageParams)
      } catch (e) {
        console.error('解析存储参数失败', e)
      }
    }
    if (storageTime) {
      this.createdTime = storageTime
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    handleCopy() {
      uni.setClipboardData({
        data: this.content,
        success: () => {
          uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
        },
        fail: () => {
          uni.showToast({ title: '复制失败', icon: 'none' })
        }
      })
    },
    handleSaveAsNote() {
      // 生成标题
      const title = `${this.params.style}风格${this.params.house_type}装修方案`
      // 精简内容
      const noteContent = `${title}\n\n${this.simplifiedContent}`

      uni.navigateTo({
        url: `/pages/notes/publish?title=${encodeURIComponent(title)}&content=${encodeURIComponent(noteContent)}`
      })
    }
  }
}
</script>

<style scoped>
.plan-result-page {
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

.back-btn {
  width: 60rpx;
}

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

.header-right {
  width: 100rpx;
  display: flex;
  justify-content: flex-end;
}

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

/* 卡片通用样式 */
.result-card,
.info-card,
.content-card,
.action-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
}

.header-icon {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1F2937;
  margin-bottom: 8rpx;
}

.header-time {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 基本信息 */
.info-title,
.content-title {
  display: flex;
  align-items: center;
  font-size: 30rpx;
  font-weight: bold;
  color: #1F2937;
  margin-bottom: 24rpx;
}

.info-icon,
.title-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 20rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
}

.info-label {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
}

/* 方案内容 */
.content-body {
  font-size: 28rpx;
  line-height: 1.8;
  color: #4B5563;
  word-break: break-all;
}

.content-body :global(p) {
  margin: 12rpx 0;
  color: #4B5563;
}

.empty-content {
  padding: 60rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #9CA3AF;
}

/* 操作按钮 */
.action-card {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
}

.action-card .action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
}

.action-btn.save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.action-btn.share {
  background: #F3F4F6;
  color: #4B5563;
}

.btn-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

/* 提示 */
.tip-section {
  text-align: center;
  padding: 20rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #9CA3AF;
}
</style>
