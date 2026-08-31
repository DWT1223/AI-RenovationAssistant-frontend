<template>
  <view class="style-detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 风格封面 -->
      <view class="style-header" :style="getStyleBg(style)">
        <text class="style-emoji">{{ getStyleEmoji(style) }}</text>
        <text class="style-title">{{ style.name || '' }}</text>
      </view>

      <!-- 风格介绍 -->
      <view class="section" v-if="style.description">
        <view class="section-title">风格介绍</view>
        <view class="section-content">{{ style.description }}</view>
      </view>

      <!-- 配色方案 -->
      <view class="section" v-if="style.color_scheme">
        <view class="section-title">配色方案</view>
        <view class="section-content">{{ style.color_scheme }}</view>
      </view>

      <!-- 主材搭配 -->
      <view class="section" v-if="style.material">
        <view class="section-title">主材搭配</view>
        <view class="section-content">{{ style.material }}</view>
      </view>

      <!-- 适配户型 -->
      <view class="section" v-if="style.suitable">
        <view class="section-title">适配户型</view>
        <view class="section-content">{{ style.suitable }}</view>
      </view>

      <!-- 优缺点 -->
      <view class="section-row" v-if="style.pros || style.cons">
        <view class="pros-section" v-if="style.pros">
          <view class="pros-title">优点</view>
          <view class="pros-content">{{ style.pros }}</view>
        </view>
        <view class="cons-section" v-if="style.cons">
          <view class="cons-title">缺点</view>
          <view class="cons-content">{{ style.cons }}</view>
        </view>
      </view>
    </template>

    <!-- 操作按钮 -->
    <view class="action-bar">
      <button class="action-btn collect-btn" :class="{ collected: isFavorited }" @click="handleCollect">
        <text>{{ isFavorited ? '⭐' : '☆' }}</text>
        <text>{{ isFavorited ? '已收藏' : '收藏' }}</text>
      </button>
      <button class="action-btn apply-btn" @click="handleApply">
        <text>应用此风格</text>
      </button>
    </view>
  </view>
</template>

<script>
import { getStyleDetail } from '../../api/style'
import { createCollect, deleteCollect } from '../../api/collect'
import { useUserStore } from '../../store/user'

export default {
  data() {
    return {
      style: {},
      loading: true,
      styleId: null,
      isFavorited: false,
      collectId: null
    }
  },
  onLoad(options) {
    if (options.id) {
      this.styleId = options.id
      this.loadStyleDetail(options.id)
    }
  },
  methods: {
    async loadStyleDetail(id) {
      this.loading = true
      try {
        const res = await getStyleDetail(id)
        this.style = res || {}
        this.isFavorited = res?.is_favorited || false
        this.collectId = res?.collect_id || null
      } catch (e) {
        console.error('加载风格详情失败', e)
      } finally {
        this.loading = false
      }
    },
    getStyleEmoji(style) {
      const emojis = {
        '现代简约': '🏢', '奶油风': '🍰', '轻奢': '✨', '原木风': '🪵',
        '北欧风': '❄️', '日式': '⛩️', '美式': '🏠', '极简': '⬜',
        '新中式': '🏯', 'ins风': '📸'
      }
      return emojis[style.name] || '🏠'
    },
    getStyleBg(style) {
      const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
      ]
      const index = (style.id || 0) % colors.length
      return { background: colors[index] }
    },
    async handleCollect() {
      const userStore = useUserStore()
      if (!userStore.isLogin) {
        uni.navigateTo({ url: '/pages/user/login' })
        return
      }

      if (this.isFavorited) {
        // 取消收藏
        await this.handleUnfavorite()
      } else {
        // 添加收藏
        await this.handleFavorite()
      }
    },
    async handleFavorite() {
      try {
        const res = await createCollect({
          target_type: 'style',
          target_id: this.styleId
        })
        this.isFavorited = true
        if (res && res.id) {
          this.collectId = res.id
        }
        uni.showToast({ title: '收藏成功', icon: 'success' })
      } catch (e) {
        console.error('收藏失败', e)
        if (e.message?.includes('已收藏')) {
          this.isFavorited = true
        } else if (e.message?.includes('登录')) {
          uni.showToast({ title: '请先登录', icon: 'none' })
        } else {
          uni.showToast({ title: '收藏失败', icon: 'none' })
        }
      }
    },
    async handleUnfavorite() {
      if (!this.collectId) return
      try {
        await deleteCollect(this.collectId)
        this.isFavorited = false
        this.collectId = null
        uni.showToast({ title: '已取消收藏', icon: 'success' })
      } catch (e) {
        console.error('取消收藏失败', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    handleApply() {
      const userStore = useUserStore()
      if (!userStore.isLogin) {
        uni.navigateTo({ url: '/pages/user/login' })
        return
      }
      uni.navigateTo({ url: `/pages/ai/plan?style_id=${this.styleId}` })
    }
  }
}
</script>

<style scoped>
.style-detail-page {

  background: #f8f8f8;
  padding-bottom: 140rpx;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  color: #909399;
  font-size: 28rpx;
}

.style-header {
  height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.style-emoji {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.style-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
}

.section {
  background: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
  margin-bottom: 20rpx;
}

.section-content {
  font-size: 28rpx;
  color: #606266;
  line-height: 1.6;
}

.section-row {
  display: flex;
  margin: 20rpx;
  gap: 20rpx;
}

.pros-section, .cons-section {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.pros-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #19be6b;
  margin-bottom: 16rpx;
}

.cons-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #fa3534;
  margin-bottom: 16rpx;
}

.pros-content, .cons-content {
  font-size: 26rpx;
  color: #606266;
  line-height: 1.6;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 48rpx;
  font-size: 28rpx;
  border: none;
}

.action-btn::after {
  border: none;
}

.collect-btn {
  width: 200rpx;
  height: 88rpx;
  background: #fff;
  border: 2rpx solid #667eea;
  color: #667eea;
  margin-right: 20rpx;
}

.collect-btn.collected {
  background: #fff8e6;
  border-color: #ff9800;
  color: #ff9800;
}

.apply-btn {
  flex: 1;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}
</style>
