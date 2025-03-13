<template>
  <div class="capture-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="logo">WireShark // 代理日志</div>
      <div class="version">v0.0</div>
    </div>

    <!-- 左侧导航 -->
    <div class="main-layout">
      <div class="sidebar">
        <div class="nav-item active">
          <i class="icon">🏠</i>
        </div>
        <div class="nav-item">
          <i class="icon">&lt;/&gt;</i>
        </div>
        <div class="nav-item">
          <i class="icon">⟳</i>
        </div>
        <div class="nav-item">
          <i class="icon">📁</i>
        </div>
      </div>

      <!-- 主体内容区域 -->
      <div class="content-area">
        <!-- 搜索过滤器 -->
        <div class="search-bar">
          <div class="filter-icon">🔍</div>
          <input v-model="filter" placeholder="搜索代理日志..." />
          <button @click="onSearch" class="capture-button">开始捕获</button>
          <div class="clear-button">🗑️</div>
        </div>

        <!-- 封包列表表格 -->
        <div class="packet-table">
          <table>
            <thead>
              <tr>
                <th>方法</th>
                <th>源</th>
                <th>路径</th>
                <th>状态</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="packet in captureResult"
                :key="packet.index"
                :class="{ selected: selectedPacket === packet }"
                @click="selectPacket(packet)"
              >
                <td class="method">{{ packet.protocol }}</td>
                <td class="origin">{{ packet.source }}</td>
                <td class="path">{{ packet.info }}</td>
                <td class="status">
                  <span class="status-badge" :class="getStatusClass(packet)">
                    {{ packet.length }} {{ getStatusText(packet) }}
                  </span>
                </td>
                <td class="actions">
                  <button class="copy-btn">📋</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 请求/响应详情面板 -->
        <div v-if="selectedPacket" class="details-panel">
          <div class="panel-header">
            <div class="panel-title">
              {{ selectedPacket.protocol }} {{ selectedPacket.target }}
            </div>
            <div class="request-info">
              <span class="request-label">REQUEST</span>
              <span class="request-body">Body ({{ selectedPacket.length }} bytes)</span>
              <span class="request-headers">Headers</span>
            </div>
            <div class="status-label" :class="getStatusClass(selectedPacket)">
              HTTP/1.1 {{ getStatusCode(selectedPacket) }}
            </div>
            <div class="response-label">RESPONSE</div>
          </div>

          <!-- 详情视图 -->
          <div class="detail-content">
            <div class="tree-view">
              <TreeItem
                v-for="(layer, index) in selectedPacket.layers"
                :key="index"
                :layer="layer"
                @field-select="onFieldSelect"
              />
            </div>
          </div>
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
      filter: 'port 53',
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
    },
    getStatusClass(packet) {
      // 根据状态返回不同的CSS类
      if (packet.length < 100) return 'status-error'; 
      if (packet.length < 300) return 'status-success';
      return 'status-warning';
    },
    getStatusText(packet) {
      // 根据状态返回不同的文本
      if (packet.length < 100) return 'ERROR';
      if (packet.length < 300) return 'OK';
      return 'NOT MODIFIED';
    },
    getStatusCode(packet) {
      // 模拟状态码，实际应当从packet中获取
      if (packet.length < 100) return '404 Not Found';
      if (packet.length < 300) return '200 OK';
      return '304 Not Modified';
    }
  }
};
</script>

<style scoped>
/* 主题颜色变量 */
:root {
  --bg-dark: #1a1a1a;
  --bg-darker: #121212;
  --text-light: #e0e0e0;
  --accent: #00c8aa;
  --sidebar-bg: #1a1a1a;
  --header-bg: #121212;
  --border-color: #333;
  --success-color: #00c8aa;
  --warning-color: #ffab00;
  --error-color: #ff5252;
  --hover-bg: #2a2a2a;
  --selection-bg: #333;
}

/* 主容器样式 */
.capture-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-dark);
  font-family: 'SF Mono', 'Segoe UI', monospace;
  color: var(--text-light);
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* 顶部导航栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--header-bg);
  padding: 0 20px;
  height: 40px;
  border-bottom: 1px solid var(--border-color);
}

.logo {
  font-size: 16px;
  font-weight: bold;
  color: var(--accent);
}

.version {
  color: var(--text-light);
  font-size: 12px;
}

/* 主布局 */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 60px;
  background-color: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}

.nav-item {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  border-radius: 4px;
  cursor: pointer;
}

.nav-item.active {
  background-color: var(--hover-bg);
}

.nav-item:hover {
  background-color: var(--hover-bg);
}

.icon {
  font-size: 18px;
  color: var(--text-light);
}

/* 内容区域 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  margin: 15px;
  background-color: var(--bg-darker);
  border-radius: 4px;
  padding: 5px 10px;
}

.filter-icon {
  margin-right: 10px;
  color: var(--text-light);
}

.search-bar input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-light);
  padding: 8px;
  font-size: 14px;
  outline: none;
}

.capture-button {
  background-color: var(--accent);
  color: var(--bg-dark);
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  margin: 0 10px;
}

.clear-button {
  cursor: pointer;
  color: var(--text-light);
}

/* 封包表格 */
.packet-table {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px;
}

.packet-table table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.packet-table th {
  text-align: left;
  padding: 10px 15px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-light);
  font-weight: normal;
  font-size: 14px;
}

.packet-table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-light);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.packet-table tr {
  cursor: pointer;
  transition: background-color 0.2s;
}

.packet-table tr:hover {
  background-color: var(--hover-bg);
}

.packet-table tr.selected {
  background-color: var(--selection-bg);
}

/* 表格列宽 */
.method {
  width: 80px;
}

.origin {
  width: 25%;
}

.path {
  width: 45%;
}

.status {
  width: 140px;
}

.actions {
  width: 50px;
  text-align: center;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-align: center;
}

.status-success {
  background-color: var(--success-color);
  color: var(--bg-dark);
}

.status-warning {
  background-color: var(--warning-color);
  color: var(--bg-dark);
}

.status-error {
  background-color: var(--error-color);
  color: var(--bg-dark);
}

/* 复制按钮 */
.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  opacity: 0.6;
}

.copy-btn:hover {
  opacity: 1;
}

/* 详情面板 */
.details-panel {
  height: 50%;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-darker);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-weight: bold;
  margin-right: 20px;
  font-size: 16px;
}

.request-info {
  display: flex;
  flex: 1;
  align-items: center;
}

.request-label,
.response-label {
  color: var(--text-light);
  font-size: 12px;
  opacity: 0.7;
  margin-right: 15px;
}

.request-body,
.request-headers {
  margin-right: 15px;
  font-size: 14px;
  padding: 4px 8px;
  background-color: var(--hover-bg);
  border-radius: 4px;
  cursor: pointer;
}

.request-body {
  background-color: var(--selection-bg);
}

.status-label {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  margin-right: 15px;
}

/* 详情内容 */
.detail-content {
  flex: 1;
  overflow: auto;
  padding: 15px;
}

.tree-view {
  font-family: 'SF Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

/* 滚动条样式 */
.packet-table::-webkit-scrollbar,
.detail-content::-webkit-scrollbar {
  width: 8px;
  background-color: var(--bg-darker);
}

.packet-table::-webkit-scrollbar-thumb,
.detail-content::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 4px;
}

.packet-table::-webkit-scrollbar-thumb:hover,
.detail-content::-webkit-scrollbar-thumb:hover {
  background-color: var(--accent);
}

/* 媒体查询 */
@media (max-width: 1200px) {
  .panel-header {
    flex-wrap: wrap;
  }
  
  .panel-title {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>
