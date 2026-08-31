<template>
  <view class="register-page">
    <view class="form-card">
      <view class="form-title">注册账号</view>

      <view class="input-group">
        <view class="input-label">用户名</view>
        <input
          class="input-field"
          v-model="formData.username"
          placeholder="请输入用户名"
          maxlength="30"
        />
      </view>

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

      <view class="input-group">
        <view class="input-label">密码</view>
        <input
          class="input-field"
          v-model="formData.password"
          type="password"
          placeholder="请输入密码（6位以上）"
          maxlength="20"
        />
      </view>

      <view class="input-group">
        <view class="input-label">确认密码</view>
        <input
          class="input-field"
          v-model="formData.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          maxlength="20"
        />
      </view>

      <button class="submit-btn" :loading="loading" @click="handleRegister">
        注册
      </button>

      <view class="login-link" @click="goLogin">
        已有账号？立即登录
      </view>
    </view>
  </view>
</template>

<script>
import { register } from '../../api/auth'

export default {
  data() {
    return {
      loading: false,
      formData: {
        username: '',
        phone: '',
        password: '',
        confirmPassword: ''
      }
    }
  },
  methods: {
    async handleRegister() {
      // 表单验证
      if (!this.formData.username) {
        uni.showToast({ title: '请输入用户名', icon: 'none' })
        return
      }
      if (!this.formData.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return
      }
      if (!/^1[3-9]\d{9}$/.test(this.formData.phone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }
      if (!this.formData.password) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
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
        await register({
          username: this.formData.username,
          password: this.formData.password,
          phone: this.formData.phone
        })
        uni.showToast({ title: '注册成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (e) {
        console.error('注册失败', e)
        uni.showToast({ title: e.message || '注册失败', icon: 'none' })
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
.register-page {

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
  color: #2979ff;
}
</style>
