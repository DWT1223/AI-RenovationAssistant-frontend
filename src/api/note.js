/**
 * 笔记相关API
 */
import request from './request'

/**
 * 获取笔记列表
 * @param {object} params - 查询参数
 */
export function getNotes(params) {
  return request.get('/api/notes', params)
}

/**
 * 获取笔记详情
 * @param {number} id - 笔记ID
 */
export function getNoteDetail(id) {
  return request.get(`/api/notes/${id}`)
}

/**
 * 创建笔记
 * @param {object} data - 笔记数据
 */
export function createNote(data) {
  return request.post('/api/notes', data)
}

/**
 * 更新笔记
 * @param {number} id - 笔记ID
 * @param {object} data - 笔记数据
 */
export function updateNote(id, data) {
  return request.put(`/api/notes/${id}`, data)
}

/**
 * 删除笔记
 * @param {number} id - 笔记ID
 */
export function deleteNote(id) {
  return request.delete(`/api/notes/${id}`)
}

/**
 * 点赞笔记
 * @param {number} id - 笔记ID
 */
export function likeNote(id) {
  return request.post(`/api/notes/${id}/like`)
}
