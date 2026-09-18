import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const POLL_INTERVAL_MS = 500;

const POWERSHELL_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
public struct MONITORINFO { public int cbSize; public RECT rcMonitor; public RECT rcWork; public int dwFlags; }

public static class FullscreenProbe {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern IntPtr GetShellWindow();
    [DllImport("user32.dll")] public static extern IntPtr GetDesktopWindow();
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr hWnd, uint flags);
    [DllImport("user32.dll")] public static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO info);
}
'@
$parentPid = ${process.pid}
while (Get-Process -Id $parentPid -ErrorAction SilentlyContinue) {
    $fullscreen = 0
    $mx = 0; $my = 0; $mw = 0; $mh = 0
    $hwnd = [FullscreenProbe]::GetForegroundWindow()
    if ($hwnd -ne [IntPtr]::Zero -and $hwnd -ne [FullscreenProbe]::GetShellWindow() -and $hwnd -ne [FullscreenProbe]::GetDesktopWindow() -and [FullscreenProbe]::IsWindowVisible($hwnd)) {
        $rect = New-Object RECT
        [void][FullscreenProbe]::GetWindowRect($hwnd, [ref]$rect)
        $monitor = [FullscreenProbe]::MonitorFromWindow($hwnd, 2)
        $info = New-Object MONITORINFO
        $info.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($info)
        if ([FullscreenProbe]::GetMonitorInfo($monitor, [ref]$info)) {
            $mx = $info.rcMonitor.Left
            $my = $info.rcMonitor.Top
            $mw = $info.rcMonitor.Right - $info.rcMonitor.Left
            $mh = $info.rcMonitor.Bottom - $info.rcMonitor.Top
            if ($rect.Left -le $mx -and $rect.Top -le $my -and $rect.Right -ge ($mx + $mw) -and $rect.Bottom -ge ($my + $mh)) {
                $fullscreen = 1
            }
        }
    }
    [Console]::Out.WriteLine(("{0},{1},{2},{3},{4}" -f $fullscreen, $mx, $my, $mw, $mh))
    [Console]::Out.Flush()
    Start-Sleep -Milliseconds ${POLL_INTERVAL_MS}
}
`.trim();

let probeProcess = null;
let restartTimer = null;
let stopped = false;
let outputBuffer = '';
let lastState = { fullscreen: false, monitor: null };
const listeners = new Set();

const notify = (state) => {
    lastState = state;
    for (const listener of listeners) {
        try {
            listener(state);
        } catch (error) {
            console.error('[FullscreenWatcher] listener error:', error);
        }
    }
};

const handleLine = (line) => {
    const parts = line.split(',');
    if (parts.length !== 5) return;
    const [fullscreen, x, y, width, height] = parts.map((value) => parseInt(value, 10));
    if ([fullscreen, x, y, width, height].some((value) => Number.isNaN(value))) return;
    if (width <= 0 || height <= 0) return; // 过渡帧（前台窗口为空）忽略，避免锚点抖动

    const next = fullscreen === 1
        ? { fullscreen: true, monitor: { x, y, width, height } }
        : { fullscreen: false, monitor: null };

    const changed = next.fullscreen !== lastState.fullscreen
        || JSON.stringify(next.monitor) !== JSON.stringify(lastState.monitor);
    if (changed) notify(next);
};

const getPowerShellPath = () => {
    const systemRoot = process.env.SystemRoot || 'C:\\Windows';
    const fullPath = path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    return fs.existsSync(fullPath) ? fullPath : 'powershell.exe';
};

const scheduleRestart = () => {
    if (stopped || listeners.size === 0) return;
    clearTimeout(restartTimer);
    restartTimer = setTimeout(startProbeProcess, 3000);
};

const startProbeProcess = () => {
    if (stopped || probeProcess || process.platform !== 'win32') return;

    try {
        probeProcess = spawn(getPowerShellPath(), [
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy', 'Bypass',
            '-Command', POWERSHELL_SCRIPT
        ], {
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'ignore']
        });
    } catch (error) {
        console.error('[FullscreenWatcher] 启动失败:', error);
        probeProcess = null;
        return;
    }

    outputBuffer = '';
    probeProcess.stdout.setEncoding('utf8');
    probeProcess.stdout.on('data', (chunk) => {
        outputBuffer += chunk;
        let index;
        while ((index = outputBuffer.indexOf('\n')) >= 0) {
            const line = outputBuffer.slice(0, index).trim();
            outputBuffer = outputBuffer.slice(index + 1);
            if (line) handleLine(line);
        }
    });

    probeProcess.on('error', (error) => {
        console.error('[FullscreenWatcher] 进程错误:', error);
        probeProcess = null;
        scheduleRestart();
    });

    probeProcess.on('exit', () => {
        probeProcess = null;
        scheduleRestart();
    });
};

export const watchForegroundFullscreen = (callback) => {
    listeners.add(callback);
    startProbeProcess();
    callback(lastState);
    return () => listeners.delete(callback);
};

export const stopForegroundFullscreenWatcher = () => {
    stopped = true;
    clearTimeout(restartTimer);
    listeners.clear();
    if (probeProcess) {
        try {
            probeProcess.kill();
        } catch (error) {
            console.error('[FullscreenWatcher] 结束进程失败:', error);
        }
        probeProcess = null;
    }
};
