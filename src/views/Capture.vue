<template>
  <div class="capture-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="logo">WireShark // 代理日志</div>
      <div class="window-controls">
        <div class="control-btn minimize" @click="minimizeWindow">
          <svg width="10" height="1" viewBox="0 0 10 1">
            <path d="M0 0h10v1H0z" fill="currentColor" />
          </svg>
        </div>
        <div class="control-btn maximize" @click="maximizeWindow">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" />
          </svg>
        </div>
        <div class="control-btn close" @click="closeWindow">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M6.4 5l3.3-3.3c0.4-0.4 0.4-1 0-1.4s-1-0.4-1.4 0L5 3.6 1.7 0.3c-0.4-0.4-1-0.4-1.4 0s-0.4 1 0 1.4L3.6 5 0.3 8.3c-0.4 0.4-0.4 1 0 1.4 0.2 0.2 0.5 0.3 0.7 0.3s0.5-0.1 0.7-0.3L5 6.4l3.3 3.3c0.2 0.2 0.5 0.3 0.7 0.3s0.5-0.1 0.7-0.3c0.4-0.4 0.4-1 0-1.4L6.4 5z" fill="currentColor" />
          </svg>
        </div>
      </div>
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

        <!-- 可拖动分隔符 -->
        <div class="resizer" @mousedown="startResizing"></div>

        <!-- 请求/响应详情面板 -->
        <div v-if="selectedPacket" class="details-panel" :style="{ height: detailsPanelHeight + 'px' }">
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

          <!-- 详情视图 - 改为左右分栏 -->
          <div class="detail-content">
            <!-- 左侧：树形结构 -->
            <div class="detail-left" :style="{ width: detailLeftWidth + '%' }">
              <div class="tree-view">
                <TreeItem
                  v-for="(layer, index) in selectedPacket.layers"
                  :key="index"
                  :layer="layer"
                  @field-select="onFieldSelect"
                />
              </div>
            </div>

            <!-- 左右分隔符 -->
            <div class="vertical-resizer" @mousedown="startHorizontalResizing"></div>

            <!-- 右侧：字段解释 -->
            <div class="detail-right" :style="{ width: (100 - detailLeftWidth) + '%' }">
              <template v-if="selectedField">
                <div class="field-info">
                  <div class="field-info-header">字段信息</div>
                  <div class="field-info-content">
                    <div class="field-info-item">
                      <div class="field-info-label">字段名称</div>
                      <div class="field-info-value">{{ selectedField.name }}</div>
                    </div>
                    <div class="field-info-item">
                      <div class="field-info-label">当前值</div>
                      <div class="field-info-value">{{ selectedField.value }}</div>
                    </div>
                    <div class="field-info-item">
                      <div class="field-info-label">描述</div>
                      <div class="field-info-value">{{ selectedField.description || '暂无描述' }}</div>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="no-field-selected">
                请选择左侧字段查看详细信息
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');
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
      selectedField: null,
      detailsPanelHeight: 300,
      detailLeftWidth: 60,
      isResizing: false,
      isHorizontalResizing: false,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      deviceName: '',
      autoScroll: true,
      activeTab: 'request',  // 当前活动选项卡：'request'或'response'
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
    document.removeEventListener('mousemove', this.handleResizing);
    document.removeEventListener('mouseup', this.stopResizing);
    document.removeEventListener('mousemove', this.handleHorizontalResizing);
    document.removeEventListener('mouseup', this.stopHorizontalResizing);
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
    },
    startResizing(e) {
      this.isResizing = true;
      this.startY = e.clientY;
      this.startHeight = this.detailsPanelHeight;

      // 添加禁用文本选择的类
      document.body.classList.add('resizing');

      document.addEventListener('mousemove', this.handleResizing);
      document.addEventListener('mouseup', this.stopResizing);
    },

    handleResizing(e) {
      if (!this.isResizing) return;

      const deltaY = this.startY - e.clientY;
      const newHeight = Math.max(100, Math.min(window.innerHeight - 200, this.startHeight + deltaY));
      this.detailsPanelHeight = newHeight;
    },

    stopResizing() {
      this.isResizing = false;

      // 移除禁用文本选择的类
      document.body.classList.remove('resizing');

      document.removeEventListener('mousemove', this.handleResizing);
      document.removeEventListener('mouseup', this.stopResizing);
    },
    startHorizontalResizing(e) {
      this.isHorizontalResizing = true;
      this.startX = e.clientX;
      this.startWidth = this.detailLeftWidth;

      // 添加禁用文本选择的类
      document.body.classList.add('resizing');

      document.addEventListener('mousemove', this.handleHorizontalResizing);
      document.addEventListener('mouseup', this.stopHorizontalResizing);
    },

    handleHorizontalResizing(e) {
      if (!this.isHorizontalResizing) return;

      const container = e.target.parentElement;
      const containerWidth = container.offsetWidth;
      const deltaX = e.clientX - this.startX;
      const deltaPercentage = (deltaX / containerWidth) * 100;

      const newWidth = Math.max(20, Math.min(80, this.startWidth + deltaPercentage));
      this.detailLeftWidth = newWidth;
    },

    stopHorizontalResizing() {
      this.isHorizontalResizing = false;

      // 移除禁用文本选择的类
      document.body.classList.remove('resizing');

      document.removeEventListener('mousemove', this.handleHorizontalResizing);
      document.removeEventListener('mouseup', this.stopHorizontalResizing);
    },
    // 窗口控制函数
    minimizeWindow() {
      ipcRenderer.send('window-control', 'minimize');
    },
    maximizeWindow() {
      ipcRenderer.send('window-control', 'maximize');
    },
    closeWindow() {
      ipcRenderer.send('window-control', 'close');
    },
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
  -webkit-app-region: drag;
}

