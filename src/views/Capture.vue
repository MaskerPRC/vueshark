<template>
  <div style="display:flex; flex-direction:column; height:100vh; overflow:hidden;">
    <div style="flex-shrink:0; padding:20px;">
      <h3>正在捕获网卡: {{ deviceName }}</h3>
      <div style="margin-bottom:10px;">
        <label>筛选条件：</label>
        <input v-model="filter" placeholder="请输入BPF过滤表达式" style="width:200px; margin-right:10px;" />
        <button @click="onSearch">开始捕获</button>
      </div>
    </div>
    <div style="flex-grow:1; overflow:auto;">
      <table border="1" cellspacing="0" cellpadding="5" style="width:100%; border-collapse: collapse;">
        <thead>
        <tr>
          <th style="width:150px;">时间</th>
          <th>来源</th>
          <th>目标</th>
          <th>协议</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in captureResult" :key="item.index">
          <td>{{ formatTime(item.time) }}</td>
          <td>{{ item.source }}</td>
          <td>{{ item.target }}</td>
          <td>{{ item.protocol }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');

export default {
  name: 'Capture',
  data() {
    return {
      filter: '',
      captureResult: []
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
    }
  }
};
</script>
