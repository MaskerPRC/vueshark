// src/parsers/DNSParser.js
const dnsPacket = require('dns-packet');

function parseDNS(buffer, src, dst, udp, ethernet, captureCount) {
    try {
        const packet = dnsPacket.decode(buffer);

        // 构建DNS层
        const dnsLayer = {
            name: 'DNS Protocol',
            fields: [
                {
                    name: 'Transaction ID',
                    value: '0x' + packet.id.toString(16),
                    protocol: 'dns',
                    description: 'DNS查询标识符'
                },
                {
                    name: 'Type',
                    value: packet.type.toUpperCase(),
                    protocol: 'dns',
                    description: 'DNS消息类型'
                }
            ],
            layers: [] // 子层
        };

        // 添加Questions层
        if (packet.questions && packet.questions.length > 0) {
            const questionsLayer = {
                name: 'Questions',
                fields: packet.questions.map((q, index) => ({
                    name: `Question ${index + 1}`,
                    value: `${q.name} (${q.type})`,
                    protocol: 'dns',
                    description: 'DNS查询内容'
                }))
            };
            dnsLayer.layers.push(questionsLayer);
        }

        // 添加Answers层
        if (packet.answers && packet.answers.length > 0) {
            const answersLayer = {
                name: 'Answers',
                fields: packet.answers.map((a, index) => ({
                    name: `Answer ${index + 1}`,
                    value: `${a.name} (${a.type}): ${a.data}`,
                    protocol: 'dns',
                    description: `TTL: ${a.ttl}秒`
                }))
            };
            dnsLayer.layers.push(answersLayer);
        }

        // 构建最终返回的结构，包括layers属性
        return {
            index: captureCount,
            time: Date.now(),
            source: src + ':' + udp.info.srcport,
            target: dst + ':' + udp.info.dstport,
            protocol: 'DNS',
            length: buffer.length,
            info: `${packet.type.toUpperCase()} ${packet.questions.map(q => q.name).join(', ')}`,
            layers: [
                {
                    name: 'Frame',
                    fields: [
                        {
                            name: 'Length',
                            value: buffer.length + ' bytes',
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
                            description: '源MAC地址'
                        },
                        {
                            name: 'Destination MAC',
                            value: ethernet.info.dstmac,
                            protocol: 'ethernet',
                            description: '目标MAC地址'
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
                            description: '源IP地址'
                        },
                        {
                            name: 'Destination IP',
                            value: dst,
                            protocol: 'ip',
                            description: '目标IP地址'
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
                        }
                    ]
                },
                dnsLayer
            ]
        };
    } catch (err) {
        console.error('DNS decode error:', err);
        return null;
    }
}

module.exports = parseDNS;
