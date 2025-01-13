// src/parsers/DHCPParser.js
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

function parseDHCP(buffer, src, dst, udp, ethernet, captureCount) {
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

    // 构建DHCP层
    const dhcpLayer = {
        name: 'DHCP Protocol',
        fields: [
            {
                name: 'Operation',
                value: op === 1 ? 'REQUEST' : 'REPLY',
                protocol: 'dhcp',
                description: '操作类型'
            },
            {
                name: 'Transaction ID',
                value: '0x' + xid.toString(16),
                protocol: 'dhcp',
                description: '事务ID'
            },
            {
                name: 'Client MAC',
                value: chaddr,
                protocol: 'dhcp',
                description: '客户端MAC地址'
            },
            {
                name: 'Assigned IP',
                value: yiaddr,
                protocol: 'dhcp',
                description: '分配的IP地址'
            },
            {
                name: 'Message Type',
                value: options.messageType,
                protocol: 'dhcp',
                description: '消息类型'
            }
        ],
        layers: [] // 子层（如有需要可添加）
    };

    // 构建最终返回的结构，包括layers属性
    return {
        index: captureCount,
        time: Date.now(),
        source: src + ':' + udp.info.srcport,
        target: dst + ':' + udp.info.dstport,
        protocol: 'DHCP',
        length: buffer.length,
        info: `${dhcpLayer.fields.find(f => f.name === 'Message Type').value} from ${chaddr}`,
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
            dhcpLayer
        ]
    };
}

module.exports = parseDHCP;
