<template>
  <view class="user-page">
    <!-- 用户信息头部 -->
    <view class="user-header">
      <view class="header-content">
        <view class="header-top">
          <text class="page-title">我的</text>
          <view class="settings-btn">
            <text class="settings-icon">⚙️</text>
          </view>
        </view>

        <view v-if="!isLogin" class="guest-login-row" @click="goToLogin">
          <view class="avatar-container">
            <view class="avatar avatar-default">
              <text class="avatar-text">U</text>
            </view>
          </view>
          <view class="guest-login-content">
            <text class="guest-login-title">登录后享受更多服务</text>
            <text class="guest-login-subtitle">登录 / 注册</text>
          </view>
          <text class="guest-login-arrow">›</text>
        </view>

        <view v-else class="user-info-row">
          <view class="avatar-container">
            <image v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar" mode="aspectFill"></image>
            <view v-else class="avatar avatar-default">
              <text class="avatar-text">{{ getNicknameInitial() }}</text>
            </view>
          </view>
          <view class="user-details">
            <text class="nickname">{{ userInfo.nickname || '用户' }}</text>
            <view class="phone-row">
              <text class="phone-icon">📱</text>
              <text class="phone">{{ userInfo.phone || '未绑定手机' }}</text>
            </view>
          </view>
          <view class="edit-btn">
            <text class="edit-icon">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据统计区 -->
    <view class="stats-section">
      <view class="stats-card">
        <view class="stats-row">
          <!-- 我的收藏 -->
          <view class="stat-item" @click="goTo('/pages/user/collect')">
            <view class="stat-icon yellow-gradient">
              <text class="stat-icon-text">⭐</text>
            </view>
            <view class="stat-content">
              <text class="stat-label">我的收藏</text>
            </view>
          </view>

          <view class="stat-divider"></view>

          <!-- AI历史 -->
          <view class="stat-item" @click="goTo('/pages/ai/chatHistory')">
            <view class="stat-icon purple-gradient">
              <text class="stat-icon-text">🤖</text>
            </view>
            <view class="stat-content">
              <text class="stat-label">AI历史会话</text>
            </view>
          </view>

          <view class="stat-divider"></view>

          <!-- 账单统计 -->
          <view class="stat-item" @click="goTo('/pages/bills/stats')">
            <view class="stat-icon green-gradient">
              <text class="stat-icon-text">💰</text>
            </view>
            <view class="stat-content">
              <text class="stat-value">{{ billTotal }}</text>
              <text class="stat-label">账单统计</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单区 -->
    <view class="menu-section">
      <view class="menu-card">
        <!-- 发布笔记 -->
        <view class="menu-item" @click="goTo('/pages/notes/publish')">
          <view class="menu-icon yellow-gradient">
            <text class="menu-icon-text">📝</text>
          </view>
          <text class="menu-text">发布笔记</text>
          <text class="menu-arrow">›</text>
        </view>

        <!-- 户型图管理 -->
        <view class="menu-item" @click="goTo('/pages/house/index')">
          <view class="menu-icon blue-gradient">
            <text class="menu-icon-text">📐</text>
          </view>
          <text class="menu-text">户型图管理</text>
          <text class="menu-arrow">›</text>
        </view>

        <!-- 风格收藏 -->
        <view class="menu-item" @click="goTo('/pages/style/list?type=collected')">
          <view class="menu-icon pink-gradient">
            <text class="menu-icon-text">🏠</text>
          </view>
          <text class="menu-text">风格收藏</text>
          <text class="menu-arrow">›</text>
        </view>

        <!-- 分隔线 -->
        <view class="menu-divider"></view>

        <!-- 设置 -->
        <view class="menu-item" @click="goToSettings">
          <view class="menu-icon gray-gradient">
            <text class="menu-icon-text">⚙️</text>
          </view>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">›</text>
        </view>

        <!-- 关于我们 -->
        <view class="menu-item" @click="goToAbout">
          <view class="menu-icon blue-gradient">
            <text class="menu-icon-text">ℹ️</text>
          </view>
          <text class="menu-text">关于我们</text>
          <text class="version-text">v1.0.0</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section" v-if="isLogin" @click="handleLogout">
      <view class="logout-btn">
        <text class="logout-text">退出登录</text>
      </view>
    </view>

    <!-- TabBar占位 -->
    <view class="tabbar-placeholder"></view>
  </view>
</template>

<script>
import { useUserStore } from '../../store/user'
import { storeToRefs } from 'pinia'
import { getCollects } from '../../api/collect'
import { getBillStats } from '../../api/bill'
import { getAIRecords } from '../../api/ai'

