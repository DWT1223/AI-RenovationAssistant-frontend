<template>
  <view class="ai-page">
    <!-- 头部 -->
    <view class="header">
      <view class="title">AI智能装修助手</view>
      <view class="subtitle">输入你的需求，AI帮你生成专属装修方案</view>
    </view>

    <!-- 功能入口 -->
    <view class="feature-grid">
      <view class="feature-card" @click="goToPlan">
        <view class="feature-icon">🤖</view>
        <view class="feature-info">
          <text class="feature-title">AI装修方案</text>
          <text class="feature-desc">输入户型、面积、风格等，生成完整装修方案</text>
        </view>
        <text class="arrow">&gt;</text>
      </view>

      <view class="feature-card" @click="goToRender">
        <view class="feature-icon">🎨</view>
        <view class="feature-info">
          <text class="feature-title">AI效果图</text>
          <text class="feature-desc">上传户型图，生成装修效果图</text>
        </view>
        <text class="arrow">&gt;</text>
      </view>
    </view>

    <!-- 使用流程 -->
    <view class="section">
      <view class="section-title">使用流程</view>
      <view class="steps">
        <view class="step">
          <view class="step-num">1</view>
          <view class="step-info">
            <text class="step-title">选择风格</text>
            <text class="step-desc">浏览并收藏喜欢的装修风格</text>
          </view>
        </view>
        <view class="step">
          <view class="step-num">2</view>
          <view class="step-info">
            <text class="step-title">填写需求</text>
            <text class="step-desc">输入户型、面积、预算等信息</text>
          </view>
        </view>
        <view class="step">
          <view class="step-num">3</view>
          <view class="step-info">
            <text class="step-title">生成方案</text>
            <text class="step-desc">AI智能生成专属装修方案</text>
          </view>
        </view>
        <view class="step">
          <view class="step-num">4</view>
          <view class="step-info">
            <text class="step-title">保存分享</text>
            <text class="step-desc">保存方案或分享给家人参考</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 历史记录 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">最近生成</text>
        <text class="section-more" @click="goToHistory">查看全部 ></text>
      </view>
      <view class="history-list">
        <view class="history-item" v-for="item in history" :key="item.id" @click="viewRecord(item)">
          <view class="history-icon">{{ item.type === 'plan' ? '📝' : '🖼️' }}</view>
          <view class="history-info">
            <text class="history-title">{{ item.type === 'plan' ? '装修方案' : '效果图' }}</text>
            <text class="history-time">{{ formatRelativeTime(item.created_at) }}</text>
          </view>
        </view>
        <EmptyState v-if="history.length === 0" text="暂无生成记录" />
      </view>
    </view>

    <!-- 对话历史 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">问答对话</text>
        <text class="section-more new-btn" @click="newChat">+ 新开对话</text>
      </view>
      <view class="session-list">
        <view
          v-for="s in chatSessions"
          :key="s.id"
          class="session-item"
          @click="continueChat(s.id)"
        >
          <view class="session-icon">💬</view>
          <view class="session-info">
            <text class="session-title">{{ s.title || '新对话' }}</text>
            <text class="session-meta">
              {{ sessionMessageCount(s) }}条消息 · {{ formatRelativeTime(s.updatedAt) }}
            </text>
          </view>
          <view class="session-delete" @click.stop="confirmDeleteSession(s)">
            <text class="delete-icon">🗑</text>
          </view>
        </view>
        <EmptyState v-if="chatSessions.length === 0" text="暂无对话记录，点击右上角开启新对话" />
      </view>
    </view>

    <!-- 悬浮 AI 问答按钮（可拖动+边缘吸附） -->
    <view
      class="float-bot"
      :style="floatStyle"
      @touchstart="onTouchStart"
      @touchmove.stop="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view class="float-pulse"></view>
      <text class="float-icon">🤖</text>
    </view>
  </view>
</template>

<script>
import EmptyState from '../../components/common/EmptyState.vue'
import { getAIRecords } from '../../api/ai'
import {
  getChatSessions as fetchBackendSessions,
  deleteChatSession as deleteBackendSession
} from '../../api/chat'
import { formatRelativeTime } from '../../utils/format'

const LOCAL_SESSIONS_KEY = 'aiChatSessions'

