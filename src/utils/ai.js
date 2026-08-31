/**
 * MiniMax AI 服务
 * API文档: https://minnimax.chat/guide
 */

import { getToken } from './auth'

// MiniMax API 配置
const MINIMAX_CONFIG = {
  apiKey: '',
  baseURL: '/minimax', // 使用代理避免跨域
  textModel: 'MiniMax-M2.7-highspeed', // 文本生成模型
  imageModel: 'MiniMax-H3' // 图片生成模型
}

// 火山引擎 API 配置（备用）
const VOLCANO_CONFIG = {
  apiKey: '',
  baseURL: '/volcano',
  endpoint: '/api/v3/chat/completions',
  imageEndpoint: '/api/v3/images/generations'
}

// Agnes AI API 配置（图片生成）
const AGNES_CONFIG = {
  apiKey: '',
  baseURL: '/agnes',
  endpoint: '/v1/chat/completions',
  imageEndpoint: '/v1/images/generations'
}

// MiniMax 特有的端点
const ENDPOINTS = {
  chat: '/v1/chat/completions',           // 文本对话 (OpenAI兼容)
  image: '/v1/images/generations'         // 图片生成 (OpenAI兼容)
}

// 装修方案生成的系统提示词
const SYSTEM_PROMPT = `你是一位专业的室内装修设计师，拥有10年以上的装修设计经验。请根据用户提供的装修需求，生成一份详细、专业、可执行的装修方案。

方案应包含以下部分：
1. 整体设计理念
2. 各空间设计方案（客厅、卧室、厨房、卫生间等）
3. 色彩搭配建议
4. 材料选择建议
5. 预算分配建议
6. 施工注意事项

请用专业且易懂的语言描述，语言简洁有条理，方便用户理解和执行。`

/**
 * 调用 MiniMax AI 生成文本
 * @param {string} prompt - 用户提示词
 * @param {object} options - 可选配置
 * @param {boolean} options.useSystemPrompt - 是否使用系统提示词（默认true，M2.7-highspeed不支持）
 * @returns {Promise<string>} 生成的文本
 */
export async function generateText(prompt, options = {}) {
  const useSystemPrompt = options.useSystemPrompt !== false

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${MINIMAX_CONFIG.baseURL}${ENDPOINTS.chat}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_CONFIG.apiKey}`
      },
      data: {
        model: MINIMAX_CONFIG.textModel,
        messages: useSystemPrompt
          ? [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ]
          : [
              { role: 'user', content: `${SYSTEM_PROMPT}\n\n${prompt}` }
            ],
        max_tokens: 2000,
        temperature: 0.7
      },
      timeout: 60000,
      success: (res) => {
        console.log('MiniMax API 响应:', JSON.stringify(res.data))

        if (res.statusCode !== 200) {
          reject(new Error(`请求失败: ${res.statusCode}`))
          return
        }

        const data = res.data
        // 检查业务错误码
        if (data.base_resp && data.base_resp.status_code !== 0) {
          reject(new Error(data.base_resp.status_msg || 'API调用失败'))
          return
        }

        // MiniMax 返回格式
        if (data.choices && data.choices[0]) {
          let content = data.choices[0].message?.content || ''
          // 移除思考标签内容
          content = content.replace(/<think>[\s\S]*?<\/think>/gi, '')
          content = content.trim()
          if (content) {
            resolve(content)
            return
          }
        }

        reject(new Error('生成失败，未获取到有效响应'))
      },
      fail: (err) => {
        console.error('MiniMax API 调用失败:', err)
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 生成装修方案
 * @param {object} params - 装修参数
 * @returns {Promise<string>} 生成的装修方案
 */
export async function generateDecorationPlan(params) {
  const {
    house_type,
    area,
    style,
    budget,
    population,
    special_needs
  } = params

  const prompt = `请为以下装修需求生成详细的装修方案：

【基本信息】
- 户型：${house_type}
- 面积：${area}平方米
- 装修风格：${style}
- 预算：${budget}
- 常住人口：${population}人