export default {
  setup() {
    const userStore = useUserStore()
    const { isLogin, userInfo } = storeToRefs(userStore)
    return { isLogin, userInfo }
  },
  data() {
    return {
      collectCount: 0,
      aiCount: 0,
      billTotal: ''
    }
  },
  onLoad() {
    if (this.isLogin) {
      this.loadStats()
    }
  },
  onShow() {
    if (this.isLogin) {
      this.loadStats()
    }
  },
  methods: {
    getNicknameInitial() {
      const nickname = this.userInfo?.nickname
      if (!nickname) return 'U'
      return nickname.charAt(0).toUpperCase()
    },
    async loadStats() {
      // 暂时不显示数量统计
      // await Promise.all([
      //   this.loadCollectCount(),
      //   this.loadAICount(),
      //   this.loadBillStats()
      // ])
    },
    async loadCollectCount() {
      try {
        // 并行获取笔记收藏和风格收藏数量
        const [noteRes, styleRes] = await Promise.all([
          getCollects({ page: 1, page_size: 1, target_type: 'note' }),
          getCollects({ page: 1, page_size: 1, target_type: 'style' })
        ])
        const noteCount = noteRes?.total || noteRes?.items?.length || 0
        const styleCount = styleRes?.total || styleRes?.items?.length || 0
        this.collectCount = noteCount + styleCount
      } catch (e) {
        console.error('加载收藏数量失败', e)
      }
    },
    async loadAICount() {
      try {
        const res = await getAIRecords({ page: 1, page_size: 1 })
        this.aiCount = res?.total || res?.items?.length || 0
      } catch (e) {
        console.error('加载AI历史数量失败', e)
      }
    },
    async loadBillStats() {
      try {
        const res = await getBillStats()
        if (res) {
          // 根据返回的数据结构格式化
          const total = res.total_spent || res.total_amount || res.total || 0
          if (total >= 1000) {
            this.billTotal = `¥${(total / 1000).toFixed(1)}k`
          } else {
            this.billTotal = `¥${total.toFixed(0)}`
          }
        }
      } catch (e) {
        console.error('加载账单统计失败', e)
      }
    },
    goTo(url) {
      if (!this.isLogin) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      uni.navigateTo({ url })
    },
    goToLogin() {
      uni.navigateTo({ url: '/pages/user/login' })
    },
    goToSettings() {
      uni.showToast({ title: '设置功能开发中', icon: 'none' })
    },
    goToAbout() {
      uni.showToast({ title: '关于我们功能开发中', icon: 'none' })
    },
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            useUserStore().logout()
            uni.showToast({ title: '已退出登录', icon: 'success' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.user-page {
  background: #F5F6FA;
  padding-bottom: 50rpx;
}

/* 用户信息头部 */
.user-header {
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
  padding: 20rpx 32rpx 64rpx;
  border-radius: 0 0 64rpx 64rpx;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  flex-direction: column;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.settings-btn {
  width: 72rpx;
  height: 72rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-icon {
  font-size: 36rpx;
}

.user-info-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
}

.guest-login-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
}

.guest-login-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.guest-login-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12rpx;
}

.guest-login-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.guest-login-arrow {
  font-size: 56rpx;
  line-height: 1;
  color: rgba(255, 255, 255, 0.8);
}

.avatar-container {
  margin-right: 32rpx;
}

.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  box-shadow: 0 4rpx 6rpx rgba(0, 0, 0, 0.1), 0 10rpx 15rpx rgba(0, 0, 0, 0.1);
}

.avatar-default {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 56rpx;
  font-weight: bold;
  color: #6366F1;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.phone-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.phone-icon {
  font-size: 28rpx;
}

.phone {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.edit-btn {
  padding: 16rpx;
}

.edit-icon {
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.6);
}

/* 数据统计区 */
.stats-section {
  padding: 32rpx 48rpx;
  margin-top: 0rpx;
}

.stats-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 40rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1), 0 4rpx 6rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid #F3F4F6;
}

.stats-row {
  display: flex;
  align-items: center;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.stat-icon-text {
  font-size: 44rpx;
}

.yellow-gradient {
  background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);
}

.purple-gradient {
  background: linear-gradient(180deg, #C7D2FE 0%, #A5B4FC 100%);
}

.green-gradient {
  background: linear-gradient(180deg, #D1FAE5 0%, #A7F3D0 100%);
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #1F2937;
}

.stat-label {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 4rpx;
}

.stat-divider {
  width: 4rpx;
  height: 128rpx;
  background: #F3F4F6;
}

/* 功能菜单区 */
.menu-section {
  padding: 0 48rpx 32rpx;
}

.menu-card {
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #F3F4F6;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  position: relative;
}

.menu-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 32rpx;
}

.menu-icon-text {
  font-size: 40rpx;
}

.blue-gradient {
  background: linear-gradient(180deg, #DBEAFE 0%, #BFDBFE 100%);
}

.pink-gradient {
  background: linear-gradient(180deg, #FCE7F3 0%, #FBCFE8 100%);
}

.gray-gradient {
  background: #F3F4F6;
}

.menu-text {
  flex: 1;
  font-size: 32rpx;
  color: #1F2937;
  font-weight: 500;
}

.menu-arrow {
  font-size: 40rpx;
  color: #D1D5DB;
}

.menu-badge {
  background: #F3F4F6;
  border-radius: 9999rpx;
  padding: 4rpx 16rpx;
  margin-right: 16rpx;
}

.badge-text {
  font-size: 22rpx;
  color: #6B7280;
}

.version-text {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-right: 16rpx;
}

.menu-divider {
  height: 1rpx;
  background: #F3F4F6;
  margin: 0 32rpx;
}

/* 退出登录 */
.logout-section {
  padding: 0 50rpx;
}

.logout-btn {
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #F3F4F6;
}

.logout-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #EF4444;
}

.tabbar-placeholder {
  height: 120rpx;
}
</style>
