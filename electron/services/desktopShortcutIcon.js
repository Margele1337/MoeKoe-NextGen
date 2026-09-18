import fs from 'fs';
import { app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import isDev from 'electron-is-dev';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FESTIVAL_ICON_WINDOW_DAYS = 7;
const DESKTOP_SHORTCUT_NAME = 'MoeKoe Music.lnk';
const DEFAULT_ICON_NAME = 'icon.ico';
const FESTIVAL_ICONS = [
    { month: 1, day: 1, icon: 'newyear.ico' },
    { month: 2, day: 6, icon: 'springfest.ico' },
    { month: 6, day: 18, icon: 'shopping.ico' },
    { month: 8, day: 25, icon: 'ghost.ico' },
    { month: 9, day: 25, icon: 'autumn.ico' },
    { month: 10, day: 31, icon: 'halloween.ico' },
    { month: 12, day: 25, icon: 'christmas.ico' }
];

function createDateAtMidnight(year, month, day) {
    return new Date(year, month - 1, day);
}

function getFestivalMatch(today = new Date()) {
    const currentDate = createDateAtMidnight(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
    );
    let matchedFestival = null;

    for (const festival of FESTIVAL_ICONS) {
        const candidateDates = [
            createDateAtMidnight(currentDate.getFullYear() - 1, festival.month, festival.day),
            createDateAtMidnight(currentDate.getFullYear(), festival.month, festival.day),
            createDateAtMidnight(currentDate.getFullYear() + 1, festival.month, festival.day)
        ];

        const nearestDate = candidateDates.reduce((closestDate, candidateDate) => {
            if (!closestDate) return candidateDate;

            const closestDiff = Math.abs(currentDate - closestDate);
            const candidateDiff = Math.abs(currentDate - candidateDate);
            return candidateDiff < closestDiff ? candidateDate : closestDate;
        }, null);
        const diffDays = Math.round(Math.abs(currentDate - nearestDate) / 86400000);

        if (diffDays > FESTIVAL_ICON_WINDOW_DAYS) {
            continue;
        }

        if (!matchedFestival || diffDays < matchedFestival.diffDays) {
            matchedFestival = { ...festival, diffDays };
        }
    }

    return matchedFestival;
}

function getDesktopShortcutIconPath() {
    const festival = getFestivalMatch();
    const iconsBasePath = path.join(process.resourcesPath, 'icons');

    if (festival) {
        return path.join(iconsBasePath, 'festival', festival.icon);
    }

    return path.join(iconsBasePath, DEFAULT_ICON_NAME);
}

function refreshIconCache() {
    exec('ie4uinit.exe -show', (err) => {
        if (!err) console.log('系统图标缓存已刷新');
    });
}

function escapePowerShellString(value) {
    return String(value).replace(/'/g, "''");
}

function createShortcut(targetPath, shortcutPath, description = '', iconPath = '') {
    const psScript = `
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('${escapePowerShellString(shortcutPath)}')
$Shortcut.TargetPath = '${escapePowerShellString(targetPath)}'
$Shortcut.WorkingDirectory = '${escapePowerShellString(path.dirname(targetPath))}'
$Shortcut.Description = '${escapePowerShellString(description)}'
${iconPath ? `$Shortcut.IconLocation = '${escapePowerShellString(iconPath)}'` : ''}
$Shortcut.Save()
`;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    exec(`powershell -NoProfile -EncodedCommand ${encoded}`, (err, stdout, stderr) => {
        if (err) {
            console.error('桌面快捷方式重建失败:', err);
            if (stderr) {
                console.error(stderr);
            }
            return;
        }

        console.log('桌面快捷方式图标已更新');
    });
}

function syncDesktopShortcutIcon() {
    const exePath = path.dirname(app.getPath('exe'));
    const desktopPath = app.getPath('desktop');
    const shortcutPath = path.join(desktopPath, DESKTOP_SHORTCUT_NAME);
    if (!fs.existsSync(shortcutPath)) {
        return;
    }

    const iconPath = getDesktopShortcutIconPath();
    createShortcut(app.getPath('exe'), shortcutPath, path.basename(exePath), iconPath);
    // refreshIconCache();
}

function getNextMidnightDelay() {
    const now = new Date();
    const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
    );

    return nextMidnight.getTime() - now.getTime();
}

function scheduleNextDesktopShortcutIconSync() {
    setTimeout(() => {
        syncDesktopShortcutIcon();
        scheduleNextDesktopShortcutIconSync();
    }, getNextMidnightDelay());
}

export function setupDesktopShortcutIcon() {
    if (process.platform !== 'win32' || isDev) return;
    syncDesktopShortcutIcon();
    scheduleNextDesktopShortcutIconSync();
}
