<template>
  <div class="network-selector">
    <div class="header">
      <div class="logo">WireShark // 代理日志</div>
      <div class="version">v0.0</div>
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

export default {
  name: 'NetworkInterfaceSelector',
  data() {
    return {
      networkInterfaceList: [],
      selectedIndex: -1,
      searchQuery: ''  // 搜索查询字符串
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
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
@media (max-width: 800px) {
  .network-list {
    grid-template-columns: 1fr;
  }
  
  .selector-content {
    padding: 20px;
  }
}

@media (max-width: 600px) {
  h2 {
    font-size: 20px;
  }

  pre {
    font-size: 12px;
  }
}
</style>
