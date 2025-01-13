// src/parsers/ICMPParser.js
const parseICMPHeader = require('./ICMPDecoder');

function parseICMP(buffer, src, dst, ipv4, ethernet, captureCount) {
    try {
        const icmpInfo = parseICMPHeader(buffer, ipv4.offset + 20); // IPv4 头部长度通常为 20 字节

        // 构建 ICMP 层
        const icmpLayer = {
            name: 'Internet Control Message Protocol',
            fields: [
                {
                    name: 'Type',
                    value: icmpInfo.type,
                    protocol: 'icmp',
                    description: '消息类型'
                },
                {
                    name: 'Code',
                    value: icmpInfo.code,
                    protocol: 'icmp',
                    description: '代码'
                },
                {
                    name: 'Checksum',
                    value: '0x' + icmpInfo.checksum.toString(16),
                    protocol: 'icmp',
                    description: '校验和'
                }
            ],
            layers: [] // 子层（如有需要可添加）
        };

        // 根据 ICMP 类型添加详细信息
        switch (icmpInfo.type) {
            case 0: // Echo Reply
            case 8: // Echo Request
                icmpLayer.fields.push(
                    {
                        name: 'Identifier',
                        value: icmpInfo.identifier,
                        protocol: 'icmp',
                        description: '标识符'
                    },
                    {
                        name: 'Sequence Number',
                        value: icmpInfo.sequence,
                        protocol: 'icmp',
                        description: '序列号'
                    }
                );
                break;
            case 3: // Destination Unreachable
                icmpLayer.fields.push(
                    {
                        name: 'Gateway Address',
                        value: icmpInfo.gateway,
                        protocol: 'icmp',
                        description: '网关地址'
                    }
                );
                break;
            // 可以根据需要添加更多 ICMP 类型的解析
            default:
                // 对于其他类型，可以添加更多字段或保持现状
                break;
        }

        // 构建最终返回的结构，包括 layers 属性
        return {
            index: captureCount,
            time: Date.now(),
            source: src,
            target: dst,
            protocol: 'ICMP',
            length: buffer.length,
            info: `ICMP Type ${icmpInfo.type} Code ${icmpInfo.code}`,
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
                    name: 'Internet Control Message Protocol',
                    fields: icmpLayer.fields
                }
            ]
        };
    } catch (error) {
        console.error('ICMP decode error:', error);
        return null;
    }
}

module.exports = parseICMP;