export default {
  components: { EmptyState },
  data() {
    return {
      history: [],
      chatSessions: [],
      // 悬浮按钮位置（px 单位，因为 touch 事件 clientX/Y 是 px）
      floatPos: { x: 0, y: 0 },
      // 标记是否处于拖动中（用于区分点击和拖动）
      floatDragging: false,
      // 触摸起始位置与按钮位置偏差（px）
      floatOffset: { x: 0, y: 0 },
      // 触摸起始点（px），用于计算是否移动过
      floatTouchStart: { x: 0, y: 0 },
      // 屏幕尺寸（px）
      sysInfo: { width: 375, height: 667 }
    }
  },
  computed: {
    floatStyle() {
      return `transform: translate(${this.floatPos.x}px, ${this.floatPos.y}px); transition: ${this.floatDragging ? 'none' : 'transform 0.3s ease'};`
    }
  },
  onLoad() {
    this.loadHistory()
    this.loadChatSessions()
    this.initFloatPos()
  },
  onShow() {
    // 从 chat 页面返回时刷新对话历史
    this.loadChatSessions()
  },
  methods: {
    initFloatPos() {
      try {
        this.sysInfo = uni.getSystemInfoSync()
      } catch (e) {}
      // 默认右下角，避开 tabbar（约 100px）
      const btnSize = 50 // 100rpx ≈ 50px
      const margin = 24
      const bottomSafe = (this.sysInfo.windowHeight || 667) - btnSize - 100
      this.floatPos = {
        x: (this.sysInfo.windowWidth || 375) - btnSize - margin,
        y: bottomSafe
      }
    },
    onTouchStart(e) {
      const touch = e.touches[0]
      this.floatTouchStart = { x: touch.clientX, y: touch.clientY }
      this.floatOffset = {
        x: touch.clientX - this.floatPos.x,
        y: touch.clientY - this.floatPos.y
      }
      this.floatDragging = true
    },
    onTouchMove(e) {
      const touch = e.touches[0]
      let x = touch.clientX - this.floatOffset.x
      let y = touch.clientY - this.floatOffset.y

      const btnSize = 50
      const margin = 10
      const maxX = (this.sysInfo.windowWidth || 375) - btnSize - margin
      const minX = margin
      // 顶部留出状态栏空间，底部留出 tabbar 空间
      const minY = (this.sysInfo.statusBarHeight || 20) + 60
      const maxY = (this.sysInfo.windowHeight || 667) - btnSize - 120

      if (x < minX) x = minX
      if (x > maxX) x = maxX
      if (y < minY) y = minY
      if (y > maxY) y = maxY

      this.floatPos = { x, y }
    },
    onTouchEnd(e) {
      const touch = (e.changedTouches && e.changedTouches[0]) || null
      // 判断是否为点击（位移小于 10px）
      let isClick = false
      if (touch) {
        const dx = touch.clientX - this.floatTouchStart.x
        const dy = touch.clientY - this.floatTouchStart.y
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          isClick = true
        }
      }
      // 边缘吸附
      const midX = (this.sysInfo.windowWidth || 375) / 2
      const btnSize = 50
      const margin = 24
      if (this.floatPos.x + btnSize / 2 < midX) {
        this.floatPos = { ...this.floatPos, x: margin }
      } else {
        this.floatPos = {
          ...this.floatPos,
          x: (this.sysInfo.windowWidth || 375) - btnSize - margin
        }
      }
      this.floatDragging = false

      if (isClick) {
        this.goToChat()
      }
    },
    goToChat() {
      // 默认点击悬浮按钮：新开对话
      uni.navigateTo({ url: '/pages/ai/chat?sessionId=new' })
    },
    newChat() {
      uni.navigateTo({ url: '/pages/ai/chat?sessionId=new' })
    },
    continueChat(sessionId) {
      uni.navigateTo({ url: `/pages/ai/chat?sessionId=${sessionId}` })
    },
    async loadChatSessions() {
      // 后端优先
      try {
        const res = await fetchBackendSessions({ page: 1, page_size: 50 })
        const items = (res && res.items) || []
        // 转为统一展示结构
        const backendList = items.map(it => ({
          id: it.id,
          title: it.title,
          messageCount: it.message_count,
          updatedAt: it.updated_at,
          source: 'backend'
        }))
        // 合并本地未同步的会话（local- 前缀）
        const localOnly = this.loadLocalSessions().filter(s => !this.existsInList(backendList, s.id))
        this.chatSessions = [...backendList, ...localOnly].sort((a, b) => {
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        })
        return
      } catch (e) {
        console.warn('后端加载对话列表失败，降级本地:', e)
      }
      // 降级到本地
      this.chatSessions = this.loadLocalSessions()
    },
    loadLocalSessions() {
      try {
        const stored = uni.getStorageSync(LOCAL_SESSIONS_KEY)
        if (Array.isArray(stored)) return stored
      } catch (e) {}
      return []
    },
    existsInList(list, id) {
      return list.some(it => String(it.id) === String(id))
    },
    sessionMessageCount(s) {
      // 后端来源：直接使用 messageCount
      if (s.source === 'backend' && typeof s.messageCount === 'number') {
        return s.messageCount
      }
      // 本地来源：使用 messages 数组长度
      return (s.messages || []).length
    },
    confirmDeleteSession(session) {
      uni.showModal({
        title: '删除对话',
        content: `确定要删除对话"${session.title || '新对话'}"吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.deleteSession(session)
          }
        }
      })
    },
    async deleteSession(session) {
      // 后端删除
      if (session.source === 'backend' || typeof session.id === 'number') {
        try {
          await deleteBackendSession(session.id)
        } catch (e) {
          console.warn('后端删除对话失败:', e)
        }
      }
      // 本地同步删除
      const filtered = this.loadLocalSessions().filter(s => String(s.id) !== String(session.id))
      try {
        uni.setStorageSync(LOCAL_SESSIONS_KEY, filtered)
      } catch (e) {
        console.error('删除本地对话失败', e)
      }
      // 立即从列表中移除
      this.chatSessions = this.chatSessions.filter(s => String(s.id) !== String(session.id))
      uni.showToast({ title: '已删除', icon: 'success' })
    },
    async loadHistory() {
      try {
        const res = await getAIRecords({ page: 1, page_size: 5 })
        this.history = res?.items || []
      } catch (e) {
        console.error('加载历史失败', e)
      }
    },
    goToPlan() {
      uni.navigateTo({ url: '/pages/ai/plan' })
    },
    goToRender() {
      uni.navigateTo({ url: '/pages/ai/render' })
    },
    goToHistory() {
      uni.navigateTo({ url: '/pages/ai/history' })
    },
    viewRecord(item) {
      if (item.type === 'render') {
        // 通过 ID 跳转到渲染图详情
        uni.navigateTo({ url: `/pages/ai/imageAnalysisResult?id=${item.id}` })
      } else {
        // 跳转到方案详情，装修方案内容保存在 analysis_result 字段
        uni.setStorageSync('aiPlanContent', item.analysis_result || '')
        uni.setStorageSync('aiPlanParams', item.params || '{}')
        uni.setStorageSync('aiPlanTime', item.created_at)
        uni.navigateTo({ url: '/pages/ai/planResult' })
      }
    },
    formatRelativeTime
  }
}
</script>

<style scoped>
.ai-page {
  background: #f8f8f8;
  padding-bottom: 30rpx;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx;
  color: #fff;
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  opacity: 0.9;
}

.feature-grid {
  padding: 30rpx;
  margin-top: 10rpx;
}

.feature-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.feature-icon {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50rpx;
  margin-right: 24rpx;
}

.feature-info {
  flex: 1;
}

.feature-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
  display: block;
  margin-bottom: 8rpx;
}

.feature-desc {
  font-size: 26rpx;
  color: #909399;
}

.arrow {
  font-size: 32rpx;
  color: #c0c4cc;
}

.section {
  padding: 30rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #303133;
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-more {
  font-size: 26rpx;
  color: #909399;
}

.section-more.new-btn {
  color: #667eea;
  font-weight: 500;
}

.steps {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.step {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.step:last-child {
  margin-bottom: 0;
}

.step-num {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.step-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #303133;
  display: block;
  margin-bottom: 6rpx;
}

.step-desc {
  font-size: 26rpx;
  color: #909399;
}

.history-list {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.history-item:last-child {
  border-bottom: none;
}

.history-icon {
  width: 80rpx;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.history-title {
  font-size: 30rpx;
  color: #303133;
  display: block;
  margin-bottom: 6rpx;
}

.history-time {
  font-size: 24rpx;
  color: #909399;
}

/* 对话会话列表 */
.session-list {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.session-item:last-child {
  border-bottom: none;
}

.session-item:active {
  background: #f8f8f8;
}

.session-icon {
  width: 72rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.session-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.session-title {
  font-size: 30rpx;
  color: #303133;
  display: block;
  margin-bottom: 8rpx;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-meta {
  font-size: 24rpx;
  color: #909399;
}

.session-delete {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.session-delete:active {
  background: #FEE2E2;
}

.delete-icon {
  font-size: 30rpx;
}

/* 悬浮机器人按钮 */
.float-bot {
  position: fixed;
  top: 0;
  left: 0;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
  z-index: 999;
  will-change: transform;
}

.float-icon {
  font-size: 52rpx;
  line-height: 1;
  pointer-events: none;
}

.float-pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.4);
  animation: pulse 2s ease-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
</style>