${special_needs ? `- 特殊需求：${special_needs}` : ''}

请给出具体的装修建议和方案。`

  // MiniMax-M2.7-highspeed 不支持 system 角色消息，将系统提示词合并到 user 消息中
  return generateText(prompt, { useSystemPrompt: false })
}

/**
 * 生成装修效果图提示词
 * @param {object} params - 参数
 * @returns {string} 提示词
 */
export function generateImagePrompt(params) {
  const {
    room_type,
    style,
    area,
    features
  } = params

  // 风格对应的英文提示词
  const stylePrompts = {
    '现代简约': 'modern minimalist interior design, clean lines, simple and elegant',
    '奶油风': 'cream color palette, soft warm tones, cozy interior, French countryside style',
    '轻奢': 'luxury modern interior, elegant, sophisticated, gold accents',
    '原木风': 'natural wood elements, Japanese Scandinavian style, warm and cozy',
    '北欧风': 'Nordic Scandinavian interior, bright and airy, white tones',
    '日式': 'Japanese minimalist interior, wabi-sabi aesthetic, tatami vibes',
    '美式': 'American modern interior, comfortable and spacious, classic touches',
    '极简': 'ultra minimalist interior, monochromatic, maximum simplicity',
    '新中式': 'modern Chinese interior, traditional elements, elegant oriental style',
    'ins风': 'Instagram aesthetic interior, trendy, photo-worthy, stylish decor'
  }

  const basePrompt = stylePrompts[style] || 'beautiful interior design'

  let prompt = `${room_type} interior rendering, ${basePrompt} style, photorealistic, 8K quality, professional interior photography, natural lighting, high-end finish`

  if (area) {
    prompt += `, approximately ${area} square meters`
  }

  if (features) {
    prompt += `, ${features}`
  }

  return prompt
}

/**
 * 将图片转换为 base64
 * @param {string|File} filePath - 本地文件路径（微信小程序）或 File 对象/URL（H5）
 * @returns {Promise<string>} base64 数据URL
 */
export function getImageBase64(filePath) {
  return new Promise((resolve, reject) => {
    console.log('getImageBase64 开始转换，filePath:', filePath, '类型:', typeof filePath)

    // H5 环境：filePath 是 File 对象
    if (typeof filePath === 'object' && filePath.type) {
      console.log('H5 环境，使用 FileReader 处理 File 对象')
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('FileReader 成功，数据长度:', e.target.result.length)
        resolve(e.target.result)
      }
      reader.onerror = (err) => {
        console.error('FileReader 失败:', err)
        reject(new Error('FileReader 读取失败'))
      }
      reader.readAsDataURL(filePath)
      return
    }

    // 小程序环境
    if (typeof uni !== 'undefined' && uni.getFileSystemManager) {
      console.log('小程序环境，使用 getFileSystemManager')
      const fs = uni.getFileSystemManager()
      fs.readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => {
          console.log('readFile 成功，数据长度:', res.data ? res.data.length : 0)
          let mimeType = 'image/png'
          if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
            mimeType = 'image/jpeg'
          } else if (filePath.toLowerCase().endsWith('.gif')) {
            mimeType = 'image/gif'
          } else if (filePath.toLowerCase().endsWith('.webp')) {
            mimeType = 'image/webp'
          }
          resolve(`data:${mimeType};base64,${res.data}`)
        },
        fail: (err) => {
          console.error('readFile 失败:', JSON.stringify(err))
          reject(new Error('读取图片失败: ' + JSON.stringify(err)))
        }
      })
      return
    }

    // H5 环境：filePath 是 URL（http://, https://, blob://）
    if (typeof filePath === 'string') {
      console.log('H5 环境，通过 fetch 获取图片:', filePath)

      // 如果是 data URL，直接返回
      if (filePath.startsWith('data:')) {
        console.log('已经是 data URL，直接返回')
        resolve(filePath)
        return
      }

      // 如果是 blob URL，需要特殊处理
      if (filePath.startsWith('blob:')) {
        console.log('blob URL，转换为 fetch')
        fetch(filePath)
          .then(res => {
            if (!res.ok) throw new Error('fetch 失败')
            return res.blob()
          })
          .then(blob => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = (e) => resolve(e.target.result)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })
          })
          .then(base64 => {
            console.log('blob + FileReader 成功，数据长度:', base64.length)
            resolve(base64)
          })
          .catch(err => {
            console.error('blob URL 处理失败:', err)
            reject(new Error('blob URL 处理失败: ' + err.message))
          })
        return
      }

      // 其他 URL（http/https）
      console.log('HTTP/HTTPS URL，通过 fetch 获取')
      fetch(filePath)
        .then(res => {
          if (!res.ok) throw new Error('fetch 失败')
          return res.blob()
        })
        .then(blob => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        })
        .then(base64 => {
          console.log('fetch + FileReader 成功，数据长度:', base64.length)
          resolve(base64)
        })
        .catch(err => {
          console.error('H5 环境获取图片失败:', err)
          reject(new Error('H5 环境获取图片失败: ' + err.message))
        })
      return
    }

    // 无法处理
    reject(new Error('无法处理的文件路径类型: ' + typeof filePath))
  })
}

/**
 * 分析户型图并生成效果图提示词
 * @param {object} params - 参数
 * @returns {Promise<{analysis: string, prompt: string}>}
 */
export async function analyzeFloorPlan(params) {
  const { imageUrl, style, room, requirement, localFilePath } = params

  // 风格对应的英文描述
  const styleDescriptions = {
    '现代简约': 'modern minimalist, clean lines, simple and elegant, contemporary',
    '奶油风': 'cream color palette, soft warm tones, cozy and warm, French countryside',
    '轻奢': 'luxury modern, elegant and sophisticated, subtle gold accents',
    '原木风': 'natural wood elements, warm and cozy, Japanese Scandinavian style',
    '北欧风': 'Nordic Scandinavian, bright and airy, lots of natural light',
    '日式': 'Japanese minimalist, wabi-sabi aesthetic, zen atmosphere',
    '美式': 'American modern, comfortable and spacious, classic touches',
    '极简': 'ultra minimalist, monochromatic, maximum simplicity',
    '新中式': 'modern Chinese, traditional elements fusion, elegant oriental',
    'ins风': 'Instagram aesthetic, trendy, stylish, photo-worthy decor'
  }

  const styleDesc = styleDescriptions[style] || 'beautiful modern design'

  // 构建消息内容
  let requirementText = ''
  if (requirement && requirement.trim()) {
    requirementText = `\n【用户补充需求】\n${requirement.trim()}`
  }

  let content = [
    {
      type: 'text',
      text: `你是一位专业的室内设计师。请分析这张户型图，并结合以下要求生成效果图：

