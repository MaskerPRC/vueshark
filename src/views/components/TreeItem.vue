<template>
  <div class="tree-item">
    <div
        class="tree-header"
        @click="toggleExpand"
        :class="{ selected: isSelected }"
    >
      <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
      <span @click.stop="$emit('field-select', layer)">{{ layer.name }}</span>
    </div>
    <div v-if="expanded" class="tree-content">
      <div
          v-for="(field, index) in layer.fields"
          :key="index"
          class="field-item"
          :class="{ selected: isFieldSelected(field) }"
          @click="$emit('field-select', field)"
      >
        <span class="field-name">{{ field.name }}:</span>
        <span class="field-value">{{ field.value }}</span>
      </div>
      <TreeItem
          v-for="(sublayer, index) in layer.layers"
          :key="index"
          :layer="sublayer"
          @field-select="$emit('field-select', $event)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'TreeItem',
  props: {
    layer: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      expanded: true
    }
  },
  methods: {
    toggleExpand() {
      this.expanded = !this.expanded;
    },
    isFieldSelected(field) {
      return this.$parent.selectedField === field;
    }
  }
}
</script>

<style scoped>/* 产品B的修改后样式 */

/* 容器样式 */
.tree-container {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid black;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 树项样式 */
.tree-item {
  margin-left: 10px;
  transition: background-color 0.3s;
}

.tree-item:hover {
  background-color: #f9f9f9;
}

/* 树头部样式 */
.tree-header {
  cursor: pointer;
  padding: 10px;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
}

.tree-header:hover {
  background-color: #f0f0f0;
}

/* 展开图标样式 */
.expand-icon {
  display: inline-block;
  width: 16px;
  text-align: center;
  margin-right: 8px;
  font-size: 14px;
  color: #333;
}

/* 字段项样式 */
.field-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
}

.field-item:hover {
  background-color: #f0f0f0;
}

.field-item.selected {
  background-color: #e3f2fd;
}

/* 字段名称样式 */
.field-name {
  font-weight: bold;
  margin-right: 8px;
  color: #000;
}

/* 字段值样式 */
.field-value {
  color: #666;
  flex-grow: 1;
}

/* 额外的全局样式 */
body {
  background-color: #fff;
  color: #000;
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}

a {
  color: black;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

</style>
