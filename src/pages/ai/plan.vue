<template>
  <view class="plan-page">
    <!-- 表单 -->
    <view class="form-card">
      <view class="form-item">
        <view class="form-label">户型格局</view>
        <picker :value="houseTypeIndex" :range="houseTypes" range-key="label" @change="onHouseTypeChange">
          <view class="picker-value">
            {{ houseTypes[houseTypeIndex]?.label || '请选择' }}
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">房屋面积</view>
        <view class="input-row">
          <input type="digit" v-model="formData.area" placeholder="请输入面积" class="input" />
          <text class="unit">平方米</text>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">装修风格</view>
        <picker :value="styleIndex" :range="styles" @change="onStyleChange">
          <view class="picker-value">
            {{ styles[styleIndex] || '请选择' }}
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">预算档位</view>
        <picker :value="budgetIndex" :range="budgetLevels" range-key="label" @change="onBudgetChange">
          <view class="picker-value">
            {{ budgetLevels[budgetIndex]?.label || '请选择' }}
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">常住人口</view>
        <view class="input-row">
          <input type="number" v-model="formData.population" placeholder="请输入人数" class="input" />
          <text class="unit">人</text>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">特殊需求</view>
        <textarea v-model="formData.specialNeeds" placeholder="如有特殊需求请描述，如：有老人同住、需要书房等" class="textarea" />
      </view>
    </view>

    <!-- 生成按钮 -->
    <view class="btn-wrapper">
      <button class="btn-generate" :disabled="loading" @click="handleGenerate">
        {{ loading ? '生成中...' : '生成装修方案' }}
      </button>
    </view>

    <!-- AI Loading 遮罩 -->
    <view class="loading-overlay" v-if="loading">
      <view class="loading-card">
        <view class="robot-container">
          <text class="robot-icon">🤖</text>
          <view class="robot-antenna"></view>
        </view>
        <view class="loading-text">
          <text class="main-text">AI 正在思考中</text>
          <view class="loading-dots">
            <text class="dot">.</text>
            <text class="dot">.</text>
            <text class="dot">.</text>
          </view>
        </view>
        <view class="loading-tips">
          <text class="tip-text">正在根据您的需求设计装修方案...</text>
        </view>
        <view class="progress-bar">
          <view class="progress-inner"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { generateDecorationPlan } from '../../utils/ai'
import { saveRenderRecord } from '../../api/ai'
import { HOUSE_TYPES, DECORATION_STYLES, BUDGET_LEVELS } from '../../utils/const'

export default {
  data() {
    return {
      houseTypes: HOUSE_TYPES,
      styles: DECORATION_STYLES,
      budgetLevels: BUDGET_LEVELS,
      houseTypeIndex: 0,
      styleIndex: 0,
      budgetIndex: 0,
      formData: {
        area: '',
        population: 2,
        specialNeeds: ''
      },
      loading: false
    }
  },
  methods: {
    onHouseTypeChange(e) {
      this.houseTypeIndex = e.detail.value
    },
    onStyleChange(e) {
      this.styleIndex = e.detail.value
    },
    onBudgetChange(e) {
      this.budgetIndex = e.detail.value
    },
    async handleGenerate() {
      if (!this.formData.area) {
        uni.showToast({ title: '请输入房屋面积', icon: 'none' })
        return
      }

      this.loading = true
      try {
        const data = {
          house_type: this.houseTypes[this.houseTypeIndex].value,
          area: this.formData.area,
          style: this.styles[this.styleIndex],
          budget: this.budgetLevels[this.budgetIndex].value,
          population: this.formData.population,
          special_needs: this.formData.specialNeeds
        }
        // 使用 MiniMax-M2.7-highspeed 模型生成装修方案
        const result = await generateDecorationPlan(data)

        // 保存到本地存储，避免URL参数过长
        uni.setStorageSync('aiPlanContent', result)
        uni.setStorageSync('aiPlanParams', JSON.stringify(data))
        uni.setStorageSync('aiPlanTime', new Date().toISOString())

        // 保存生成记录到后端
        try {
          await saveRenderRecord({
            record_type: 'plan',
            source_img: '',
            prompt: '',
            analysis_result: result,
            generated_img: '',
            style: data.style,
            room: data.house_type,
            area: data.area,
            budget: data.budget,
            population: String(data.population),
            requirement: data.special_needs
          })
        } catch (e) {
          console.error('保存记录失败:', e)
        }

        // 跳转到结果页面
        uni.navigateTo({
          url: '/pages/ai/planResult'
        })
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
.plan-page {

  background: #f8f8f8;
  padding: 20rpx;
  padding-bottom: 200rpx;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
}

.form-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 30rpx;
  color: #303133;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.arrow {
  color: #909399;
  font-size: 24rpx;
}

.input-row {
  display: flex;
  align-items: center;
}

.input {
  flex: 1;
  padding: 24rpx 30rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.unit {
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #606266;
}

.textarea {
  width: 100%;
  padding: 24rpx 30rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  min-height: 200rpx;
}

.btn-wrapper {
  padding: 0 30rpx;
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
  opacity: 0.7;
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

/* AI 头像 */
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

/* 文字 */
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

/* 进度条 */
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
