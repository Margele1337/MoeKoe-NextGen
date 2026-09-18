<br />
<p align="center">
  <h2 align="center">MoeKoe-NextGen</h2>
  <p align="center">基于 MoeKoeMusic 的第三方魔改版 · 酷狗音乐客户端</p>
</p>

> [!IMPORTANT]
> 本仓库是第三方魔改版（Fork），并非官方版本，与原作者及酷狗音乐官方均无任何关联。
> 上游项目：[iAJue/MoeKoeMusic](https://github.com/iAJue/MoeKoeMusic)（GPL-2.0-only，作者 MoeJue）。

## 相比上游的主要改动

- 按 sigmarebase 方案重写桌面频谱：原生 FFT 采集、帧率补偿平滑，修复幅度偏小与卡顿
- 新增「频谱幅度」设置（0.2x–3.0x 实时调节）
- 移除桌面歌词 HUD / HUD 行数 / HUD 锁定
- 频谱窗口自动贴底：无全屏时贴任务栏上沿，其它应用全屏时贴屏幕最下方
- 应用更名、独立包名与深链协议（`moekoe-nextgen://`），自动更新指向本仓库

## 功能

- 酷狗账号登录（扫码 / 手机 / 账号）
- 每日推荐、歌单收藏、排行榜、搜索、云盘、本地音乐、MV 播放
- 歌词与桌面歌词、主题与布局个性化、插件系统、多语言
- Windows / macOS / Linux 桌面端，同时支持 Web（PWA）

## 安装

安装包见 [Releases](https://github.com/Margele1337/MoeKoe-NextGen/releases)。

## 开发

```sh
git clone --recurse-submodules https://github.com/Margele1337/MoeKoe-NextGen.git
cd MoeKoe-NextGen
npm run install-all
npm run dev                    # 开发模式
npm run build                  # 构建前端
npm run electron:build:win     # 打包 Windows（macos / linux 同理）
```

## 免责声明

- 本项目为第三方客户端，仅供学习研究，禁止商业及非法用途。
- 使用过程中可能产生版权数据，版权归原权利人所有，请在 24 小时内清除。
- 音乐平台不易，请尊重版权，支持正版。
- 如官方认为本项目不妥，可联系更改或移除。

## 开源许可

基于 [GNU General Public License v2.0](LICENSE)（GPL-2.0-only）开源。原项目版权归 MoeJue 所有，本仓库修改部分归 Margele1337 所有。

## 致谢

- [iAJue/MoeKoeMusic](https://github.com/iAJue/MoeKoeMusic) — 原项目
- [MakcRe/KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) — API 源码（MIT）
