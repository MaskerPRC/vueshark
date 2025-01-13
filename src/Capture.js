// src/Capture.js
const Cap = require('cap').Cap;
const decoders = require('cap').decoders;
const PROTOCOL = decoders.PROTOCOL;
const parseDNS = require('./parsers/DNSParser');
const parseDHCP = require('./parsers/DHCPParser');
const parseARP = require('./parsers/ARPParser');
const parseTCP = require('./parsers/TCPParser');
const parseUDP = require('./parsers/UDPParser');
const parseICMP = require('./parsers/ICMPParser');
const parseRIP = require('./parsers/RIPParser'); // 引入 RIP 解析器
const dnsPacket = require('dns-packet');

const DHCP_SERVER_PORT = 67;
const DHCP_CLIENT_PORT = 68;
const DNS_PORT = 53;
const RIP_PORT = 520; // RIP 使用 UDP 端口 520

function toIpAddr(addr) {
    if (!addr) return '';
    return addr; // cap 的 decoder 会直接给出字符串形式的 IP 地址
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

        // 这里需要根据你的系统和选择的网卡名称来适配 Cap.findDevice 逻辑
        // 简单起见，假设传入的 deviceName 已是可用的 IP 地址对应的 device。

        const bufSize = 10 * 1024 * 1024;
        const linkType = c.open(device, filter, bufSize, this.buffer);
        c.setMinBytes && c.setMinBytes(0);

        this.capInstance = c;
    }

    onPacket(callback) {
        if (!this.capInstance) return;

        this.capInstance.on('packet', (nbytes, trunc) => {
            this.captureCount++;
            let ethernet;
            try {
                ethernet = decoders.Ethernet(this.buffer);
            } catch (err) {
                console.error('Ethernet decode error:', err);
                return;
            }

            if (ethernet.info.type === PROTOCOL.ETHERNET.IPV4) {
                let ipv4;
                try {
                    ipv4 = decoders.IPV4(this.buffer, ethernet.offset);
                } catch (err) {
                    console.error('IPv4 decode error:', err);
                    return;
                }

                const src = ipv4.info.srcaddr;
                const dst = ipv4.info.dstaddr;
                let protocolHandled = false;

                if (ipv4.info.protocol === PROTOCOL.IP.TCP) {
                    let tcp;
                    try {
                        tcp = decoders.TCP(this.buffer, ipv4.offset);
                    } catch (err) {
                        console.error('TCP decode error:', err);
                        return;
                    }

                    const result = parseTCP(this.buffer, src, dst, tcp, ethernet, this.captureCount);
                    if (result) {
                        // callback(result);
                    }
                    protocolHandled = true;
                } else if (ipv4.info.protocol === PROTOCOL.IP.UDP) {
                    let udp;
                    try {
                        udp = decoders.UDP(this.buffer, ipv4.offset);
                    } catch (err) {
                        console.error('UDP decode error:', err);
                        return;
                    }

                    const isDNS = udp.info.srcport === DNS_PORT || udp.info.dstport === DNS_PORT;
                    const isDHCP = (udp.info.srcport === DHCP_SERVER_PORT && udp.info.dstport === DHCP_CLIENT_PORT) ||
                        (udp.info.srcport === DHCP_CLIENT_PORT && udp.info.dstport === DHCP_SERVER_PORT);
                    const isRIP = udp.info.srcport === RIP_PORT || udp.info.dstport === RIP_PORT;

                    if (isDNS) {
                        try {
                            const payload = this.buffer.slice(udp.offset, nbytes);
                            const dnsInfo = parseDNS(payload, src, dst, udp, ethernet, this.captureCount);
                            if (dnsInfo) {
                                callback(dnsInfo);
                            }
                        } catch (err) {
                            console.error('DNS decode error:', err);
                        }
                        protocolHandled = true;
                    } else if (isDHCP) {
                        try {
                            const payload = this.buffer.slice(udp.offset, nbytes);
                            const dhcpInfo = parseDHCP(payload, src, dst, udp, ethernet, this.captureCount);
                            if (dhcpInfo) {
                                callback(dhcpInfo);
                            }
                        } catch (err) {
                            console.error('DHCP decode error:', err);
                        }
                        protocolHandled = true;
                    } else if (isRIP) {
                        try {
                            const payload = this.buffer.slice(udp.offset, nbytes);
                            const ripInfo = parseRIP(payload, src, dst, udp, ethernet, this.captureCount);
                            if (ripInfo) {
                                callback(ripInfo);
                            }
                        } catch (err) {
                            console.error('RIP decode error:', err);
                        }
                        protocolHandled = true;
                    } else {
                        // 对于其他 UDP 流量，使用 UDP 解析器
                        try {
                            const udpInfo = parseUDP(this.buffer, src, dst, udp, ethernet, this.captureCount);
                            if (udpInfo) {
                                callback(udpInfo);
                            }
                        } catch (err) {
                            console.error('UDP decode error:', err);
                        }
                        protocolHandled = true;
                    }
                } else if (ipv4.info.protocol === PROTOCOL.IP.ICMP) { // 添加 ICMP 处理
                    try {
                        const icmpInfo = parseICMP(this.buffer, src, dst, ipv4, ethernet, this.captureCount);
                        if (icmpInfo) {
                            callback(icmpInfo);
                        }
                    } catch (err) {
                        console.error('ICMP parse error:', err);
                    }
                    protocolHandled = true;
                } else {
                    // 处理其他 IP 协议（如 IGMP 等），可在此扩展
                }

                if (!protocolHandled) {
                    // 处理未被识别的协议（可选）
                }
            } else if (ethernet.info.type === PROTOCOL.ETHERNET.ARP) {
                try {
                    const arp = decoders.ARP(this.buffer, ethernet.offset);
                    const arpInfo = parseARP(arp, ethernet, this.captureCount);
                    if (arpInfo) {
                        callback(arpInfo);
                    }
                } catch (err) {
                    console.error('ARP decode error:', err);
                }
            }
        });
    }

    _findAnIPv4(deviceName) {
        // deviceName 是网卡名，使用 os.networkInterfaces() 来找到对应的 IPv4
        const networkInterfaces = require('os').networkInterfaces();
        const ifaceList = networkInterfaces[deviceName] || [];
        const ipv4 = ifaceList.find(i => i.family === 'IPv4');
        return ipv4 ? ipv4.address : deviceName;
    }
}

module.exports = Capture;
