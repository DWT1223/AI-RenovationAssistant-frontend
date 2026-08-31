<template>
  <view class="notes-page">
    <!-- 标签栏 -->
    <StickyTab
      v-model="currentTab"
      :tabs="tabs"
      @click="onTabClick"
    />

    <!-- 笔记列表 -->
    <scroll-view scroll-y class="notes-list" @scrolltolower="loadMore">
      <view class="list-content">
        <NoteCard
          v-for="note in notes"
          :key="note.id"
          :note="note"
          :showActions="currentTab === 'my'"
          :is-owner="note.user_id === currentUserId"
          @note-click="goToDetail"
          @edit="goToEdit"
          @delete="handleDelete"
        />
        <EmptyState v-if="notes.length === 0 && !loading" text="暂无笔记" />
        <LoadingState v-if="loading" />
      </view>
    </scroll-view>

    <!-- 发布按钮 -->
    <view class="fab-wrapper" v-if="currentTab === 'my'">
      <view class="fab-btn" @click="goToPublish">
        <text class="fab-icon">+</text>
      </view>
    </view>
  </view>
</template>

<script>
import NoteCard from '../../components/note/NoteCard.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingState from '../../components/common/LoadingState.vue'
import StickyTab from '../../components/common/StickyTab.vue'
import { getNotes, deleteNote } from '../../api/note'
import { isLogin, getUserInfo } from '../../utils/auth'

export default {
  components: { NoteCard, EmptyState, LoadingState, StickyTab },
  data() {
    return {
      tabs: [
        { label: '推荐', value: 'all' },
        { label: '我的', value: 'my' }
      ],
      currentTab: 'all',
      notes: [],
      page: 1,
      pageSize: 20,
      hasMore: true,
      loading: false,
      currentUserId: null
    }
  },
  onLoad() {
    const userInfo = getUserInfo()
    this.currentUserId = userInfo?.id || null
    this.loadNotes()
  },
  onShow() {
    if (this.currentTab === 'my') {
      this.refreshNotes()
    }
  },
  methods: {
    async loadNotes() {
      if (this.loading) return
      this.loading = true

      try {
        const params = {
          page: this.page,
          page_size: this.currentTab === 'my' ? this.pageSize : 10,
          my_notes: this.currentTab === 'my'
        }
        if (this.currentTab === 'all') {
          params.sort = 'like_count'
        }
        const res = await getNotes(params)
        const items = res?.items || []

        if (this.page === 1) {
          this.notes = items
        } else {
          this.notes = [...this.notes, ...items]
        }

        this.hasMore = items.length >= this.pageSize
      } catch (e) {
        console.error('加载笔记失败', e)
      } finally {
        this.loading = false
      }
    },
    refreshNotes() {
      this.page = 1
      this.notes = []
      this.loadNotes()
    },
    loadMore() {
      if (!this.hasMore || this.loading) return
      this.page++
      this.loadNotes()
    },
    changeTab(tab) {
      this.page = 1
      this.notes = []
      this.hasMore = true
      this.loadNotes()
    },
    onTabChange(tab) {
      this.changeTab(tab)
    },
    onTabClick(tab) {
      this.changeTab(tab)
    },
    goToDetail(note) {
      uni.navigateTo({ url: `/pages/notes/detail?id=${note.id}` })
    },
    goToEdit(note) {
      uni.navigateTo({ url: `/pages/notes/edit?id=${note.id}` })
    },
    handleDelete(note) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这篇笔记吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteNote(note.id)
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.refreshNotes()
            } catch (e) {
              console.error('删除失败', e)
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    },
    goToPublish() {
      if (!isLogin()) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      uni.navigateTo({ url: '/pages/notes/publish' })
    }
  }
}
</script>

<style scoped>
.notes-page {
  background: #F5F6FA;

}

.notes-list {
  min-height: calc(100vh - 100rpx);
  padding-top: 20rpx;
}

.list-content {
    margin-top: 80rpx;
  padding: 48rpx 32rpx;
}

/* 悬浮按钮 */
.fab-wrapper {
  position: fixed;
  right: 48rpx;
  bottom: 180rpx;
  z-index: 99;
}

.fab-btn {
  width: 112rpx;
  height: 112rpx;
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 6rpx rgba(165, 180, 252, 0.5), 0 10rpx 15rpx rgba(165, 180, 252, 0.5);
}

.fab-icon {
  font-size: 56rpx;
  color: #fff;
  font-weight: 300;
}
</style>
