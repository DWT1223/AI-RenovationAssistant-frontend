/**
 * 常量定义
 */

// 账单分类
export const BILL_CATEGORIES = [
  { value: '设计费', label: '设计费', icon: '✏️' },
  { value: '硬装', label: '硬装', icon: '🏗️' },
  { value: '水电', label: '水电', icon: '💧' },
  { value: '瓷砖', label: '瓷砖', icon: '🧱' },
  { value: '地板', label: '地板', icon: '🪵' },
  { value: '门窗', label: '门窗', icon: '🚪' },
  { value: '橱柜', label: '橱柜', icon: '🗄️' },
  { value: '家具', label: '家具', icon: '🛋️' },
  { value: '家电', label: '家电', icon: '📺' },
  { value: '软装', label: '软装', icon: '🪑' },
  { value: '人工杂费', label: '人工杂费', icon: '👷' },
  { value: '其他', label: '其他', icon: '📦' }
]

// 笔记分类
export const NOTE_CATEGORIES = [
  { value: '硬装', label: '硬装' },
  { value: '软装', label: '软装' },
  { value: '水电', label: '水电' },
  { value: '主材', label: '主材' },
  { value: '避坑指南', label: '避坑指南' }
]

// 装修阶段
export const DECORATION_STAGES = [
  { value: '开工', label: '开工' },
  { value: '拆改', label: '拆改' },
  { value: '水电', label: '水电' },
  { value: '泥瓦', label: '泥瓦' },
  { value: '木工', label: '木工' },
  { value: '油漆', label: '油漆' },
  { value: '安装', label: '安装' },
  { value: '竣工', label: '竣工' }
]

// 户型类型
export const HOUSE_TYPES = [
  { value: '一居', label: '一居室' },
  { value: '两居', label: '两居室' },
  { value: '三居', label: '三居室' },
  { value: '四居', label: '四居室及以上' },
  { value: '公寓', label: '公寓' },
  { value: '复式', label: '复式' },
  { value: '别墅', label: '别墅' }
]

// 预算档位
export const BUDGET_LEVELS = [
  { value: '5万以下', label: '5万以下', min: 0, max: 50000 },
  { value: '5-10万', label: '5-10万', min: 50000, max: 100000 },
  { value: '10-20万', label: '10-20万', min: 100000, max: 200000 },
  { value: '20-30万', label: '20-30万', min: 200000, max: 300000 },
  { value: '30万以上', label: '30万以上', min: 300000 }
]

// 装修风格
export const DECORATION_STYLES = [
  '现代简约', '奶油风', '轻奢', '原木风', '北欧风',
  '日式', '美式', '极简', '新中式', 'ins风'
]

// 户型图类型
export const HOUSE_IMG_TYPES = [
  { value: '原始户型', label: '原始户型' },
  { value: '改造户型', label: '改造户型' },
  { value: '竣工户型', label: '竣工户型' },
  { value: '毛坯实拍', label: '毛坯实拍' }
]