【用户选择】
- 目标房间：${room}
- 装修风格：${style}${requirementText}

【分析要求】
请详细分析这张户型图，输出以下内容：
1. 户型结构分析（几室几厅几卫、各空间布局）
2. 各空间特点（采光、通风、动线）
3. 装修建议（配色、布局优化）${requirementText ? '\n4. 针对用户需求的特别建议' : ''}
5. 一个详细的英文效果图生成提示词（用于AI生图）

【输出格式】
请用中文输出分析内容，最后一条提示词用英文输出，格式为：
【生图提示词】
[详细的英文提示词]

提示词要求：
- 包含房间类型、风格描述
- 结合用户的需求特点
- 强调真实感、高品质渲染
- 适合AI图片生成`
    }
  ]

  // 如果有本地文件路径，转换为 base64
  let imageSent = false
  if (localFilePath) {
    try {
      const base64Data = await getImageBase64(localFilePath)
      console.log('本地图片转换为base64成功，长度:', base64Data.length)
      content.push({
        type: 'image_url',
        image_url: {
          url: base64Data
        }
      })
      imageSent = true
    } catch (e) {
      console.error('转换base64失败，使用URL:', e)
      // 如果转换失败，尝试使用URL
      if (imageUrl && !imageUrl.includes('localhost')) {
        console.log('使用imageUrl作为备选:', imageUrl)
        content.push({
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        })
        imageSent = true
      }
    }
  } else if (imageUrl && !imageUrl.includes('localhost')) {
    // 如果是公开URL，直接使用
    console.log('没有localFilePath，使用imageUrl:', imageUrl)
    content.push({
      type: 'image_url',
      image_url: {
        url: imageUrl
      }
    })
    imageSent = true
  }

  if (!imageSent) {
    console.warn('警告：没有图片传递给MiniMax-M3，localFilePath:', localFilePath, 'imageUrl:', imageUrl)
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${MINIMAX_CONFIG.baseURL}${ENDPOINTS.chat}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_CONFIG.apiKey}`
      },
      data: {
        model: 'MiniMax-M3',
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      },
      timeout: 60000,
      success: (res) => {
        console.log('户型分析响应:', JSON.stringify(res.data))

        if (res.statusCode !== 200) {
          reject(new Error(`请求失败: ${res.statusCode}`))
          return
        }

        const data = res.data
        if (data.base_resp && data.base_resp.status_code !== 0) {
          reject(new Error(data.base_resp.status_msg || '分析失败'))
          return
        }

        if (data.choices && data.choices[0]) {
          let content = data.choices[0].message?.content || ''
          // 移除思考标签内容
          content = content.replace(/<think>[\s\S]*?<\/think>/gi, '')
          content = content.trim()

          if (!content) {
            reject(new Error('分析结果为空'))
            return
          }

          // 提取生图提示词
          let prompt = ''
          const promptMatch = content.match(/\*?【?生图提示词】?\s*\n*([\s\S]*?)$/i)
          if (promptMatch) {
            prompt = promptMatch[1].trim()
            // 移除可能的【生图提示词】标签
            prompt = prompt.replace(/^【?生图提示词】?\s*/i, '').trim()
          }

          // 如果没有找到明确的提示词，根据风格和房间生成一个
          if (!prompt) {
            prompt = `${room} interior design, ${styleDesc}, photorealistic, 8K quality, professional interior photography, natural lighting, high-end residential design`
          }

          // 返回分析结果（不包含提示词部分）
          const analysis = promptMatch
            ? content.replace(/\*?【?生图提示词】?\s*\n*[\s\S]*$/i, '').trim()
            : content

          resolve({
            analysis: analysis,
            prompt: prompt
          })
          return
        }

        reject(new Error('分析失败，未获取到有效响应'))
      },
      fail: (err) => {
        console.error('户型分析请求失败:', err)
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 调用 Agnes AI 生成图片（支持传递原始户型图）
 * @param {string} prompt - 图片提示词
 * @param {object} options - 可选配置
 * @param {string} options.referenceImage - 参考图片（base64或URL），用于图生图
 * @param {string} options.referenceImageType - 参考图片类型：'url' 或 'base64'，默认 'url'
 * @returns {Promise<string>} 生成的图片URL或base64
 */
export async function generateImage(prompt, options = {}) {
  const referenceImage = options.referenceImage

  // 构建请求数据
  const requestData = {
    model: 'agnes-image-2.1-flash',
    prompt: prompt,
    size: options.size || '1024x1024'
  }

  // 如果有参考图片，添加到请求中（图生图模式）
  if (referenceImage) {
    // Agnes AI 图生图：图片放在 extra_body.image 数组中
    // 使用 b64_json 格式避免 CDN 跨域问题
    requestData.extra_body = {
      image: [referenceImage],
      response_format: 'b64_json'
    }
    console.log('使用图生图模式，参考图片已传递（base64格式）')
  } else {
    // 文生图使用 return_base64
    requestData.return_base64 = true
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${AGNES_CONFIG.baseURL}${AGNES_CONFIG.imageEndpoint}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AGNES_CONFIG.apiKey}`
      },
      data: requestData,
      timeout: 120000,
      success: (res) => {
        console.log('Agnes AI 图片生成响应:', JSON.stringify(res.data))

        if (res.statusCode !== 200) {
          reject(new Error(`请求失败: ${res.statusCode}`))
          return
        }

        const data = res.data
        if (data.error) {
          reject(new Error(data.error.message || '图片生成失败'))
          return
        }

        // Agnes AI 返回格式：data.data[0].b64_json 或 data.data[0].url
        if (data.data && data.data[0]) {
          const imageData = data.data[0]
          // 优先返回 base64，避免 CDN 跨域问题
          if (imageData.b64_json) {
            resolve(`data:image/png;base64,${imageData.b64_json}`)
            return
          }
          if (imageData.url) {
            resolve(imageData.url)
            return
          }
        }

        reject(new Error('图片生成失败，未获取到有效响应'))
      },
      fail: (err) => {
        console.error('Agnes AI 图片生成失败:', err)
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 检查 API 额度
 * @returns {Promise<object>} 额度信息
 */
export async function checkQuota() {
  try {
    const response = await uni.request({
      url: 'https://api.minimax.chat/v1/query_balance',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${MINIMAX_CONFIG.apiKey}`
      }
    })
    return response.data
  } catch (error) {
    console.error('查询额度失败:', error)
    throw error
  }
}

