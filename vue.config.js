const { defineConfig } = require('@vue/cli-service')
const nodeExternals = require('webpack-node-externals');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    target: 'electron-renderer',
    externals: [nodeExternals()],
    devtool: 'source-map',
  },
  pluginOptions: {
    electronBuilder: {
      chainWebpackMainProcess: (config) => {
        config.module
            .rule('node')
            .test(/\.node$/)
            .use('node-loader')
            .loader('node-loader')
            .end();
        config.devtool('source-map')
      },
      builderOptions: {
        files: [
          {
            // 包含所有文件
            from: '.',
            to: '.',
          },
          {
            // 排除 .map 文件
            from: '.',
            to: '.',
            filter: ['**/*', '!**/*.map'],
          },
        ],
      },
    },
  },
})
