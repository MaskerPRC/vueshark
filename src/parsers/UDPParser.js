// src/parsers/UDPParser.js

function parseUDP(buffer, src, dst, udp, ethernet, captureCount) {
    // 构建UDP层
    const udpLayer = {
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
        ],
        layers: [] // 子层（如有需要可添加）
    };

    // 构建最终返回的结构，包括 layers 属性
    return {
        index: captureCount,
        time: Date.now(),
        source: `${src}:${udp.info.srcport}`,
        target: `${dst}:${udp.info.dstport}`,
        protocol: 'UDP',
        length: udp.info.length,
        info: `UDP Packet from ${src}:${udp.info.srcport} to ${dst}:${udp.info.dstport}`,
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
            udpLayer
        ]
    };
}

module.exports = parseUDP;
