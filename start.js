// Small startup shim to ensure crypto is available in globalThis
globalThis.crypto = require('crypto');
require('./dist/main');
