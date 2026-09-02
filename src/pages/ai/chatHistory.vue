<template>
  <view class="chat-history-page">
    <!-- 顶部导航 -->
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="page-title">对话历史</view>
      <view class="header-right">
        <view class="header-action" @click="goNewChat">
          <text class="action-icon">✚</text>
        </view>
      </view>
    </view>

    <!-- 搜索框 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索对话标题或内容"
          confirm-type="search"
          @input="onKeywordInput"
        />
        <view v-if="keyword" class="search-clear" @click="clearKeyword">
          <text class="clear-icon">×</text>
        </view>
      </view>
    </view>

    <!-- 列表 -->
    <scroll-view
      class="list-scroll"
      scroll-y
      @scrolltolower="loadMore"
    >
      <view class="list-content">
        <view
          v-for="s in filteredSessions"
          :key="s.id"
          class="session-card"
          @click="openSession(s)"
        >
          <view class="card-icon">
            <text class="icon-text">💬</text>
          </view>
          <view class="card-main">
            <view class="card-title-row">
              <text class="card-title">{{ s.title || '新对话' }}</text>
              <text class="card-time">{{ formatRelativeTime(s.updatedAt) }}</text>
            </view>
            <text class="card-preview" v-if="s.lastMessage">{{ s.lastMessage }}</text>
            <view class="card-meta">
              <text class="meta-tag">{{ s.messageCount || 0 }} 条消息</text>
              <text v-if="s.source === 'local'" class="meta-tag tag-local">本地</text>
            </view>
          </view>
          <view class="card-delete" @click.stop="confirmDelete(s)">
            <text class="delete-icon">🗑</text>
          </view>
        </view>

        <view v-if="loading" class="loading-more">
          <text class="loading-text">加载中...</text>
        </view>
        <view v-if="!loading && noMore && filteredSessions.length > 0" class="no-more">
          <text class="no-more-text">没有更多了</text>
        </view>

        <EmptyState v-if="!loading && filteredSessions.length === 0" :text="keyword ? '没有匹配的对话' : '暂无对话记录'" />
      </view>
    </scroll-view>
  </view>
</template>

<script>
import EmptyState from '../../components/common/EmptyState.vue'
import {
  getChatSessions as fetchBackendSessions,
  getChatSessionDetail,
  deleteChatSession as deleteBackendSession
} from '../../api/chat'
import { formatRelativeTime } from '../../utils/format'

const LOCAL_SESSIONS_KEY = 'aiChatSessions'
const PAGE_SIZE = 20

