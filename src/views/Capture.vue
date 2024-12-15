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
      <div class="packet-list">
        <div v-for="packet in captureResult" :key="packet.index" class="packet-item">
          <div class="packet-header">
            <span>#{{ packet.index }}</span>
            <span>{{ new Date(packet.time).toLocaleTimeString() }}</span>
            <span>{{ packet.protocol }}</span>
          </div>
          <div class="packet-details">
            <div>源地址: {{ packet.source }}</div>
            <div>目标地址: {{ packet.target }}</div>

            <!-- HTTP信息展示 -->
            <div v-if="packet.http" class="http-details">
              <div class="http-type">{{ packet.http.type === 'request' ? 'HTTP请求' : 'HTTP响应' }}</div>
              <template v-if="packet.http.type === 'request'">
                <div>方法: {{ packet.http.method }}</div>
                <div>URL: {{ packet.http.url }}</div>
              </template>
              <template v-else>
                <div>状态码: {{ packet.http.statusCode }}</div>
              </template>
              <div class="headers">
                <div>Headers:</div>
                <div v-for="(value, key) in packet.http.headers" :key="key" class="header-item">
                  {{ key }}: {{ value }}
                </div>
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
