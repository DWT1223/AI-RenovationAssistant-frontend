<template>
  <view class="chat-page">
    <!-- 顶部导航 -->
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="header-title">
        <text class="title">AI 装修问答</text>
        <text class="subtitle">{{ loading ? '正在思考中...' : '随时为您解答装修问题' }}</text>
      </view>
      <view class="header-right">
        <view class="header-action" @click="goHistory">
          <text class="action-icon">📋</text>
        </view>
        <view class="header-action" @click="newChat">
          <text class="action-icon">✚</text>
        </view>
        <view class="header-action" @click="confirmDeleteCurrent">
          <text class="action-icon">🗑</text>
        </view>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      class="message-scroll"
      scroll-y
      :scroll-into-view="scrollIntoViewId"
      :style="{ height: scrollHeight + 'px' }"
    >
      <view class="message-list">
        <!-- 欢迎语 -->
        <view v-if="messages.length === 0" class="welcome-block">
          <view class="welcome-icon">🤖</view>
          <text class="welcome-title">您好，我是装修AI助手</text>
          <text class="welcome-desc">关于装修的任何问题都可以问我，比如：</text>
          <view class="suggestion-list">
            <view
              v-for="(item, idx) in suggestions"
              :key="idx"
              class="suggestion-item"
              @click="useSuggestion(item)"
            >
              <text class="suggestion-text">{{ item }}</text>
            </view>
          </view>
        </view>

        <!-- 消息项 -->
        <view
          v-for="msg in messages"
          :key="msg.id"
          :id="msg.id"
          class="message-item"
          :class="msg.role === 'user' ? 'message-user' : 'message-assistant'"
        >
          <view v-if="msg.role === 'assistant'" class="avatar avatar-bot">
            <text class="avatar-text">🤖</text>
          </view>
          <view class="bubble" :class="msg.role === 'user' ? 'bubble-user' : 'bubble-bot'">
            <text class="bubble-content">{{ msg.content }}</text>
          </view>
          <view v-if="msg.role === 'user'" class="avatar avatar-user">
            <text class="avatar-text">我</text>
          </view>
        </view>

        <!-- AI 正在输入动画 -->
        <view v-if="loading" class="message-item message-assistant" id="loading-anchor">
          <view class="avatar avatar-bot">
            <text class="avatar-text">🤖</text>
          </view>
          <view class="bubble bubble-bot bubble-loading">
            <view class="loading-dots">
              <text class="dot">.</text>
              <text class="dot">.</text>
              <text class="dot">.</text>
            </view>
          </view>
        </view>

        <view class="bottom-anchor"></view>
      </view>
    </scroll-view>

    <!-- 底部输入区 -->
    <view class="input-bar">
      <textarea
        v-model="inputText"
        class="textarea"
        placeholder="请输入您想问的装修问题..."
        :auto-height="true"
        :show-confirm-bar="false"
        :disable-scroll="true"
        @confirm="sendMessage"
        @input="onInput"
      />
      <button
        class="send-btn"
        :disabled="!inputText.trim() || loading"
        @click="sendMessage"
      >
        {{ loading ? '发送中' : '发送' }}
      </button>
    </view>
  </view>
</template>

<script>
import { chatWithAI } from '../../utils/ai'
import { formatRelativeTime } from '../../utils/format'
import {
  createChatSession,
  getChatSessionDetail,
  addChatMessage,
  updateChatSession,
  deleteChatSession
} from '../../api/chat'

const SESSIONS_KEY = 'aiChatSessions'
const LEGACY_KEY = 'aiChatHistory'
const MAX_SESSIONS = 50
const MAX_MSG_PER_SESSION = 100
const MAX_CONTEXT = 10
const SYSTEM_PROMPT = `你是一位资深的装修AI助手，拥有10年以上家装经验。请基于装修领域回答用户的提问，给出专业、实用、易懂的回答。如果用户问题与装修无关，请礼貌引导至装修话题。回答简洁有条理，重点突出。`

// 本地会话 ID 前缀（区别于后端返回的数字 ID）
const LOCAL_ID_PREFIX = 'local-'

function genLocalId() {
  return LOCAL_ID_PREFIX + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
}

function isLocalId(id) {
  return typeof id === 'string' && id.startsWith(LOCAL_ID_PREFIX)
}

