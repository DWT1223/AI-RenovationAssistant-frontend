<template>
  <view class="reset-page">
    <!-- 步骤1：输入手机号 -->
    <view class="form-card" v-if="step === 1">
      <view class="form-title">忘记密码</view>
      <view class="form-desc">请输入您注册时绑定的手机号</view>

      <view class="input-group">
        <view class="input-label">手机号</view>
        <input
          class="input-field"
          v-model="formData.phone"
          type="number"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>

      <view class="input-group verify-code">
        <view class="input-label">验证码</view>
        <input
          class="input-field code-input"
          v-model="formData.verifyCode"
          type="number"
          placeholder="请输入验证码"
          maxlength="6"
        />
        <view
          class="send-btn"
          :class="{ disabled: counting }"
          @click="sendCode"
        >
          {{ counting ? `${countdown}s` : '发送验证码' }}
        </view>
      </view>

      <button class="submit-btn" :loading="loading" @click="handleNext">
        下一步
      </button>
    </view>

    <!-- 步骤2：设置新密码 -->
    <view class="form-card" v-if="step === 2">
      <view class="form-title">设置新密码</view>
      <view class="form-desc">请设置您的新密码</view>

      <view class="input-group">
        <view class="input-label">新密码</view>
        <input
          class="input-field"
          v-model="formData.password"
          type="password"
          placeholder="请输入新密码（6位以上）"
          maxlength="20"
        />
      </view>

      <view class="input-group">
        <view class="input-label">确认密码</view>
        <input
          class="input-field"
          v-model="formData.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          maxlength="20"
        />
      </view>

      <button class="submit-btn" :loading="loading" @click="handleReset">
        重置密码
      </button>
    </view>

    <view class="login-link" @click="goLogin">
      返回登录
    </view>
  </view>
</template>

<script>
import { resetPassword, sendSmsCode } from '../../api/auth'

export default {
  data() {
    return {
      step: 1,
      loading: false,
      counting: false,
      countdown: 60,
      timer: null,
      formData: {
        phone: '',
        verifyCode: '',
        password: '',
        confirmPassword: ''
      }
    }
  },
  onUnload() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    async sendCode() {
      if (this.counting) return

      if (!this.formData.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return
      }
      if (!/^1[3-9]\d{9}$/.test(this.formData.phone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }

      try {
        await sendSmsCode(this.formData.phone, 'reset')
        uni.showToast({ title: '验证码已发送', icon: 'success' })
        this.startCountdown()
      } catch (e) {
        console.error('发送验证码失败', e)
        uni.showToast({ title: e.message || '发送失败', icon: 'none' })
      }
    },
    startCountdown() {
      this.counting = true
      this.countdown = 60
      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(this.timer)
          this.counting = false
        }
      }, 1000)
    },
    async handleNext() {
      if (!this.formData.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return
      }
      if (!this.formData.verifyCode) {
        uni.showToast({ title: '请输入验证码', icon: 'none' })
        return
      }

      this.step = 2
    },
    async handleReset() {
      if (!this.formData.password) {
        uni.showToast({ title: '请输入新密码', icon: 'none' })
        return
      }
      if (this.formData.password.length < 6) {
        uni.showToast({ title: '密码至少6位', icon: 'none' })
        return
      }
      if (this.formData.password !== this.formData.confirmPassword) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' })
        return
      }

      this.loading = true
      try {
        await resetPassword({
          phone: this.formData.phone,
          code: this.formData.verifyCode,
          password: this.formData.password
        })
        uni.showToast({ title: '密码重置成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (e) {
        console.error('重置密码失败', e)
        uni.showToast({ title: e.message || '重置失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    goLogin() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.reset-page {

  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
}

.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 50rpx 40rpx;
}

.form-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #303133;
  text-align: center;
  margin-bottom: 20rpx;
}

.form-desc {
  font-size: 26rpx;
  color: #909399;
  text-align: center;
  margin-bottom: 50rpx;
}

.input-group {
  margin-bottom: 30rpx;
}

.input-label {
  font-size: 28rpx;
  color: #606266;
  margin-bottom: 16rpx;
}

.input-field {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 24rpx 30rpx;
  font-size: 30rpx;
}

.verify-code {
  display: flex;
  align-items: flex-end;
}

.verify-code .code-input {
  flex: 1;
  margin-right: 20rpx;
}

.send-btn {
  padding: 24rpx 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12rpx;
  font-size: 26rpx;
  white-space: nowrap;
}

.send-btn.disabled {
  background: #ccc;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 48rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-top: 40rpx;
  border: none;
}

.submit-btn::after {
  border: none;
}

.login-link {
  text-align: center;
  margin-top: 40rpx;
  font-size: 28rpx;
  color: #fff;
}
</style>
