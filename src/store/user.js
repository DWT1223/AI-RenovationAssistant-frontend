/**
 * Pinia Store - 用户模块
 */
import { defineStore } from 'pinia'
import { getToken, setToken, clearToken, getUserInfo, setUserInfo, clearUserInfo } from '../utils/auth'
import { wechatLogin, accountLogin as accountLoginApi } from '../api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    userInfo: getUserInfo(),
    isLoading: false
  }),

  getters: {
    isLogin: (state) => !!state.token,
    nickname: (state) => state.userInfo?.nickname || '未登录',
    avatar: (state) => state.userInfo?.avatar || ''
  },

  actions: {
    // 设置Token
    setToken(token) {
      this.token = token
      setToken(token)
    },

    // 设置用户信息
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      setUserInfo(userInfo)
    },

    // 微信登录
    async login(code) {
      this.isLoading = true
      try {
        const result = await wechatLogin(code)
        this.setToken(result.token)
        this.setUserInfo(result.user)
        return result
      } catch (error) {
        this.logout()
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 账号密码登录
    async accountLogin(username, password) {
      this.isLoading = true
      try {
        const result = await accountLoginApi(username, password)
        this.setToken(result.token)
        this.setUserInfo(result.user)
        return result
      } catch (error) {
        this.logout()
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 退出登录
    logout() {
      this.token = null
      this.userInfo = null
      clearToken()
      clearUserInfo()
    },

    // 更新用户信息
    updateUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
      setUserInfo(this.userInfo)
    }
  }
})
