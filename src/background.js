const { app, BrowserWindow, ipcMain } = require('electron');
const MainWindow = require('./MainWindow');

let singleLock = app.requestSingleInstanceLock();
if (!singleLock) {
  app.quit();
}

let mainWindow = new MainWindow();

app.whenReady().then(() => {
  mainWindow.open();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow.open();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', () => {
  mainWindow.open();
});
