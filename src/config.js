const pkg = require('../package.json');

module.exports = {
  version: `v${pkg.version}`,
  name: pkg.productName || pkg.name,
  description: pkg.description,
  copyright: pkg.copyright
}; 