function genMsgId(role) {
  return 'msg-' + Date.now() + '-' + (role === 'user' ? 'u' : 'a') + '-' + Math.random().toString(36).slice(2, 5)
}

function deriveTitle(text) {
  if (!text) return '新对话'
  return text.length > 20 ? text.slice(0, 20) + '...' : text
}

// 将后端消息转成前端消息格式
function mapMessage(m) {
  return {
    id: 'msg-' + m.id,
    role: m.role,
    content: m.content,
    time: m.created_at
  }
}

export default {
  data() {
    return {
      sessionId: '',
      sessionIdSource: 'local', // 'local' | 'backend'
      messages: [],
      inputText: '',
      loading: false,
      scrollIntoViewId: '',
      scrollHeight: 0,
      suggestions: [
        '80平米两居室装修预算怎么分配比较合理？',
        '北欧风和日式风有什么区别？',
        '厨房装修有哪些容易踩坑的地方？',
        '新房甲醛如何有效去除？'
      ]
    }
  },
  onLoad(query = {}) {
    // 兼容旧版 aiChatHistory 数据
    this.migrateLegacy()
    const requestedId = query.sessionId

    if (requestedId && requestedId !== 'new') {
      this.openExistingSession(requestedId)
    } else {
      this.openNewSession()
    }
    this.calcScrollHeight()
  },
  onShow() {
    this.calcScrollHeight()
  },
  onUnload() {
    this.saveCurrentSession()
  },
  methods: {
    goBack() {
      this.saveCurrentSession()
      uni.navigateBack()
    },

    goHistory() {
      this.saveCurrentSession()
      uni.navigateTo({ url: '/pages/ai/chatHistory' })
    },

    calcScrollHeight() {
      try {
        const sys = uni.getSystemInfoSync()
        this.scrollHeight = sys.windowHeight - 300
      } catch (e) {
        this.scrollHeight = 500
      }
    },

    loadAllSessions() {
      try {
        const stored = uni.getStorageSync(SESSIONS_KEY)
        if (Array.isArray(stored)) return stored
      } catch (e) {}
      return []
    },

    persistSessions(sessions) {
      try {
        const sorted = sessions.slice().sort((a, b) =>
          new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        ).slice(0, MAX_SESSIONS)
        uni.setStorageSync(SESSIONS_KEY, sorted)
        return sorted
      } catch (e) {
        console.error('保存会话列表失败', e)
        return sessions
      }
    },

    // 将旧版单条历史迁移为多会话结构（只迁移一次）
    migrateLegacy() {
      try {
        const legacy = uni.getStorageSync(LEGACY_KEY)
        if (!Array.isArray(legacy) || legacy.length === 0) return

        const sessions = this.loadAllSessions()
        const alreadyMigrated = sessions.some(s => s.fromLegacy)
        if (alreadyMigrated) {
          uni.removeStorageSync(LEGACY_KEY)
          return
        }

        const firstUser = legacy.find(m => m.role === 'user')
        const title = firstUser
          ? deriveTitle(firstUser.content)
          : '历史对话'

        sessions.unshift({
          id: genLocalId(),
          title,
          messages: legacy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          fromLegacy: true
        })
        this.persistSessions(sessions)
        uni.removeStorageSync(LEGACY_KEY)
      } catch (e) {
        console.error('迁移旧数据失败', e)
      }
    },

    // 打开新会话：先尝试后端创建，失败则本地创建
    async openNewSession() {
      this.messages = []
      this.scrollIntoViewId = ''

      try {
        const res = await createChatSession('新对话')
        if (res && res.id) {
          this.sessionId = res.id
          this.sessionIdSource = 'backend'
          return
        }
      } catch (e) {
        console.warn('后端创建会话失败，降级为本地:', e)
      }
      // 降级到本地
      this.sessionId = genLocalId()
      this.sessionIdSource = 'local'
    },

    // 打开已有会话：先尝试后端，失败则本地
    async openExistingSession(sessionId) {
      // 数字 ID 优先走后端；本地 ID 走本地
      const numericId = Number(sessionId)
      if (!isLocalId(sessionId) && !Number.isNaN(numericId) && numericId > 0) {
        try {
          const detail = await getChatSessionDetail(numericId)
          if (detail) {
            this.sessionId = detail.id
            this.sessionIdSource = 'backend'
            this.messages = Array.isArray(detail.messages) ? detail.messages.map(mapMessage) : []
            this.$nextTick(() => this.scrollToBottom())
            return
          }
        } catch (e) {
          console.warn('后端加载会话失败，尝试本地:', e)
        }
      }

      // 本地兜底
      const sessions = this.loadAllSessions()
      const session = sessions.find(s => String(s.id) === String(sessionId))
      if (session) {
        this.sessionId = session.id
        this.sessionIdSource = 'local'
        this.messages = Array.isArray(session.messages) ? session.messages.slice() : []
        this.$nextTick(() => this.scrollToBottom())
      } else {
        this.openNewSession()
      }
    },

    saveCurrentSession() {
      if (!this.sessionId) return
      const sessions = this.loadAllSessions()
      const idx = sessions.findIndex(s => String(s.id) === String(this.sessionId))

      // 空会话：不写入存储
      if (this.messages.length === 0) {
        if (idx >= 0 && isLocalId(this.sessionId)) {
          sessions.splice(idx, 1)
          this.persistSessions(sessions)
        }
        return
      }

      // 计算标题
      let title = (idx >= 0 && sessions[idx].title) ? sessions[idx].title : '新对话'
      if (title === '新对话' || !title) {
        const firstUser = this.messages.find(m => m.role === 'user')
        if (firstUser) {
          title = deriveTitle(firstUser.content)
        }
      }

      const sessionData = {
        id: this.sessionId,
        title,
        messages: this.messages.slice(-MAX_MSG_PER_SESSION),
        createdAt: idx >= 0 ? sessions[idx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (idx >= 0) {
        sessions[idx] = sessionData
      } else {
        sessions.unshift(sessionData)
      }
      this.persistSessions(sessions)
    },

    newChat() {
      this.saveCurrentSession()
      uni.redirectTo({ url: '/pages/ai/chat?sessionId=new' })
    },

    confirmDeleteCurrent() {
      if (!this.sessionId) {
        uni.showToast({ title: '当前没有对话', icon: 'none' })
        return
      }
      uni.showModal({
        title: '删除对话',
        content: '确定要删除当前对话吗？',
        success: async (res) => {
          if (!res.confirm) return
          // 后端删除（仅当为后端会话时）
          if (this.sessionIdSource === 'backend') {
            try {
              await deleteChatSession(this.sessionId)
            } catch (e) {
              console.warn('后端删除会话失败:', e)
            }
          }
          // 本地同步删除
          const sessions = this.loadAllSessions().filter(s => String(s.id) !== String(this.sessionId))
          this.persistSessions(sessions)
          this.openNewSession()
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      })
    },

    onInput(e) {
      this.inputText = e.detail.value || ''
    },

    useSuggestion(text) {
      this.inputText = text
      this.sendMessage()
    },

    // 异步保存消息到后端，失败不阻塞 UI
    async persistMessageToBackend(role, content) {
      if (this.sessionIdSource !== 'backend') return
      try {
        await addChatMessage(this.sessionId, { role, content })
      } catch (e) {
        console.warn('保存消息到后端失败:', e)
      }
    },

    // 异步更新标题到后端
    async updateTitleToBackend(title) {
      if (this.sessionIdSource !== 'backend') return
      try {
        await updateChatSession(this.sessionId, { title })
      } catch (e) {
        console.warn('更新标题到后端失败:', e)
      }
    },

    async sendMessage() {
      const text = this.inputText.trim()
      if (!text || this.loading) return

      const userMsg = {
        id: genMsgId('user'),
        role: 'user',
        content: text,
        time: new Date().toISOString()
      }
      this.messages.push(userMsg)
      this.inputText = ''
      this.loading = true
      this.$nextTick(() => this.scrollToBottom(true))

      // 异步保存到后端
      this.persistMessageToBackend('user', text)

      // 首次用户消息后更新标题
      if (this.messages.filter(m => m.role === 'user').length === 1) {
        const newTitle = deriveTitle(text)
        this.updateTitleToBackend(newTitle)
      }

      try {
        const recent = this.messages.slice(-MAX_CONTEXT)
        const apiMessages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recent.map(m => ({ role: m.role, content: m.content }))
        ]

        const reply = await chatWithAI(apiMessages)
        const assistantMsg = {
          id: genMsgId('assistant'),
          role: 'assistant',
          content: reply,
          time: new Date().toISOString()
        }
        this.messages.push(assistantMsg)
        this.$nextTick(() => this.scrollToBottom(true))
        this.saveCurrentSession()
        this.persistMessageToBackend('assistant', reply)
      } catch (e) {
        console.error('AI 对话失败', e)
        const errMsg = {
          id: genMsgId('assistant'),
          role: 'assistant',
          content: '抱歉，回答失败，请稍后再试。',
          time: new Date().toISOString()
        }
        this.messages.push(errMsg)
        this.$nextTick(() => this.scrollToBottom(true))
        this.saveCurrentSession()
        this.persistMessageToBackend('assistant', errMsg.content)
      } finally {
        this.loading = false
      }
    },

    scrollToBottom(useAnchor = false) {
      if (useAnchor && this.loading) {
        this.scrollIntoViewId = 'loading-anchor'
        return
      }
      const last = this.messages[this.messages.length - 1]
      if (last) {
        this.scrollIntoViewId = last.id
      }
    },

    formatRelativeTime
  }
}
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  background: #F5F6FA;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.page-header {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #F3F4F6;
}

.back-btn {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 60rpx;
  color: #374151;
  font-weight: bold;
  line-height: 1;
}

.header-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #111827;
}

