<template>
  <div class="capture-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h3>正在捕获网卡: {{ deviceName }}</h3>
      <div class="filter-bar">
        <label>筛选条件：</label>
        <input v-model="filter" placeholder="请输入BPF过滤表达式"/>
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
              <p><strong>描述：</strong>{{ selectedField.description }}</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {ipcRenderer} from 'electron';
import TreeItem from './components/TreeItem.vue';

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
      await ipcRenderer.invoke('start.capture', {filter: this.filter});
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
    }
  }
};
</script>

<style scoped>/* 主容器样式 */
.capture-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #ffffff; /* 白色背景 */
  font-family: Arial, sans-serif;
  color: #000000; /* 黑色字体 */
  overflow: hidden;
  padding: 0px 40px 20px 40px;
}

/* 顶部工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white; /* 白色背景 */
}

.toolbar-title {
  font-size: 24px;
  font-weight: bold;
  color: #000;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.capture-button {
  background: black;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.capture-button:hover {
  background: #333;
}

/* 过滤栏样式 */
.filter-bar {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 30px;
}

.filter-bar label {
  font-size: 16px;
  color: #000;
}

.filter-bar input {
  padding: 10px;
  font-size: 16px;
  border: 1px solid #000;
  background-color: #fff;
  width: 250px;
  color: #000;
}

/* 主内容区域样式 */
.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* 封包列表样式 */
.packet-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  padding-right: 10px;
  border: 1px solid #000;
}

.packet-list table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.packet-list th,
.packet-list td {
  padding: 12px;
  border: 1px solid #000;
  text-align: left;
}

.packet-list th {
  background-color: #000;
  color: #fff;
}

.packet-list tr {
  transition: background-color 0.3s, transform 0.3s;
}

.packet-list tr:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.packet-list tr.selected {
  background-color: #e0e0e0;
}

/* 下半部分：封包详情和字段解释 */
.detail-section {
  display: flex;
  height: 50%;
  overflow: hidden;
  gap: 20px;
}

.packet-details {
  width: 60%;
  overflow: auto;
  border: 1px solid #000;
  background-color: #ffffff;
}

.field-description {
  width: 40%;
  padding: 20px;
  border: 1px solid #000;
  background-color: #ffffff;
}

.tree-view {
  font-family: monospace;
  font-size: 14px;
}

.field-info {
  font-size: 14px;
  line-height: 1.6;
}

.field-info p {
  margin-bottom: 10px;
}

h4 {
  font-size: 18px;
  color: #000000;
  font-weight: 600;
  margin-bottom: 15px;
}

/* 滚动条样式 */
.packet-list::-webkit-scrollbar,
.packet-details::-webkit-scrollbar,
.field-description::-webkit-scrollbar {
  width: 8px;
  background-color: #ffffff; /* 滚动条背景色 */
}

.packet-list::-webkit-scrollbar-track,
.packet-details::-webkit-scrollbar-track,
.field-description::-webkit-scrollbar-track {
  background-color: #ffffff; /* 滚动条轨道背景色 */
}

.packet-list::-webkit-scrollbar-thumb,
.packet-details::-webkit-scrollbar-thumb,
.field-description::-webkit-scrollbar-thumb {
  background-color: #000000; /* 滚动条滑块颜色 */
}

.packet-list::-webkit-scrollbar-thumb:hover,
.packet-details::-webkit-scrollbar-thumb:hover,
.field-description::-webkit-scrollbar-thumb:hover {
  background-color: #333333; /* 滑块悬停颜色 */
}

/* 响应式设计调整 */
@media (max-width: 1200px) {
  .packet-details {
    width: 100%;
    margin-bottom: 20px;
  }

  .field-description {
    width: 100%;
  }

  .detail-section {
    flex-direction: column;
  }
}

</style>
