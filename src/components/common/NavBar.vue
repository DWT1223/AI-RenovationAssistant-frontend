<template>
  <view class="nav-bar" :style="customStyle">
    <view class="nav-bar-content">
      <slot></slot>
    </view>
  </view>
</template>

<script>
export default {
  name: 'NavBar',
  props: {
    fixed: {
      type: Boolean,
      default: true
    },
    background: {
      type: String,
      default: '#fff'
    },
    height: {
      type: Number,
      default: 88
    }
  },
  computed: {
    customStyle() {
      return `background: ${this.background};`
    }
  }
}
</script>

<style scoped>
.nav-bar {
  position: relative;
  width: 100%;
}

.nav-bar-content {
  position: relative;
}
</style>