.subtitle {
  font-size: 22rpx;
  color: #9CA3AF;
  margin-top: 4rpx;
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 180rpx;
}

.header-action {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4rpx;
}

.action-icon {
  font-size: 36rpx;
  color: #374151;
  line-height: 1;
}

/* 消息列表 */
.message-scroll {
  flex: 1;
  background: #F5F6FA;
}

.message-list {
  padding: 24rpx 24rpx 40rpx;
}

.bottom-anchor {
  height: 20rpx;
}

/* 欢迎区 */
.welcome-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 20rpx 40rpx;
}

.welcome-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.welcome-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #1F2937;
  margin-bottom: 16rpx;
}

.welcome-desc {
  font-size: 26rpx;
  color: #6B7280;
  margin-bottom: 32rpx;
}

.suggestion-list {
  width: 100%;
}

.suggestion-item {
  background: #fff;
  padding: 24rpx 28rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.suggestion-text {
  font-size: 28rpx;
  color: #4B5563;
  line-height: 1.5;
}

/* 消息项 */
.message-item {
  display: flex;
  margin-bottom: 28rpx;
  align-items: flex-start;
}

.message-user {
  justify-content: flex-end;
}

.message-assistant {
  justify-content: flex-start;
}

/* 头像 */
.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-bot {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-right: 16rpx;
}

.avatar-user {
  background: #E5E7EB;
  margin-left: 16rpx;
}

.avatar-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.avatar-user .avatar-text {
  color: #4B5563;
  font-size: 28rpx;
}

/* 气泡 */
.bubble {
  max-width: 520rpx;
  padding: 24rpx 28rpx;
  border-radius: 20rpx;
  font-size: 30rpx;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.bubble-user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-top-right-radius: 6rpx;
}

.bubble-bot {
  background: #fff;
  color: #1F2937;
  border-top-left-radius: 6rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.bubble-content {
  font-size: 30rpx;
  line-height: 1.6;
}

/* 加载动画气泡 */
.bubble-loading {
  padding: 28rpx 32rpx;
}

.loading-dots {
  display: flex;
}

.loading-dots .dot {
  font-size: 48rpx;
  color: #667eea;
  line-height: 1;
  animation: blink 1.5s ease-in-out infinite;
}

.loading-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

/* 底部输入区 */
.input-bar {
  display: flex;
  align-items: flex-end;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #F3F4F6;
}

.textarea {
  flex: 1;
  min-height: 72rpx;
  max-height: 240rpx;
  padding: 20rpx 24rpx;
  background: #F3F4F6;
  border-radius: 16rpx;
  font-size: 30rpx;
  line-height: 1.5;
  box-sizing: border-box;
}

.send-btn {
  margin-left: 16rpx;
  margin-bottom: 0;
  width: 140rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;
  padding: 0;
}

.send-btn[disabled] {
  background: #D1D5DB;
  color: #9CA3AF;
}
</style>