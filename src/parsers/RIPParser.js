// src/parsers/RIPParser.js
function parseRIP(buffer, src, dst, udp, ethernet, captureCount) {
    try {
        if (buffer.length < 4) {
            throw new Error('Buffer too short for RIP header');
        }

        const command = buffer.readUInt8(0);
        const version = buffer.readUInt8(1);
        const zero = buffer.readUInt16BE(2);

        // 验证版本是否为 RIP v2
        if (version !== 2) {
            throw new Error(`Unsupported RIP version: ${version}`);
        }

        // 解析 RIP 条目
        const entries = [];
        const entrySize = 20;
        for (let i = 4; i + entrySize <= buffer.length; i += entrySize) {
            const afi = buffer.readUInt16BE(i);
            const routeTag = buffer.readUInt16BE(i + 2);
            const ipAddress = `${buffer.readUInt8(i + 4)}.${buffer.readUInt8(i + 5)}.${buffer.readUInt8(i + 6)}.${buffer.readUInt8(i + 7)}`;
            const subnetMask = `${buffer.readUInt8(i + 8)}.${buffer.readUInt8(i + 9)}.${buffer.readUInt8(i + 10)}.${buffer.readUInt8(i + 11)}`;
            const nextHop = `${buffer.readUInt8(i + 12)}.${buffer.readUInt8(i + 13)}.${buffer.readUInt8(i + 14)}.${buffer.readUInt8(i + 15)}`;
            const metric = buffer.readUInt32BE(i + 16);

            entries.push({
                afi,
                routeTag,
                ipAddress,
                subnetMask,
                nextHop,
                metric
            });
        }

        // 构建 RIP 层
        const ripLayer = {
            name: 'Routing Information Protocol',
            fields: [
                {
                    name: 'Command',
                    value: command === 1 ? 'Request' : (command === 2 ? 'Response' : `Unknown (${command})`),
                    protocol: 'rip',
                    description: 'RIP 命令类型'
                },
                {
                    name: 'Version',
                    value: version,
                    protocol: 'rip',
                    description: 'RIP 版本'
                },
                {
                    name: 'Zero',
                    value: zero,
                    protocol: 'rip',
                    description: '填充字段'
                }
            ],
            layers: [] // 子层（如有需要可添加）
        };

        // 添加 RIP 条目层
        if (entries.length > 0) {
            const entriesLayer = {
                name: 'RIP Entries',
                fields: entries.map((entry, index) => ({
                    name: `Entry ${index + 1}`,
                    value: `AFI: ${entry.afi}, Route Tag: ${entry.routeTag}, IP: ${entry.ipAddress}, Subnet Mask: ${entry.subnetMask}, Next Hop: ${entry.nextHop}, Metric: ${entry.metric}`,
                    protocol: 'rip',
                    description: 'RIP 路由条目'
                }))
            };
            ripLayer.layers.push(entriesLayer);
        }

        // 构建最终返回的结构，包括 layers 属性
        return {
            index: captureCount,
            time: Date.now(),
            source: `${src}:${udp.info.srcport}`,
            target: `${dst}:${udp.info.dstport}`,
            protocol: 'RIP',
            length: buffer.length,
            info: `${ripLayer.fields[0].value} (Version ${ripLayer.fields[1].value}) with ${entries.length} entries`,
            layers: [
                {
                    name: 'Frame',
                    fields: [
                        {
                            name: 'Length',
                            value: `${buffer.length} bytes`,
                            protocol: 'frame',
                            description: '帧的总长度'
                        }
                    ]
                },
                {
                    name: 'Ethernet',
                    fields: [
                        {
                            name: 'Source MAC',
                            value: ethernet.info.srcmac,
                            protocol: 'ethernet',
                            description: '源 MAC 地址'
                        },
                        {
                            name: 'Destination MAC',
                            value: ethernet.info.dstmac,
                            protocol: 'ethernet',
                            description: '目标 MAC 地址'
                        }
                    ]
                },
                {
                    name: 'Internet Protocol',
                    fields: [
                        {
                            name: 'Source IP',
                            value: src,
                            protocol: 'ip',
                            description: '源 IP 地址'
                        },
                        {
                            name: 'Destination IP',
                            value: dst,
                            protocol: 'ip',
                            description: '目标 IP 地址'
                        }
                    ]
                },
                {
                    name: 'User Datagram Protocol',
                    fields: [
                        {
                            name: 'Source Port',
                            value: udp.info.srcport,
                            protocol: 'udp',
                            description: '源端口'
                        },
                        {
                            name: 'Destination Port',
                            value: udp.info.dstport,
                            protocol: 'udp',
                            description: '目标端口'
                        },
                        {
                            name: 'Length',
                            value: udp.info.length + ' bytes',
                            protocol: 'udp',
                            description: 'UDP 数据包长度'
                        },
                        {
                            name: 'Checksum',
                            value: '0x' + udp.info.checksum.toString(16),
                            protocol: 'udp',
                            description: '校验和'
                        }
                    ]
                },
                ripLayer
            ]
        };
    } catch (error) {
        console.error('RIP decode error:', error);
        return null;
    }
}

module.exports = parseRIP;
