const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, '..', 'client');
const target = path.join(__dirname, '..', 'public');
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log('Built dependency-free browser client in public/');
