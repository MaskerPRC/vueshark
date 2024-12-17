export const protocolDefs = {
  // 协议字段定义
  definitions: {
    ethernet: {
      fields: {
        destination: {
          name: '目标MAC地址',
          description: '数据包的目标设备的MAC地址'
        },
        source: {
          name: '源MAC地址',
          description: '发送数据包的设备的MAC地址'
        },
        type: {
          name: '类型',
          description: '上层协议类型',
          values: {
            '0x0800': 'IPv4',
            '0x0806': 'ARP',
            '0x86DD': 'IPv6'
          }
        }
      }
    },
    dns: {
      fields: {
        'Transaction ID': {
          name: '事务ID',
          description: '用于匹配DNS请求和响应的唯一标识符'
        },
        'Type': {
          name: '类型',
          description: 'DNS消息的类型',
          values: {
            'QUERY': 'DNS查询请求',
            'RESPONSE': 'DNS响应'
          }
        },
        'Question': {
          name: '查询',
          description: 'DNS查询的域名和类型'
        },
        'Answer': {
          name: '响应',
          description: 'DNS响应的具体内容，包含域名解析结果'
        }
      }
    },
    frame: {
      fields: {
        'Length': {
          name: '长度',
          description: '数据帧的总字节数'
        }
      }
    },
    ip: {
      fields: {
        'Source IP': {
          name: '源IP',
          description: '发送方的IP地址'
        },
        'Destination IP': {
          name: '目标IP',
          description: '接收方的IP地址'
        }
      }
    },
    udp: {
      fields: {
        'Source Port': {
          name: '源端口',
          description: '发送方使用的UDP端口'
        },
        'Destination Port': {
          name: '目标端口',
          description: '接收方的UDP端口'
        }
      }
    }
  },

  getFieldDescription(protocol, fieldName, value) {
    const protocolDef = this.definitions[protocol];
    if (!protocolDef) return '未知协议';

    const fieldDef = protocolDef.fields[fieldName];
    if (!fieldDef) return '未知字段';

    let description = fieldDef.description || '';
    
    if (fieldDef.values && fieldDef.values[value]) {
      description += `\n特殊值 ${value}: ${fieldDef.values[value]}`;
    }

    return description;
  }
}; 