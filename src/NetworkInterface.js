const os = require('os');

function getValidNetworkInterfaces() {
    const networkInterfaces = os.networkInterfaces();
    const validInterfaces = {};

    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName] || [];
        const valid = interfaces.filter(isValidInterface);
        if (valid.length > 0) {
            validInterfaces[interfaceName] = valid;
        }
    }

    return validInterfaces;
}

function isValidInterface(iface) {
    return iface.family === 'IPv4' && !iface.internal;
}

module.exports = {
    getValidNetworkInterfaces
};
