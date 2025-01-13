<template>
  <div class="network-selector">
    <h2>请选择网卡</h2>
    <div class="search-container">
      <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索网卡..."
          class="search-input"
      />
    </div>
    <ul class="network-list">
      <div class="list-item"
          v-for="(item, index) in filteredNetworkInterfaceList"
          :key="item.name"
          @click="selectDevice(item.name)"
          :class="{ 'selected': selectedIndex === index }"
      >
        <h3>{{ item.name }}</h3>
        <pre>{{ item.description }}</pre>
      </div>
    </ul>
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
/* 产品B的重写样式 */
.network-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: white;
  border: 1px solid black;
  max-width: 800px; /* 增加最大宽度以适应多列布局 */
  margin: 0 auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: bold;
  color: #000;
}

.search-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  height: 40px;
  padding: 10px 15px;
  border: 1px solid black;
  font-size: 16px;
  color: #000;
  background-color: #fff;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #000;
  outline: none;
}

.network-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px; /* 适配器项之间的间距 */
  justify-content: center;
  width: 100%;
  padding: 0;
}

.network-list .list-item {
  cursor: pointer;
  border: 1px solid black;
  padding: 15px;
  background-color: #fff;
  transition: all 0.3s ease;
  flex: 1 1 calc(50% - 20px); /* 两列布局，减去间距 */
  box-sizing: border-box;
  max-width: 45%; /* 控制每个适配器项的最大宽度 */
}

.network-list .list-item:hover {
  border-color: #333;
  background-color: #f0f0f0;
}

.network-list .list-item.selected {
  border-color: #000;
  background-color: #e6e6e6;
}

.network-list h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #000;
}

.network-list pre {
  margin: 0;
  font-size: 14px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  background-color: #f9f9f9;
  padding: 10px;
}

/* 响应式设计 */
@media (max-width: 800px) {
  .network-list .list-item {
    flex: 1 1 calc(50% - 20px);
    max-width: 45%;
  }
}

@media (max-width: 600px) {
  .network-selector {
    padding: 20px;
    max-width: 100%;
  }

  .search-input {
    max-width: 100%;
  }

  h2 {
    font-size: 20px;
  }

  .network-list .list-item {
    flex: 1 1 100%;
    max-width: 100%;
  }

  .network-list pre {
    font-size: 12px;
    padding: 8px;
  }

  .network-list h3 {
    font-size: 16px;
  }
}
</style>
