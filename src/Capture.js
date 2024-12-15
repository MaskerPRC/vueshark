const Cap = require('cap').Cap;
const decoders = require('cap').decoders;
const PROTOCOL = decoders.PROTOCOL;
const HTTPParser = require('http-parser-js').HTTPParser;

function toIpAddr(addr) {
    if (!addr) return '';
    return addr; // cap的decoder会直接给出字符串形式的IP地址
}

class Capture {
    constructor(deviceName) {
        this.deviceName = deviceName;
        this.filter = '';
        this.capInstance = null;
        this.buffer = Buffer.alloc(65535);
        this.captureCount = 0;
    }

    start(filter = '') {
        if (this.capInstance) {
            this.capInstance.close();
            this.capInstance = null;
        }

        this.filter = filter;
        const c = new Cap();
        const device = Cap.findDevice(this._findAnIPv4(this.deviceName));

        // 这里需要根据你的系统和选择的网卡名称来适配Cap.findDevice逻辑
        // 简单起见，假设传入的deviceName已是可用的IP地址对应的device。

        const bufSize = 10 * 1024 * 1024;
        const linkType = c.open(device, filter, bufSize, this.buffer);
        c.setMinBytes && c.setMinBytes(0);

        this.capInstance = c;
    }
    _parseHTTP(buffer) {
        try {
            const data = buffer.toString('utf8');
            if (!data.match(/^(GET|POST|PUT|DELETE|HEAD|OPTIONS|CONNECT|TRACE|PATCH)/i) &&
                !data.match(/^HTTP\/\d\.\d/i)) {
                return null;
            }

            const parser = new HTTPParser(HTTPParser.REQUEST);
            let method, url, headers = {};
            let isResponse = false;

            parser.onHeadersComplete = function(info) {
                method = info.method;
                url = info.url;
                headers = info.headers;
                isResponse = info.statusCode != null;
            };

            parser.execute(buffer);

            if (isResponse) {
                return {
                    type: 'response',
                    statusCode: parser.info.statusCode,
                    headers: headers
                };
            } else {
                return {
                    type: 'request',
                    method: HTTPParser.methods[method],
                    url: url,
                    headers: headers
                };
            }
        } catch (e) {
            return null;
        }
    }
    onPacket(callback) {
        if (!this.capInstance) return;

        this.capInstance.on('packet', (nbytes, trunc) => {
            this.captureCount++;
            let ret;
            try {
                ret = decoders.Ethernet(this.buffer);
            } catch (err) {
                return; // 无法decode则跳过
            }

            if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {
                ret = decoders.IPV4(this.buffer, ret.offset);
                const src = ret.info.srcaddr;
                const dst = ret.info.dstaddr;
                let protocol = 'Unknown';

                if (ret.info.protocol === PROTOCOL.IP.TCP) {
                    const tcp = decoders.TCP(this.buffer, ret.offset);
                    protocol = 'TCP';

                    const payload = this.buffer.slice(tcp.offset, nbytes);
                    const httpInfo = this._parseHTTP(payload);
                    const result = {
                        index: this.captureCount,
                        time: Date.now(),
                        source: src + ':' + tcp.info.srcport,
                        target: dst + ':' + tcp.info.dstport,
                        protocol: httpInfo ? 'HTTP' : 'TCP',
                        http: httpInfo
                    };
                    if (result.protocol === "HTTP") {
                        callback(result);
                    }
                } else if (ret.info.protocol === PROTOCOL.IP.UDP) {
                    const udp = decoders.UDP(this.buffer, ret.offset);
                    protocol = 'UDP';
                    const result = {
                        index: this.captureCount,
                        time: Date.now(),
                        source: src + ':' + udp.info.srcport,
                        target: dst + ':' + udp.info.dstport,
                        protocol
                    };
                } else {
                    // 不支持的协议可不返回
                }
            }
        });
    }

    _findAnIPv4(deviceName) {
        // deviceName是网卡名，使用os.networkInterfaces()来找到对应的IPv4
        const networkInterfaces = require('os').networkInterfaces();
        const ifaceList = networkInterfaces[deviceName] || [];
        const ipv4 = ifaceList.find(i => i.family === 'IPv4');
        return ipv4 ? ipv4.address : deviceName;
    }
}

module.exports = Capture;
