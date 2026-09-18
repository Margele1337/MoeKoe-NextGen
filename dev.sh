#!/bin/bash
# MoeKoe Music - 开发模式一键启动
# 用法: bash dev.sh  或  ./dev.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 清除导致 Electron 异常的变量
unset ELECTRON_RUN_AS_NODE

echo "============================================"
echo "  MoeKoe Music - 开发模式"
echo "============================================"
echo ""
echo "  API 服务器 : http://localhost:6521"
echo "  Vite 前端  : http://localhost:8080"
echo "  Electron   : 独立窗口启动"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "============================================"
echo ""

# 终止所有子进程
cleanup() {
    echo ""
    echo "正在停止所有服务..."
    # 杀掉端口上的进程
    for pid in $(netstat -ano 2>/dev/null | grep -E ":6521|:8080" | awk '{print $NF}' | sort -u); do
        taskkill //F //PID $pid 2>/dev/null
    done
    echo "已停止。"
    exit 0
}
trap cleanup SIGINT SIGTERM

# 启动 API
npm run api &
PID_API=$!
sleep 1

# 启动 Vite
npm run serve &
PID_VITE=$!
sleep 2

# 启动 Electron (electron:serve 已内置 ELECTRON_RUN_AS_NODE=)
npm run electron:serve &
PID_ELECTRON=$!

echo ""
echo "所有服务已启动，开发中..."

# 等待子进程
wait $PID_API $PID_VITE $PID_ELECTRON 2>/dev/null
