<template>
  <view class="app">
    <slot />
  </view>
</template>

<script>
import { useUserStore } from './store/user'

export default {
  onLaunch() {
    console.log('App Launch')
    // 检查登录状态
    const userStore = useUserStore()
    if (userStore.isLogin) {
      // 刷新用户信息
      this.refreshUserInfo()
    }
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
  methods: {
    async refreshUserInfo() {
      // TODO: 刷新用户信息
    }
  }
}
</script>

<style>
@import './uni.scss';
</style>
