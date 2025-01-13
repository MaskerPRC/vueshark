// src/parsers/ICMPDecoder.js

function parseICMPHeader(buffer, offset) {
    if (buffer.length < offset + 8) {
        throw new Error('Buffer too short for ICMP header');
    }

    const type = buffer.readUInt8(offset);
    const code = buffer.readUInt8(offset + 1);
    const checksum = buffer.readUInt16BE(offset + 2);
    let identifier = null;
    let sequence = null;
    let gateway = null;

    // 根据 ICMP 类型解析不同字段
    switch (type) {
        case 0: // Echo Reply
        case 8: // Echo Request
            identifier = buffer.readUInt16BE(offset + 4);
            sequence = buffer.readUInt16BE(offset + 6);
            break;
        case 3: // Destination Unreachable
            gateway = `${buffer[offset + 4]}.${buffer[offset + 5]}.${buffer[offset + 6]}.${buffer[offset + 7]}`;
            break;
        // 可以根据需要添加更多 ICMP 类型的解析
        default:
            // 其他类型不解析额外字段
            break;
    }

    return {
        type,
        code,
        checksum,
        identifier,
        sequence,
        gateway
    };
}

module.exports = parseICMPHeader;
