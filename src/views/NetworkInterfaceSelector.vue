<template>
  <div class="network-selector">
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
      <div class="version">{{ version }}</div>
    </div>

    <div class="selector-content">
      <h2>选择网络接口</h2>
      <div class="search-container">
        <div class="filter-icon">🔍</div>
        <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索网卡..."
            class="search-input"
        />
      </div>
      <div class="network-list">
        <div class="list-item"
            v-for="(item, index) in filteredNetworkInterfaceList"
            :key="item.name"
            @click="selectDevice(item.name)"
            :class="{ 'selected': selectedIndex === index }"
        >
          <div class="interface-icon">📶</div>
          <div class="interface-details">
            <h3>{{ item.name }}</h3>
            <pre>{{ item.description }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');
const config = require('../config');

export default {
  name: 'NetworkInterfaceSelector',
  data() {
    return {
      networkInterfaceList: [],
      selectedIndex: -1,
      searchQuery: '',  // 搜索查询字符串
      version: config.version
    };
  },
  async mounted() {
    const networkInterfaces = await ipcRenderer.invoke('get.network.interfaces');
    const list = Object.keys(networkInterfaces).map(name => {
      const detail = (networkInterfaces[name] || [])
          .map(info => `${info.family}: ${info.address}, ${info.mac}`)
          .join('\n');
      return { name, description: detail };
    });
    this.networkInterfaceList = list;
  },
  computed: {
    // 过滤后的网卡列表，依据searchQuery进行模糊搜索
    filteredNetworkInterfaceList() {
      const query = this.searchQuery.trim().toLowerCase();
      if (!query) return this.networkInterfaceList;  // 如果没有搜索内容，返回所有网卡

      return this.networkInterfaceList.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const descriptionMatch = item.description.toLowerCase().includes(query);
        return nameMatch || descriptionMatch;  // 匹配name或description字段
      });
    }
  },
  methods: {
    async selectDevice(deviceName) {
      await ipcRenderer.invoke('set.device.name', { deviceName });
      this.$router.push(`/capture/${deviceName}`);
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
    }
  }
};
</script>

<style scoped>
/* 网络选择器容器 */
.network-selector {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-dark);
  overflow: hidden;
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

/* 选择内容区域 */
.selector-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  max-width: 900px;
  margin: 0 auto;
  flex: 1;
  overflow-y: auto;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: bold;
  color: var(--text-light);
}

/* 搜索框 */
.search-container {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin-bottom: 30px;
  background-color: var(--bg-darker);
  border-radius: 4px;
  padding: 5px 10px;
}

.filter-icon {
  margin-right: 10px;
  color: var(--text-light);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px;
  font-size: 16px;
  color: var(--text-light);
  outline: none;
}

/* 网络列表 */
.network-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 改为固定的3列布局 */
  gap: 20px;
  width: 100%;
}

.list-item {
  display: flex;
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 15px;
  background-color: var(--bg-darker);
  transition: all 0.2s ease;
}

.list-item:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.list-item.selected {
  border-color: var(--accent);
  background-color: var(--hover-bg);
}

.interface-icon {
  font-size: 24px;
  margin-right: 15px;
  color: var(--accent);
}

.interface-details {
  flex: 1;
}

h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: var(--text-light);
}

pre {
  margin: 0;
  font-size: 14px;
  color: var(--text-light);
  opacity: 0.7;
  white-space: pre-wrap;
  word-break: break-word;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 4px;
  font-family: 'SF Mono', monospace;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .network-list {
    grid-template-columns: repeat(2, 1fr); /* 中等屏幕显示2列 */
  }
  
  .selector-content {
    padding: 20px;
  }
}

@media (max-width: 700px) {
  .network-list {
    grid-template-columns: 1fr; /* 小屏幕才降为1列 */
  }
  
  h2 {
    font-size: 20px;
  }

  pre {
    font-size: 12px;
  }
}
</style>
