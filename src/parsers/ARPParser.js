// src/parsers/ARPParser.js
function parseARP(arp, ethernet, captureCount) {
    // 构建ARP层
    const arpLayer = {
        name: 'ARP Protocol',
        fields: [
            {
                name: 'Hardware Type',
                value: arp.info.hardwareaddr,
                protocol: 'arp',
                description: '硬件类型'
            },
            {
                name: 'Protocol',
                value: arp.info.protocol,
                protocol: 'arp',
                description: '协议类型'
            },
            {
                name: 'Operation',
                value: arp.info.opcode === 1 ? 'REQUEST' : 'REPLY',
                protocol: 'arp',
                description: '操作类型'
            },
            {
                name: 'Sender MAC',
                value: arp.info.sendermac,
                protocol: 'arp',
                description: '发送方MAC地址'
            },
            {
                name: 'Sender IP',
                value: arp.info.senderip,
                protocol: 'arp',
                description: '发送方IP地址'
            },
            {
                name: 'Target MAC',
                value: arp.info.targetmac,
                protocol: 'arp',
                description: '目标MAC地址'
            },
            {
                name: 'Target IP',
                value: arp.info.targetip,
                protocol: 'arp',
                description: '目标IP地址'
            }
        ],
        layers: [] // 子层（如有需要可添加）
    };

    // 构建最终返回的结构，包括layers属性
    return {
        index: captureCount,
        time: Date.now(),
        source: arp.info.senderip,
        target: arp.info.targetip,
        protocol: 'ARP',
        length: null, // ARP没有端口
        info: `${arpLayer.fields.find(f => f.name === 'Operation').value} from ${arp.info.senderip}`,
        layers: [
            {
                name: 'Frame',
                fields: [
                    {
                        name: 'Length',
                        value: 'N/A',
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
            arpLayer
        ]
    };
}

module.exports = parseARP;
