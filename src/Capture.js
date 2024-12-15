const Cap = require('cap').Cap;
const decoders = require('cap').decoders;
const PROTOCOL = decoders.PROTOCOL;
const HTTPParser = require('http-parser-js').HTTPParser;
const dnsPacket = require('dns-packet');

const DHCP_SERVER_PORT = 67;
const DHCP_CLIENT_PORT = 68;
const DNS_PORT = 53;

const DHCP_MESSAGE_TYPES = {
    1: 'DISCOVER',
    2: 'OFFER',
    3: 'REQUEST',
    4: 'DECLINE',
    5: 'ACK',
    6: 'NAK',
    7: 'RELEASE',
    8: 'INFORM'
};

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
                /**
                 * {
                 *   "hdrlen": 5,
                 *   "dscp": 0,
                 *   "ecn": 0,
                 *   "totallen": 194,
                 *   "id": 50963,
                 *   "flags": 0,
                 *   "fragoffset": 0,
                 *   "ttl": 1,
                 *   "protocol": 17,
                 *   "hdrchecksum": 0,
                 *   "srcaddr": "172.27.128.1",
                 *   "dstaddr": "239.255.255.250"
                 * }
                 */
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
                } else if (ret.info.protocol === PROTOCOL.IP.UDP) {
                    const udp = decoders.UDP(this.buffer, ret.offset);
                    protocol = 'UDP';

                    const isDNS = udp.info.srcport === DNS_PORT || udp.info.dstport === DNS_PORT;

                    if (isDNS) {
                        try {
                            const payload = this.buffer.slice(udp.offset, nbytes);
                            /**
                             * {
                             *   "id": 11281,
                             *   "type": "RESPONSE",
                             *   "questions": [
                             *     {
                             *       "name": "s.f.360.cn",
                             *       "type": "A"
                             *     }
                             *   ],
                             *   "answers": [
                             *     {
                             *       "name": "s.f.360.cn",
                             *       "type": "A",
                             *       "ttl": 1,
                             *       "data": "198.18.52.93"
                             *     }
                             *   ]
                             * }
                             */
                            const dnsInfo = this._parseDNS(payload);
                            if (dnsInfo) {
                                const result = {
                                    index: this.captureCount,
                                    time: Date.now(),
                                    source: src + ':' + udp.info.srcport,
                                    target: dst + ':' + udp.info.dstport,
                                    protocol: 'DNS',
                                    dns: dnsInfo
                                };
                                callback(result);
                            }
                        } catch (err) {
                            console.error('DNS decode error:', err);
                        }
                    } else {
                        const isDHCP = (udp.info.srcport === DHCP_SERVER_PORT && udp.info.dstport === DHCP_CLIENT_PORT) ||
                                      (udp.info.srcport === DHCP_CLIENT_PORT && udp.info.dstport === DHCP_SERVER_PORT);

                        if (isDHCP) {
                            try {
                                const payload = this.buffer.slice(udp.offset, nbytes);
                                /**
                                 * {
                                 *   "operation": "REQUEST",
                                 *   "transactionId": "0x6889d9e2",
                                 *   "clientMac": "58:11:22:b9:09:b6",
                                 *   "assignedIp": "0.0.0.0",
                                 *   "messageType": "RELEASE"
                                 * }
                                 */
                                const dhcpInfo = this._parseDHCP(payload);
                                if (dhcpInfo) {
                                    const result = {
                                        index: this.captureCount,
                                        time: Date.now(),
                                        source: src + ':' + udp.info.srcport,
                                        target: dst + ':' + udp.info.dstport,
                                        protocol: 'DHCP',
                                        dhcp: dhcpInfo
                                    };
                                    callback(result);
                                }
                            } catch (err) {
                                console.error('DHCP decode error:', err);
                            }
                        } else {
                            const result = {
                                index: this.captureCount,
                                time: Date.now(),
                                source: src + ':' + udp.info.srcport,
                                target: dst + ':' + udp.info.dstport,
                                protocol
                            };
                        }
                    }
                } else {
                    // 不支持的协议可不返回
                }
            } else if (ret.info.type === PROTOCOL.ETHERNET.ARP) {
                try {
                    /**
                     * {
                     *   "hardwareaddr": 1,
                     *   "protocol": 2048,
                     *   "hdrlen": 6,
                     *   "protlen": 4,
                     *   "opcode": 1,
                     *   "sendermac": "24:31:54:0c:c5:4f",
                     *   "senderip": "192.168.3.1",
                     *   "targetmac": "00:00:00:00:00:00",
                     *   "targetip": "192.168.3.3"
                     * }
                     */
                    const arp = decoders.ARP(this.buffer, ret.offset);
                    const result = {
                        index: this.captureCount,
                        time: Date.now(),
                        protocol: 'ARP',
                        source: toIpAddr(arp.info.senderip),
                        target: toIpAddr(arp.info.targetip),
                        operation: arp.info.opcode === 1 ? 'REQUEST' : 'REPLY',
                        senderMac: arp.info.sendermac,
                        targetMac: arp.info.targetmac
                    };
                    callback(result);
                } catch (err) {
                    console.error('ARP decode error:', err);
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

    _parseDHCP(buffer) {
        if (buffer.length < 240) return null; // DHCP最小长度

        const op = buffer[0]; // 1: request, 2: reply
        const htype = buffer[1]; // 硬件类型
        const hlen = buffer[2]; // 硬件地址长度
        const xid = buffer.readUInt32BE(4); // 事务ID

        // 获取客户端MAC地址
        const chaddr = buffer.slice(28, 28 + hlen)
            .toString('hex')
            .match(/.{1,2}/g)
            .join(':');

        // 获取分配的IP地址
        const yiaddr = [
            buffer[16], buffer[17], buffer[18], buffer[19]
        ].join('.');

        // 解析DHCP选项
        let options = {};
        let pos = 240; // 跳过固定头部
        while (pos < buffer.length) {
            const optionType = buffer[pos];
            if (optionType === 255) break; // 结束标记
            if (optionType === 0) { // padding
                pos++;
                continue;
            }
            const optionLen = buffer[pos + 1];
            if (optionType === 53) { // Message Type
                options.messageType = DHCP_MESSAGE_TYPES[buffer[pos + 2]] || 'UNKNOWN';
            }
            pos += 2 + optionLen;
        }

        return {
            operation: op === 1 ? 'REQUEST' : 'REPLY',
            transactionId: '0x' + xid.toString(16),
            clientMac: chaddr,
            assignedIp: yiaddr,
            messageType: options.messageType
        };
    }

    _parseDNS(buffer) {
        try {
            const packet = dnsPacket.decode(buffer);
            return {
                id: packet.id,
                type: packet.type.toUpperCase(), // 'query' 或 'response'
                questions: packet.questions.map(q => ({
                    name: q.name,
                    type: q.type
                })),
                answers: packet.answers.map(a => ({
                    name: a.name,
                    type: a.type,
                    ttl: a.ttl,
                    data: a.data
                }))
            };
        } catch (err) {
            console.error('DNS packet decode error:', err);
            return null;
        }
    }
}

module.exports = Capture;