/**
 * 上传 AI 生成的图片到服务器
 * @param {string} base64Data - base64 图片数据，格式为 data:image/xxx;base64,xxx
 * @returns {Promise<string>} 服务器上的图片 URL
 */
export async function uploadAiImage(base64Data) {
  console.log('开始上传 AI 图片，base64 长度:', base64Data.length)

  // 获取 token
  const token = uni.getStorageSync('token')

  // 获取后端 URL
  const baseUrl = import.meta.env.DEV ? 'http://localhost:8000' : ''

  return new Promise((resolve, reject) => {
    // 1. 将 base64 转换为临时文件路径
    const tempFilePath = `${wx.env.USER_DATA_PATH}/ai_temp_image_${Date.now()}.png`

    // 解析 base64 数据
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      reject(new Error('无效的 base64 图片格式'))
      return
    }

    const base64Content = matches[2]

    // 使用 uni.getFileSystemManager() 写入文件
    const fs = uni.getFileSystemManager()
    fs.writeFile({
      filePath: tempFilePath,
      data: base64Content,
      encoding: 'base64',
      success: () => {
        console.log('临时文件写入成功:', tempFilePath)
        // 2. 上传到服务器
        uni.uploadFile({
          url: `${baseUrl}/api/upload`,
          filePath: tempFilePath,
          name: 'file',
          formData: {
            folder: 'ai-images'
          },
          header: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          success: (uploadRes) => {
            console.log('上传响应:', uploadRes.data)
            try {
              const data = JSON.parse(uploadRes.data)
              if (data.code === 0) {
                // 返回完整的 URL
                let imageUrl = data.data.url
                if (imageUrl.startsWith('/')) {
                  imageUrl = `${baseUrl}${imageUrl}`
                }
                // 删除临时文件
                fs.unlink({
                  filePath: tempFilePath,
                  success: () => console.log('临时文件已删除'),
                  fail: () => console.log('临时文件删除失败')
                })
                resolve(imageUrl)
              } else {
                reject(new Error(data.msg || '上传失败'))
              }
            } catch (e) {
              reject(new Error('解析上传响应失败'))
            }
          },
          fail: (err) => {
            console.error('上传失败:', err)
            // 清理临时文件
            fs.unlink({
              filePath: tempFilePath,
              fail: () => {}
            })
            reject(new Error(err.errMsg || '上传失败'))
          }
        })
      },
      fail: (err) => {
        console.error('写入临时文件失败:', err)
        reject(new Error('写入临时文件失败'))
      }
    })
  })
}
