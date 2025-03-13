<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
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

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'SF Mono', 'Segoe UI', monospace;
  background-color: var(--bg-darker);
  color: var(--text-light);
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-darker);
}

::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--accent);
}

/* 按钮统一样式 */
button {
  cursor: pointer;
}

input:focus, button:focus {
  outline: 1px solid var(--accent);
}
</style>
