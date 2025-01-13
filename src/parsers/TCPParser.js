// src/parsers/TCPParser.js
const HTTPParser = require('http-parser-js').HTTPParser;

function parseHTTP(buffer, captureCount) {
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
                type: 'Response',
                statusCode: parser.info.statusCode,
                headers: headers,
                layers: [] // 可扩展
            };
        } else {
            return {
                type: 'Request',
                method: HTTPParser.methods[method],
                url: url,
                headers: headers,
                layers: [] // 可扩展
            };
        }
    } catch (e) {
        return null;
    }
}

function parseTCP(buffer, src, dst, tcp, ethernet, captureCount) {
    const payload = buffer.slice(tcp.offset);
    const httpInfo = parseHTTP(payload, captureCount);

    let protocol = 'TCP';
    let protocolInfo = null;

    if (httpInfo) {
        protocol = 'HTTP';
        protocolInfo = httpInfo;
    }

    // 构建TCP层
    const tcpLayer = {
        name: protocol,
        fields: [
            {
                name: 'Source Port',
                value: tcp.info.srcport,
                protocol: 'tcp',
                description: '源端口'
            },
            {
                name: 'Destination Port',
                value: tcp.info.dstport,
                protocol: 'tcp',
                description: '目标端口'
            }
        ],
        layers: []
    };

    if (protocolInfo) {
        tcpLayer.layers.push({
            name: protocol,
            fields: Object.keys(protocolInfo).map(key => ({
                name: key,
                value: protocolInfo[key],
                protocol: protocol.toLowerCase(),
                description: `${protocol} ${key}`
            }))
        });
    }

    // 构建最终返回的结构，包括layers属性
    return {
        index: captureCount,
        time: Date.now(),
        source: src + ':' + tcp.info.srcport,
        target: dst + ':' + tcp.info.dstport,
        protocol: protocol,
        length: buffer.length,
        info: protocolInfo ? `${protocolInfo.type} ${protocolInfo.method || ''} ${protocolInfo.url || ''}` : 'TCP Packet',
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
                name: 'Transmission Control Protocol',
                fields: [
                    {
                        name: 'Source Port',
                        value: tcp.info.srcport,
                        protocol: 'tcp',
                        description: '源端口'
                    },
                    {
                        name: 'Destination Port',
                        value: tcp.info.dstport,
                        protocol: 'tcp',
                        description: '目标端口'
                    }
                ]
            },
            tcpLayer
        ]
    };
}

module.exports = parseTCP;
