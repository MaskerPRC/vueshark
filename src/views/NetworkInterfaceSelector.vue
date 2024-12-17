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
    <ul>
      <li
          v-for="(item, index) in filteredNetworkInterfaceList"
          :key="item.name"
          @click="selectDevice(item.name)"
          :class="{'selected': selectedIndex === index}"
      >
        <h3>{{ item.name }}</h3>
        <pre>{{ item.description }}</pre>
      </li>
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
.network-selector {
  padding: 20px;
  font-family: Arial, sans-serif;
}

h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.search-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  position: sticky; /* 固定位置 */
  top: 20px; /* 离顶部的距离 */
  z-index: 10; /* 确保搜索框在上面 */
  margin-bottom: 20px; /* 搜索框和下方内容的间距 */
}

.search-input {
  width: 300px; /* 固定宽度 */
  height: 40px; /* 固定高度 */
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  color: #333;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #1677ff;
  outline: none;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 10px;
  padding: 12px;
  background-color: #fff;
  transition: all 0.3s ease;
}

li:hover {
  border-color: #1677ff;
  background-color: #f7faff;
}

li.selected {
  border-color: #1677ff;
  background-color: #e6f4ff;
}

h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

pre {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
