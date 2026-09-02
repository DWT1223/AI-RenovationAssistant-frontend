/**
 * AI 问答对话 API
 * - 用于与后端 /api/chat/* 接口交互
 * - 失败时调用方应能降级到本地存储
 */
import request from './request'

/**
 * 创建新会话
 * @param {string} [title] - 会话标题，默认"新对话"
 * @returns {Promise<{id, user_id, title, message_count, created_at, updated_at}>}
 */
export function createChatSession(title) {
  return request.post('/api/chat/sessions', { title: title || '新对话' })
}

/**
 * 获取当前用户的所有会话（按 updated_at 倒序）
 * @param {{page?: number, page_size?: number}} [params]
 * @returns {Promise<{items, total, page, page_size, pages}>}
 */
export function getChatSessions(params = {}) {
  return request.get('/api/chat/sessions', { page: 1, page_size: 50, ...params })
}

/**
 * 获取会话详情（含所有消息）
 * @param {number|string} sessionId
 * @returns {Promise<{id, user_id, title, message_count, created_at, updated_at, messages: Array}>}
 */
export function getChatSessionDetail(sessionId) {
  return request.get(`/api/chat/sessions/${sessionId}`)
}

/**
 * 更新会话（目前仅支持修改标题）
 * @param {number|string} sessionId
 * @param {{title?: string}} data
 */
export function updateChatSession(sessionId, data) {
  return request.put(`/api/chat/sessions/${sessionId}`, data)
}

/**
 * 删除会话（级联删除消息）
 * @param {number|string} sessionId
 */
export function deleteChatSession(sessionId) {
  return request.delete(`/api/chat/sessions/${sessionId}`)
}

/**
 * 向会话添加一条消息
 * @param {number|string} sessionId
 * @param {{role: 'user'|'assistant', content: string}} message
 */
export function addChatMessage(sessionId, message) {
  return request.post(`/api/chat/sessions/${sessionId}/messages`, message)
}
