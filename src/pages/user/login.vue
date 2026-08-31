<template>
  <view class="login-page">
    <view class="login-header">
      <view class="logo">🏠</view>
      <text class="title">装修AI助手</text>
      <text class="subtitle">让装修更简单</text>
    </view>

    <view class="login-content">
      <!-- 登录方式切换 -->
      <view class="login-tabs">
        <view
          class="tab-item"
          :class="{ active: loginType === 'wechat' }"
          @click="loginType = 'wechat'"
        >
          微信登录
        </view>
        <view
          class="tab-item"
          :class="{ active: loginType === 'account' }"
          @click="loginType = 'account'"
        >
          账号登录
        </view>
      </view>

      <!-- 微信登录 -->
      <view v-if="loginType === 'wechat'" class="wechat-login">
        <button
          class="login-btn"
          type="primary"
          :loading="loading"
          :disabled="loading"
          @click="handleWechatLogin"
        >
          <text class="btn-icon">📱</text>
          <text>微信一键登录</text>
        </button>
      </view>

      <!-- 账号密码登录 -->
      <view v-if="loginType === 'account'" class="account-login">
        <view class="input-group">
          <view class="input-label">用户名/手机号</view>
          <input
            class="input-field"
            v-model="accountForm.username"
            placeholder="请输入用户名或手机号"
            maxlength="50"
          />
        </view>
        <view class="input-group">
          <view class="input-label">密码</view>
          <input
            class="input-field"
            v-model="accountForm.password"
            type="password"
            placeholder="请输入密码"
            maxlength="50"
          />
        </view>
        <view class="extra-actions">
          <text class="link" @click="goRegister">注册账号</text>
          <text class="link" @click="goResetPwd">忘记密码</text>
        </view>
        <button
          class="login-btn"
          type="primary"
          :loading="loading"
          @click.stop="handleAccountLogin"
        >
          <text>登录</text>
        </button>
      </view>

      <!-- 协议 -->
      <view class="agreement" v-if="loginType === 'wechat'">
        <checkbox-group @change="onAgreementChange">
          <label class="agreement-label">
            <checkbox :checked="agreed" color="#2979ff" style="transform:scale(0.8)" />
            <text class="agreement-text">
              我已阅读并同意
              <text class="link" @click.stop="showAgreement('user')">《用户协议》</text>
              和
              <text class="link" @click.stop="showAgreement('privacy')">《隐私政策》</text>
            </text>
          </label>
        </checkbox-group>
      </view>
    </view>

    <view class="login-footer">
      <text class="tips">未注册用户登录后将自动创建账号</text>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '../../store/user'
import { accountLogin } from '../../api/auth'

export default {
  data() {
    return {
      loginType: 'wechat',
      loading: false,
      agreed: false,
      accountForm: {
        username: '',
        password: ''
      }
    }
  },
  methods: {
    onAgreementChange(e) {
      this.agreed = e.detail.value.length > 0
    },

    // 微信登录
    async handleWechatLogin() {
      if (!this.agreed) {
        uni.showToast({
          title: '请先阅读并同意用户协议',
          icon: 'none'
        })
        return
      }

      this.loading = true

      try {
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: (res) => {
              console.log('微信登录成功', res)
              resolve(res)
            },
            fail: (err) => {
              console.error('微信登录失败', err)
              reject(err)
            }
          })
        })

        if (!loginRes.code) {
          throw new Error('获取登录凭证失败')
        }

        const userStore = useUserStore()
        await userStore.login(loginRes.code)

        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })

        setTimeout(() => {
          const pages = getCurrentPages()
          if (pages.length > 1) {
            uni.navigateBack()
          } else {
            uni.switchTab({
              url: '/pages/index/index'
            })
          }
        }, 1500)

      } catch (error) {
        console.error('登录失败', error)

        if (error.message?.includes(' provider ') ||
            error.message?.includes('not exist') ||
            error.message?.includes('找不到')) {
          this.mockLogin()
        } else {
          uni.showToast({
            title: error.message || '登录失败',
            icon: 'none'
          })
        }
      } finally {
        this.loading = false
      }
    },

    // 账号密码登录
    async handleAccountLogin() {
      if (!this.accountForm.username || !this.accountForm.password) {
        uni.showToast({
          title: '请输入用户名和密码',
          icon: 'none'
        })
        return
      }

      this.loading = true

      try {
        const userStore = useUserStore()
        await userStore.accountLogin(this.accountForm.username, this.accountForm.password)

        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })

        setTimeout(() => {
          // 尝试返回上一页，如果失败则跳转到首页
          const pages = getCurrentPages()
          if (pages.length > 1) {
            uni.navigateBack()
          } else {
            uni.switchTab({
              url: '/pages/index/index'
            })
          }
        }, 1500)

      } catch (error) {
        console.error('登录失败', error)
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 模拟登录（开发环境）
    async mockLogin() {
      uni.showToast({
        title: '开发模式：模拟登录成功',
        icon: 'none'
      })

      const userStore = useUserStore()
      userStore.setToken('mock_token_' + Date.now())
      userStore.setUserInfo({
        id: 1,
        nickname: '测试用户',
        avatar: ''
      })

      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          uni.navigateBack()
        } else {
          uni.switchTab({
            url: '/pages/index/index'
          })
        }
      }, 1500)
    },

    goRegister() {
      uni.navigateTo({
        url: '/pages/user/register'
      })
    },

    goResetPwd() {
      uni.navigateTo({
        url: '/pages/user/reset'
      })
    },

    showAgreement(type) {
      uni.showModal({
        title: type === 'user' ? '用户协议' : '隐私政策',
        content: type === 'user'
          ? '这里是用户协议内容...'
          : '这里是隐私政策内容...',
        showCancel: false
      })
    }
  }
}
</script>

<style scoped>
.login-page {

  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 100rpx 60rpx 60rpx;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
  margin-bottom: 30rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.login-content {
  flex: 1;
}

.login-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 40rpx;
  padding: 6rpx;
  margin-bottom: 60rpx;
}

.tab-item {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 28rpx;
  border-radius: 36rpx;
}

.tab-item.active {
  background: #fff;
  color: #667eea;
  font-weight: 500;
}

.wechat-login {
  margin-bottom: 40rpx;
}

.login-btn {
  background: #fff;
  color: #333;
  border-radius: 48rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.login-btn::after {
  border: none;
}

.btn-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.account-login {
  margin-bottom: 40rpx;
}

.input-group {
  margin-bottom: 30rpx;
}

.input-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 16rpx;
}

.input-field {
  background: rgba(255, 255, 255, 0.15);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  font-size: 30rpx;
  color: #fff;
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.extra-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.link {
  color: rgba(255, 255, 255, 0.9);
  font-size: 26rpx;
  text-decoration: underline;
}

.agreement {
  padding: 0 20rpx;
}

.agreement-label {
  display: flex;
  align-items: flex-start;
}

.agreement-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.login-footer {
  text-align: center;
  padding-top: 60rpx;
}

.tips {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>
