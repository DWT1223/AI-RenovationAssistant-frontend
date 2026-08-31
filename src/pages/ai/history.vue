<template>
  <view class="history-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="page-title">AI生成记录</text>
      <view class="header-right"></view>
    </view>

    <!-- 切换标签 -->
    <view class="tab-bar">
      <view
        :class="['tab-item', { active: currentTab === 'render' }]"
        @click="switchTab('render')"
      >
        <text class="tab-text">效果图</text>
      </view>
      <view
        :class="['tab-item', { active: currentTab === 'plan' }]"
        @click="switchTab('plan')"
      >
        <text class="tab-text">装修方案</text>
      </view>
    </view>

    <!-- 记录列表 -->
    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore">
      <view class="list-content">
        <!-- 效果图列表 -->
        <view v-if="currentTab === 'render'" class="render-list">
          <view
            v-for="item in records"
            :key="item.id"
            class="record-card"
          >
            <view class="card-main" @click="viewDetail(item)">
              <view class="card-images">
                <image
                  v-if="item.source_img"
                  :src="item.source_img"
                  class="card-image small"
                  mode="aspectFill"
                ></image>
                <view class="arrow-icon">→</view>
                <image
                  v-if="item.generated_img"
                  :src="item.generated_img"
                  class="card-image small"
                  mode="aspectFill"
                ></image>
                <view v-else class="card-image small placeholder">
                  <text class="placeholder-text">待生成</text>
                </view>
              </view>
              <view class="card-info">
                <view class="info-tags">
                  <text class="tag" v-if="getParams(item.params).style">{{ getParams(item.params).style }}</text>
                  <text class="tag" v-if="getParams(item.params).room">{{ getParams(item.params).room }}</text>
                </view>
                <text class="card-time">{{ formatTime(item.created_at) }}</text>
              </view>
            </view>
            <view class="card-actions">
              <view class="delete-btn" @click="confirmDelete(item)">
                <text class="delete-icon">🗑️</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 方案列表 -->
        <view v-else class="plan-list">
          <view
            v-for="item in records"
            :key="item.id"
            class="record-card"
          >
            <view class="card-main" @click="viewPlanDetail(item)">
              <view class="card-content">
                <text class="plan-title">{{ getPlanTitle(item.params) }}</text>
                <text class="plan-preview">{{ getPlanPreview(item.result) }}</text>
              </view>
              <view class="card-info">
                <view class="info-tags">
                  <text class="tag" v-if="getParams(item.params).style">{{ getParams(item.params).style }}</text>
                </view>
                <text class="card-time">{{ formatTime(item.created_at) }}</text>
              </view>
            </view>
            <view class="card-actions">
              <view class="delete-btn" @click="confirmDelete(item)">
                <text class="delete-icon">🗑️</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载状态 -->
        <view class="loading-more" v-if="loading">
          <text class="loading-text">加载中...</text>
        </view>
        <view class="no-more" v-if="!loading && noMore">
          <text class="no-more-text">没有更多了</text>
        </view>

        <!-- 空状态 -->
        <EmptyState v-if="!loading && records.length === 0" text="暂无生成记录" />
      </view>
    </scroll-view>
  </view>
</template>

<script>
import EmptyState from '../../components/common/EmptyState.vue'
import { getRenderRecords, getAIRecords, deleteAIRecord } from '../../api/ai'

