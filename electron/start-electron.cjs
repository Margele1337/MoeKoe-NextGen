// Wrapper: 在启动 Electron 前从 OS 环境中删除 ELECTRON_RUN_AS_NODE
// cross-env 只能设为空字符串，无法真正删除变量，导致 Electron C++ 层误判

const { spawn } = require('child_process');
const path = require('path');

// 从 process.env 中删除该变量
delete process.env.ELECTRON_RUN_AS_NODE;

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe');
const args = ['.'];

const child = spawn(electronPath, args, {
    stdio: 'inherit',
    env: process.env, // 继承清理后的环境
    shell: false,
});

child.on('exit', (code) => {
    process.exit(code || 0);
});
