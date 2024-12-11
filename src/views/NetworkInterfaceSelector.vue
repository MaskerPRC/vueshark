<template>
  <div style="padding: 20px;">
    <h2>请选择一张网卡</h2>
    <ul>
      <li
          v-for="(item, index) in networkInterfaceList"
          :key="item.name"
          @click="selectDevice(item.name)"
          :style="{'cursor': 'pointer', 'border': selectedIndex === index ? '1px solid #1677ff' : '1px solid #ccc', 'border-radius': '8px', 'margin-bottom':'10px', 'padding':'10px'}"
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
      selectedIndex: -1
    };
  },
  async mounted() {
    const networkInterfaces = await ipcRenderer.invoke('get.network.interfaces');
    // networkInterfaces是 {接口名: [ {address, family, ...}, ...], ...}
    // 将其转换为 {name, description} 列表
    const list = Object.keys(networkInterfaces).map(name => {
      const detail = (networkInterfaces[name] || []).map(info => `${info.family}: ${info.address}, ${info.mac}`).join('\n');
      return {
        name,
        description: detail
      };
    });
    this.networkInterfaceList = list;
  },
  methods: {
    async selectDevice(deviceName) {
      await ipcRenderer.invoke('set.device.name', { deviceName });
      this.$router.push(`/capture/${deviceName}`);
    }
  }
};
</script>