export default {
  components: { EmptyState },
  data() {
    return {
      sessions: [],         // 所有会话（后端 + 本地未同步）
      backendTotal: 0,      // 后端总条数（用于分页）
      page: 1,
      pageSize: PAGE_SIZE,
      loading: false,
      noMore: false,
      keyword: ''
    }
  },
  computed: {
    filteredSessions() {
      const kw = this.keyword.trim().toLowerCase()
      if (!kw) return this.sessions
      return this.sessions.filter(s => {
        if ((s.title || '').toLowerCase().includes(kw)) return true
        if ((s.lastMessage || '').toLowerCase().includes(kw)) return true
        return false
      })
    }
  },
  onLoad() {
    this.refresh()
  },
  onShow() {
    // 从 chat 页面返回时刷新一次
    this.refresh()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },

    goNewChat() {
      uni.redirectTo({ url: '/pages/ai/chat?sessionId=new' })
    },

    onKeywordInput(e) {
      this.keyword = e.detail.value || ''
    },

    clearKeyword() {
      this.keyword = ''
    },

    async refresh() {
      this.page = 1
      this.noMore = false
      this.sessions = []
      await this.loadPage()
    },

    async loadMore() {
      if (this.noMore || this.loading || this.keyword) return
      this.page++
      await this.loadPage()
    },

    async loadPage() {
      if (this.loading) return
      this.loading = true
      try {
        // 后端分页加载
        const res = await fetchBackendSessions({ page: this.page, page_size: this.pageSize })
        const items = (res && res.items) || []
        const total = (res && res.total) || 0

        // 取每个会话的最后一条消息作为预览（按需懒加载）
        const list = items.map(it => ({
          id: it.id,
          title: it.title,
          messageCount: it.message_count,
          updatedAt: it.updated_at,
          lastMessage: '',
          source: 'backend'
        }))

        if (this.page === 1) {
          // 首次加载：合并本地未同步的会话
          const localOnly = this.loadLocalSessions().filter(s =>
            !list.some(b => String(b.id) === String(s.id))
          )
          this.sessions = [...list, ...localOnly].sort((a, b) =>
            new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
          )
          // 异步补全后端会话的最后一条消息预览
          this.fillLastMessages(list)
        } else {
          this.sessions = [...this.sessions, ...list]
          this.fillLastMessages(list)
        }

        this.backendTotal = total
        this.noMore = (this.page * this.pageSize) >= total
      } catch (e) {
        console.warn('加载对话历史失败:', e)
        // 降级本地
        if (this.page === 1) {
          this.sessions = this.loadLocalSessions()
          this.noMore = true
        }
      } finally {
        this.loading = false
      }
    },

    // 给后端会话补全最后一条消息预览
    async fillLastMessages(list) {
      for (const s of list) {
        try {
          const detail = await getChatSessionDetail(s.id)
          if (detail && Array.isArray(detail.messages) && detail.messages.length > 0) {
            const last = detail.messages[detail.messages.length - 1]
            s.lastMessage = (last.role === 'user' ? '我: ' : '') + (last.content || '')
            if (last.content && last.content.length > 60) {
              s.lastMessage = s.lastMessage.slice(0, 60) + '...'
            }
          }
        } catch (e) {
          // 静默失败：仅展示标题/消息数
        }
      }
    },

    loadLocalSessions() {
      try {
        const stored = uni.getStorageSync(LOCAL_SESSIONS_KEY)
        if (Array.isArray(stored)) {
          return stored.map(s => {
            const msgs = Array.isArray(s.messages) ? s.messages : []
            const last = msgs[msgs.length - 1]
            return {
              id: s.id,
              title: s.title,
              messageCount: msgs.length,
              updatedAt: s.updatedAt,
              lastMessage: last ? ((last.role === 'user' ? '我: ' : '') + (last.content || '')) : '',
              source: 'local'
            }
          })
        }
      } catch (e) {}
      return []
    },

    openSession(s) {
      uni.redirectTo({ url: `/pages/ai/chat?sessionId=${s.id}` })
    },

    confirmDelete(s) {
      uni.showModal({
        title: '删除对话',
        content: `确定要删除对话"${s.title || '新对话'}"吗？`,
        success: async (res) => {
          if (!res.confirm) return
          await this.deleteSession(s)
        }
      })
    },

    async deleteSession(s) {
      // 后端删除
      if (s.source === 'backend' || typeof s.id === 'number') {
        try {
          await deleteBackendSession(s.id)
        } catch (e) {
          console.warn('后端删除对话失败:', e)
        }
      }
      // 本地同步删除
      try {
        const local = uni.getStorageSync(LOCAL_SESSIONS_KEY)
        if (Array.isArray(local)) {
          const filtered = local.filter(x => String(x.id) !== String(s.id))
          uni.setStorageSync(LOCAL_SESSIONS_KEY, filtered)
        }
      } catch (e) {}
      this.sessions = this.sessions.filter(x => String(x.id) !== String(s.id))
      uni.showToast({ title: '已删除', icon: 'success' })
    },

    formatRelativeTime
  }
}
</script>

<style scoped>
.chat-history-page {
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

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #111827;
  flex: 1;
  text-align: center;
}

.header-right {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-action {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon {
  font-size: 38rpx;
  color: #374151;
  line-height: 1;
}

/* 搜索栏 */
.search-bar {
  padding: 20rpx 24rpx;
  background: #fff;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #F3F4F6;
  border-radius: 32rpx;
  padding: 0 20rpx;
}

.search-icon {
  font-size: 28rpx;
  color: #9CA3AF;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  background: transparent;
}

.search-clear {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #C9CDD4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-icon {
  font-size: 28rpx;
  color: #fff;
  line-height: 1;
}

/* 列表 */
.list-scroll {
  flex: 1;
  height: calc(100vh - 200rpx);
}

.list-content {
  padding: 20rpx 24rpx 40rpx;
}

.session-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.session-card:active {
  background: #f8f8f8;
}

.card-icon {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.icon-text {
  font-size: 40rpx;
}

.card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.card-title {
  font-size: 30rpx;
  color: #1F2937;
  font-weight: 500;
  flex: 1;
  margin-right: 16rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-time {
  font-size: 22rpx;
  color: #9CA3AF;
  flex-shrink: 0;
}

.card-preview {
  font-size: 26rpx;
  color: #6B7280;
  line-height: 1.5;
  margin-bottom: 10rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}

.card-meta {
  display: flex;
  gap: 12rpx;
}

.meta-tag {
  font-size: 22rpx;
  color: #6366F1;
  background: rgba(99, 102, 241, 0.1);
  padding: 4rpx 14rpx;
  border-radius: 9999rpx;
}

.meta-tag.tag-local {
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.1);
}

.card-delete {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.card-delete:active {
  background: #FEE2E2;
}

.delete-icon {
  font-size: 30rpx;
}

/* 加载状态 */
.loading-more,
.no-more {
  text-align: center;
  padding: 30rpx;
}

.loading-text,
.no-more-text {
  font-size: 26rpx;
  color: #9CA3AF;
}
</style>