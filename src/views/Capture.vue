<template>
  <div class="capture-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h3>正在捕获网卡: {{ deviceName }}</h3>
      <div class="filter-bar">
        <label>筛选条件：</label>
        <input v-model="filter" placeholder="请输入BPF过滤表达式" />
        <button @click="onSearch" class="capture-button">开始捕获</button>
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="main-content">
      <!-- 封包列表 -->
      <div class="packet-list">
        <table>
          <thead>
          <tr>
            <th>No.</th>
            <th>Time</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Protocol</th>
            <th>Length</th>
            <th>Info</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="packet in captureResult"
              :key="packet.index"
              :class="{ selected: selectedPacket === packet }"
              @click="selectPacket(packet)"
          >
            <td>{{ packet.index }}</td>
            <td>{{ formatTime(packet.time) }}</td>
            <td>{{ packet.source }}</td>
            <td>{{ packet.target }}</td>
            <td>{{ packet.protocol }}</td>
            <td>{{ packet.length }}</td>
            <td>{{ packet.info }}</td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- 下半部分：封包详情和字段解释 -->
      <div class="detail-section">
        <!-- 左侧：封包详情树形结构 -->
        <div class="packet-details">
          <template v-if="selectedPacket">
            <div class="tree-view">
              <TreeItem
                  v-for="(layer, index) in selectedPacket.layers"
                  :key="index"
                  :layer="layer"
                  @field-select="onFieldSelect"
              />
            </div>
          </template>
        </div>

        <!-- 右侧：字段解释 -->
        <div class="field-description">
          <template v-if="selectedField">
            <h4>字段信息</h4>
            <div class="field-info">
              <p><strong>字段名称：</strong>{{ selectedField.name }}</p>
              <p><strong>当前值：</strong>{{ selectedField.value }}</p>
              <p><strong>描述：</strong>{{ getFieldDescription(selectedField) }}</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import TreeItem from './components/TreeItem.vue';
import { protocolDefs } from '../utils/protocol-definitions';

export default {
  name: 'Capture',
  components: {
    TreeItem
  },
  data() {
    return {
      filter: '',
      captureResult: [],
      selectedPacket: null,
      selectedField: null
    };
  },
  computed: {
    deviceName() {
      return this.$route.params.deviceName;
    }
  },
  mounted() {
    // 开始捕获
    this.startCapture();

    // 监听捕获结果事件
    ipcRenderer.on('capture.on.packet', this.onPacket);
  },
  beforeUnmount() {
    ipcRenderer.removeListener('capture.on.packet', this.onPacket);
  },
  methods: {
    onPacket(event, result) {
      // 新包到达时加入列表
      this.captureResult.push(result);
    },
    async startCapture() {
      await ipcRenderer.invoke('start.capture', { filter: this.filter });
    },
    onSearch() {
      // 清空之前的捕获结果，并重新开始
      this.captureResult = [];
      this.startCapture();
    },
    formatTime(ts) {
      const d = new Date(ts);
      return d.toLocaleString();
    },
    selectPacket(packet) {
      this.selectedPacket = packet;
      this.selectedField = null;
    },
    onFieldSelect(field) {
      this.selectedField = field;
    },
    getFieldDescription(field) {
      return protocolDefs.getFieldDescription(field.protocol, field.name, field.value);
    }
  }
};
</script>

<style scoped>
/* 主容器样式 */
.capture-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #ffffff; /* 白色背景 */
  font-family: Arial, sans-serif;
  color: #000000; /* 黑色字体 */
  overflow: hidden;
}

/* 顶部工具栏样式 */
.toolbar {
  padding: 15px;
  background: #000000; /* 黑色背景 */
  color: white;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 2px solid #333333;
}

.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

.filter-bar label {
  font-size: 14px;
}

.filter-bar input {
  padding: 8px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #cccccc;
  width: 250px;
  background-color: #f8f8f8;
}

.capture-button {
  padding: 8px 16px;
  background-color: #000000;
  color: white;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.capture-button:hover {
  background-color: #444444;
}

/* 主内容区域样式 */
.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  padding: 15px;
}

/* 封包列表样式 */
.packet-list {
  height: 50%;
  overflow: auto;
  margin-bottom: 10px;
}

.packet-list table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.packet-list th,
.packet-list td {
  padding: 8px;
  border: 1px solid #dddddd;
  text-align: left;
}

.packet-list th {
  background-color: #f2f2f2;
}

.packet-list tr.selected {
  background-color: #e6e6e6;
}

/* 下半部分：封包详情和字段解释 */
.detail-section {
  display: flex;
  height: 50%;
  overflow: hidden;
}

.packet-details {
  width: 60%;
  overflow: auto;
  border-right: 2px solid #dddddd;
  padding: 15px;
  background-color: #ffffff;
}

.field-description {
  width: 40%;
  padding: 15px;
  background-color: #ffffff;
}

.tree-view {
  font-family: monospace;
  font-size: 12px;
}

.field-info {
  font-size: 12px;
  line-height: 1.6;
}

.field-info p {
  margin-bottom: 10px;
}

h4 {
  font-size: 16px;
  color: #000000;
  font-weight: 600;
  margin-bottom: 15px;
}
</style>