.logo {
  font-size: 16px;
  font-weight: bold;
  color: var(--accent);
  -webkit-app-region: no-drag;
}

/* 窗口控制按钮 */
.window-controls {
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-right: 15px;
  -webkit-app-region: no-drag;
}

.control-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  margin-left: 2px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-light);
}

.control-btn svg {
  width: 10px;
  height: 10px;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.minimize:hover {
  background-color: #565656;
}

.maximize:hover {
  background-color: #565656;
}

.close:hover {
  background-color: #E81123;
  color: white;
}

.version {
  color: var(--text-light);
  font-size: 12px;
  -webkit-app-region: no-drag;
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
  position: relative;
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
  min-height: 100px;
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

/* 可拖动分隔符样式 */
.resizer {
  height: 4px;
  background-color: var(--border-color);
  cursor: row-resize;
  transition: background-color 0.2s;
}

.resizer:hover {
  background-color: var(--accent);
}

/* 修改详情面板样式 */
.details-panel {
  border-top: none;
  min-height: 100px;
  max-height: calc(100vh - 200px);
  background-color: var(--bg-darker);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: height 0.1s;
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

/* 修改内容区域样式 */
.detail-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.detail-left {
  overflow: auto;
  padding: 15px;
  border-right: none;
  position: relative;
  transition: width 0.1s;
}

.detail-right {
  overflow: auto;
  padding: 15px;
  background-color: var(--bg-darker);
  position: relative;
  transition: width 0.1s;
}

.tree-view {
  font-family: 'SF Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.field-info {
  color: var(--text-light);
}

.field-info-header {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: var(--accent);
}

.field-info-content {
  background-color: var(--bg-dark);
  border-radius: 6px;
  overflow: hidden;
}

.field-info-item {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.field-info-item:last-child {
  border-bottom: none;
}

.field-info-label {
  font-size: 12px;
  color: var(--text-light);
  opacity: 0.7;
  margin-bottom: 4px;
}

.field-info-value {
  font-size: 14px;
  color: var(--text-light);
  word-break: break-all;
}

.no-field-selected {
  color: var(--text-light);
  opacity: 0.5;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

/* 滚动条样式 */
.packet-table::-webkit-scrollbar,
.detail-left::-webkit-scrollbar,
.detail-right::-webkit-scrollbar {
  width: 8px;
  background-color: var(--bg-darker);
}

.packet-table::-webkit-scrollbar-thumb,
.detail-left::-webkit-scrollbar-thumb,
.detail-right::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 4px;
}

.packet-table::-webkit-scrollbar-thumb:hover,
.detail-left::-webkit-scrollbar-thumb:hover,
.detail-right::-webkit-scrollbar-thumb:hover {
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

  .detail-content {
    flex-direction: column;
  }

  .detail-left,
  .detail-right {
    width: 100%;
  }

  .detail-left {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
}

/* 垂直分隔符样式 */
.vertical-resizer {
  width: 4px;
  background-color: var(--border-color);
  cursor: col-resize;
  transition: background-color 0.2s;
}

.vertical-resizer:hover {
  background-color: var(--accent);
}

/* 禁用文本选择 */
:global(.resizing) {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  cursor: inherit !important;
}

/* 分隔符默认禁用文本选择 */
.resizer,
.vertical-resizer {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
