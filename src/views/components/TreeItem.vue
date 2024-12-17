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

<style scoped>
.tree-item {
  margin-left: 10px;
}

.tree-header {
  cursor: pointer;
  padding: 2px 0;
}

.tree-header:hover {
  background-color: #f0f0f0;
}

.expand-icon {
  display: inline-block;
  width: 16px;
  text-align: center;
}

.field-item {
  padding: 2px 0 2px 16px;
  cursor: pointer;
}

.field-item:hover {
  background-color: #f0f0f0;
}

.field-item.selected {
  background-color: #e3f2fd;
}

.field-name {
  font-weight: bold;
  margin-right: 8px;
}

.field-value {
  color: #666;
}
</style> 