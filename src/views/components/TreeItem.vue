<template>
  <div class="tree-item">
    <div
        class="tree-header"
        @click="toggleExpand"
        :class="{ selected: isSelected }"
    >
      <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
      <span class="item-name" @click.stop="$emit('field-select', layer)">{{ layer.name }}</span>
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

<style scoped>
/* 树项样式 */
.tree-item {
  margin-left: 15px;
  transition: background-color 0.2s;
  color: #e0e0e0;
}

/* 树头部样式 */
.tree-header {
  cursor: pointer;
  padding: 6px 0;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.tree-header:hover {
  background-color: #2a2a2a;
}

.tree-header.selected {
  background-color: #333;
}

/* 展开图标样式 */
.expand-icon {
  display: inline-block;
  width: 16px;
  text-align: center;
  margin-right: 8px;
  font-size: 10px;
  color: #00c8aa;
}

.item-name {
  color: #e0e0e0;
  font-weight: 500;
}

/* 树内容样式 */
.tree-content {
  padding-left: 10px;
  border-left: 1px dotted #333;
  margin-left: 8px;
}

/* 字段项样式 */
.field-item {
  padding: 6px 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.field-item:hover {
  background-color: #2a2a2a;
}

.field-item.selected {
  background-color: #333;
}

/* 字段名称样式 */
.field-name {
  color: #00c8aa;
  margin-right: 8px;
  font-weight: 500;
  font-size: 13px;
}

/* 字段值样式 */
.field-value {
  color: #a0a0a0;
  flex-grow: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
}
</style>
