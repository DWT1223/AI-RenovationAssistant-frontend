<template>
  <view class="sticky-tab" :style="customStyle">
    <view
      v-for="tab in tabs"
      :key="tab.value"
      :class="['sticky-tab-item', { active: modelValue === tab.value }]"
      @click="handleClick(tab.value)"
    >
      <text class="tab-label">{{ tab.label }}</text>
      <view class="tab-indicator" v-if="modelValue === tab.value"></view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'StickyTab',
  props: {
    tabs: {
      type: Array,
      required: true
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    fixed: {
      type: Boolean,
      default: true
    },
    top: {
      type: Number,
      default: 0
    }
  },
  computed: {
    customStyle() {
      if (this.fixed) {
        return `position: fixed; top: ${this.top}px; left: 0; right: 0; z-index: 100;`
      }
      return ''
    }
  },
  methods: {
    handleClick(value) {
      this.$emit('update:modelValue', value)
      this.$emit('change', value)
      this.$emit('click', value)
    }
  }
}
</script>

<style scoped>
.sticky-tab {
  display: flex;
  background: #fff;
  padding: 0 48rpx;
  height: 100rpx;
  align-items: center;
}

.sticky-tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 100%;
}

.tab-label {
  font-size: 30rpx;
  color: #9CA3AF;
  transition: color 0.2s;
}

.sticky-tab-item.active .tab-label {
  color: #6366F1;
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  width: 48rpx;
  height: 6rpx;
  background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 3rpx;
}
</style>
