// Try requiring electron built-ins
try {
  const browser = require('electron/js2c/browser_init');
  console.log('browser_init:', typeof browser, Object.keys(browser || {}).slice(0,10));
} catch(e) {
  console.log('browser_init error:', e.message);
}

// Try the internal electron module path
try {
  const e = require('electron/common');
  console.log('electron/common:', typeof e);
} catch(e) {
  console.log('electron/common error:', e.message);
}

// Check Module._load
const Module = require('module');
const orig_load = Module._load.toString().substring(0, 200);
console.log('Module._load (first 200 chars):', orig_load);

// Try accessing electron through global
console.log('global.electron:', typeof global.electron);
console.log('globalThis.electron:', typeof globalThis.electron);
