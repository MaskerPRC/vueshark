const path = require('path');
const {BrowserWindow, app, ipcMain, protocol} = require('electron');
const {getValidNetworkInterfaces} = require('./NetworkInterface');
const Capture = require('./Capture');
const {createProtocol} = require("vue-cli-plugin-electron-builder/lib");

const isDevelopment = process.env.NODE_ENV !== 'production'

protocol.registerSchemesAsPrivileged([
    { scheme: "app", privileges: { secure: true, standard: true } }
])

class MainWindow {
    constructor() {
        this.window = null;
        this.capture = null;

        // 注册IPC事件
        ipcMain.handle("get.network.interfaces", async () => {
            return getValidNetworkInterfaces();
        });

        ipcMain.handle("set.device.name", async (_, {deviceName}) => {
            this.capture = new Capture(deviceName);
        });

        ipcMain.handle("start.capture", async (_, {filter}) => {
            if (this.capture) {
                this.capture.start(filter);
                this.capture.onPacket((result) => {
                    this.window && this.window.webContents.send("capture.on.packet", result);
                });
            }
        });

        // 窗口控制事件
        ipcMain.on('window-control', (_, command) => {
            if (!this.window) return;

            switch (command) {
                case 'minimize':
                    this.window.minimize();
                    break;
                case 'maximize':
                    if (this.window.isMaximized()) {
                        this.window.unmaximize();
                    } else {
                        this.window.maximize();
                    }
                    break;
                case 'close':
                    this.window.close();
                    break;
            }
        });
    }

    async create() {
        if (this.window) return;

        await app.whenReady();

        this.window = new BrowserWindow({
            frame: false,
            width: 1400,
            height: 1000,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                nodeIntegrationInWorker: true,
                webSecurity: false
            }
        });

        if (process.env.WEBPACK_DEV_SERVER_URL) {
            await this.window.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
            if (!process.env.IS_TEST) this.window.webContents.openDevTools()
        } else {
            createProtocol('app')
            await this.window.loadURL('app://./index.html')
        }
        this.window.webContents.openDevTools({mode: "detach"});

        this.window.on("closed", () => {
            this.window = null;
        });
    }

    async open() {
        if (this.window) {
            this.window.restore();
            this.window.show();
            this.window.focus();
        } else {
            await this.create();
        }
    }

    close() {
        if (this.window) {
            this.window.close();
        }
    }
}

module.exports = MainWindow;