export default {
  components: { EmptyState },
  data() {
    return {
      currentTab: 'render',
      records: [],
      page: 1,
      pageSize: 20,
      loading: false,
      noMore: false
    }
  },
  onLoad() {
    this.loadRecords()
  },
  onShow() {
    if (this.records.length > 0) {
      this.refreshRecords()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    switchTab(tab) {
      if (this.currentTab === tab) return
      this.currentTab = tab
      this.page = 1
      this.records = []
      this.noMore = false
      this.loadRecords()
    },
    async loadRecords() {
      if (this.loading) return
      this.loading = true

      try {
        const params = {
          page: this.page,
          page_size: this.pageSize
        }

        let res
        if (this.currentTab === 'render') {
          res = await getRenderRecords(params)
        } else {
          res = await getAIRecords({ ...params, record_type: 'plan' })
        }

        const items = res?.items || []
        if (this.page === 1) {
          this.records = items
        } else {
          this.records = [...this.records, ...items]
        }

        this.noMore = items.length < this.pageSize
      } catch (e) {
        console.error('加载记录失败', e)
      } finally {
        this.loading = false
      }
    },
    loadMore() {
      if (this.noMore || this.loading) return
      this.page++
      this.loadRecords()
    },
    refreshRecords() {
      this.page = 1
      this.noMore = false
      this.loadRecords()
    },
    viewDetail(item) {
      // 通过 ID 跳转到详情页
      uni.navigateTo({ url: `/pages/ai/imageAnalysisResult?id=${item.id}` })
    },
    viewPlanDetail(item) {
      // 保存数据并跳转到方案详情页
      // 装修方案内容保存在 analysis_result 字段
      uni.setStorageSync('aiPlanContent', item.analysis_result || '')
      uni.setStorageSync('aiPlanParams', item.params || '{}')
      uni.setStorageSync('aiPlanTime', item.created_at)
      uni.navigateTo({ url: '/pages/ai/planResult' })
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (days === 0) {
        return '今天 ' + date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
      } else if (days === 1) {
        return '昨天'
      } else if (days < 7) {
        return days + '天前'
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`
      }
    },
    getPlanTitle(params) {
      if (!params) return '装修方案'
      try {
        const p = JSON.parse(params)
        return `${p.style || ''}风格${p.house_type || ''}装修方案`
      } catch (e) {
        return '装修方案'
      }
    },
    getPlanPreview(result) {
      if (!result) return '暂无内容'
      // 截取前50个字符
      const text = result.replace(/[#*]/g, '').trim()
      return text.length > 50 ? text.substring(0, 50) + '...' : text
    },
    getParams(params) {
      if (!params) return {}
      try {
        return JSON.parse(params)
      } catch (e) {
        return {}
      }
    },
    confirmDelete(item) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        success: async (res) => {
          if (res.confirm) {
            await this.deleteRecord(item)
          }
        }
      })
    },
    async deleteRecord(item) {
      try {
        await deleteAIRecord(item.id)
        // 从列表中移除
        const index = this.records.findIndex(r => r.id === item.id)
        if (index > -1) {
          this.records.splice(index, 1)
        }
        uni.showToast({ title: '删除成功', icon: 'success' })
      } catch (e) {
        console.error('删除记录失败', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.history-page {
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
  background: #fff;
  border-bottom: 1rpx solid #F3F4F6;
}

.back-btn { width: 60rpx; }

.back-icon {
  font-size: 60rpx;
  color: #374151;
  font-weight: bold;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #111827;
  flex: 1;
  text-align: center;
}

.header-right { width: 100rpx; }

/* 切换标签 */
.tab-bar {
  display: flex;
  background: #fff;
  padding: 0 48rpx;
  border-bottom: 1rpx solid #F3F4F6;
}

.tab-item {
  flex: 1;
  padding: 24rpx 0;
  text-align: center;
  position: relative;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 6rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3rpx;
}

.tab-text {
  font-size: 30rpx;
  color: #9CA3AF;
}

.tab-item.active .tab-text {
  color: #6366F1;
  font-weight: bold;
}

/* 列表 */
.list-scroll {
  flex: 1;
  height: calc(100vh - 140rpx);
}

.list-content {
  padding: 24rpx;
}

/* 记录卡片 */
.record-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: stretch;
}

.card-main {
  flex: 1;
}

.card-images {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.card-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: #f8f8f8;
}

.card-image.small {
  width: 200rpx;
  height: 200rpx;
}

.card-image.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.placeholder-text {
  font-size: 24rpx;
  color: #9CA3AF;
}

.arrow-icon {
  font-size: 32rpx;
  color: #9CA3AF;
}

.card-content {
  margin-bottom: 16rpx;
}

.plan-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #1F2937;
  display: block;
  margin-bottom: 8rpx;
}

.plan-preview {
  font-size: 26rpx;
  color: #6B7280;
  line-height: 1.6;
}

.card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-tags {
  display: flex;
  gap: 12rpx;
}

.tag {
  font-size: 22rpx;
  color: #6366F1;
  background: rgba(99, 102, 241, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 9999rpx;
}

.card-time {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 卡片操作区 */
.card-actions {
  display: flex;
  align-items: center;
  padding-left: 16rpx;
}

.delete-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FEE2E2;
  border-radius: 12rpx;
}

.delete-icon {
  font-size: 28rpx;
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
