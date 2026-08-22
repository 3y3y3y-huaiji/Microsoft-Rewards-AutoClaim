# 微软自动领取积分 (Microsoft Rewards AutoClaim)

[![License: MulanPSL2](https://img.shields.io/badge/License-MulanPSL2-blue.svg)](./LICENSE)
[![Framework: WXT](https://img.shields.io/badge/Framework-WXT-green.svg)](https://github.com/wxt-dev/wxt)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://github.com/microsoft/TypeScript)
[![Tests: 39 Passed](https://img.shields.io/badge/Tests-39%20Passed-brightgreen.svg)]()

## 📖 项目简介 (Overview)

**微软自动领取积分 (Microsoft Rewards AutoClaim)** 是基于 **木兰宽松许可证 v2（Mulan PSL v2）** 全新 clean-room 重构的 Microsoft Rewards 自动化工具。基于 WXT + React + TypeScript，支持桌面端/移动端 Bing 搜索与每日任务一键领取，默认无广告、经用户显式同意后可在扩展自有界面展示静态推广（不注入 Bing 页面）。

本项目行为参考 [spin311/MicrosoftRewardsWebsite](https://github.com/spin311/MicrosoftRewardsWebsite)，但**未复制其代码**，全部重实现以满足商用合规。

---

## ✨ 核心功能 (Features)

- 🤖 **全自动搜索执行 (Automated Search)**：自动在 Bing 产生桌面端及移动端随机关键词搜索，完成指定搜索次数后自动关闭搜索标签页。
- 🎁 **任务集一键领取 (Task Set Claims)**：支持自动识别并辅助完成 Rewards 仪表盘中的每日任务集（Daily Sets）与额外活动卡片。
- ⏱️ **随机延迟安全防护 (Random Delay Safety)**：内建智能随机搜索间隔与标签页留存等待，模拟真实人类操作习惯，保障账号安全。
- 👑 **会员等级预设 (Membership Presets)**：内置 Level 1（PC 10次 / 30分）、Level 2（PC 30次 / 90分 + 移动端 20次 / 60分）以及自定义策略预设，一键快速切换。
- 📢 **可选广告支持 (Opt-in Ads)**：默认关闭，仅在用户显式同意后在扩展自有界面（popup）展示静态推广，不向 `bing.com` / `rewards.bing.com` 注入任何内容。

---

## 🚀 安装指南 (Installation Guide)

### Chrome / Microsoft Edge / Brave
1. 从 Releases 页面或自行编译打包下载最新的 `chrome-mv3` Zip 压缩包并解压（或获得解压后的文件夹）。
2. 在浏览器地址栏输入并打开扩展管理页面：
   - Chrome / Brave: `chrome://extensions`
   - Edge: `edge://extensions`
3. 勾选页面右上角的 **“开发者模式” (Developer mode)**。
4. 点击 **“加载已解压的扩展程序” (Load unpacked)** 按钮。
5. 选择项目构建好的 `wxt/dist/chrome-mv3` 目录即可完成安装。
6. 建议在浏览器工具栏中将扩展图标**固定 (Pin)**，方便日常使用与状态查看。

### Mozilla Firefox
1. 打开 Firefox 地址栏并输入 `about:debugging#/runtime/this-firefox`。
2. 点击 **“临时载入附加组件...” (Load Temporary Add-on...)**。
3. 选择 `wxt/dist/firefox-mv2` 目录中的 `manifest.json` 文件或编译打包产物。

---

## 🛠️ 开发与测试指南 (Development & Testing)

本项目采用 TypeScript + React 开发，基于 WXT 现代化扩展构建工具，测试套件使用 Vitest。

### 前置要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 开发与构建命令
```bash
# 进入扩展工程目录
cd wxt

# 安装依赖
npm install

# 启动 Chrome 开发调试 (支持 HMR 热更新)
npm run dev

# 启动 Firefox 开发调试
npm run dev:firefox

# TypeScript 类型检查
npm run compile

# 运行 Vitest 单元测试套件 (包含 39 个单元测试)
npm run test

# 生产环境打包构建
npm run build           # 构建 Chrome MV3 产物 -> wxt/dist/chrome-mv3
npm run build:firefox   # 构建 Firefox MV2 产物 -> wxt/dist/firefox-mv2
npm run zip             # 打包生成商店上传 Zip
```

---

## ❓ 常见问题 (FAQ)

**Q: 使用自动搜索助手会被微软 Rewards 判定为违规吗？**  
A: 本扩展内置智能随机延迟机制（如每次搜索随机间隔 3~6 秒，留存 2 秒后关闭），高度模拟真实用户的浏览行为。建议搭配合理的分散搜索策略，避免设置过于激进的 0 秒刷新。

**Q: 为什么搜索没有增加积分？**  
A: 1. 请确认您已在 Edge/Bing 中登录了微软账号；  
2. 微软 Rewards 每日有搜索冷却限制或积分上限；  
3. 检查扩展设置中的搜索次数是否符合您当前账户等级（Level 1 每日最高 30 分，Level 2 最高 90 分 PC + 60 分 移动端）。

**Q: 插件是完全免费且开源的吗？**  
A: 是的，本项目以 Mulan PSL v2 开源，可自由使用、修改与商用。广告为可选且默认关闭，不影响核心功能，详见版权与协议说明章节。

---

## 🤖 AI 辅助声明 (AI Assistance Declaration)

本项目的部分代码、文档及注释内容借助 **AI 辅助工具**（包括 Google Antigravity / Gemini）生成或优化。所有 AI 生成内容均经过人工审查、测试与修改，以确保其正确性与安全性。

本声明遵循开源社区对 AI 辅助开发的透明度建议，旨在向用户和贡献者如实披露开发方式。

> This project's code, documentation, and comments were partially generated or refined with the assistance of AI tools (including Google Antigravity / Gemini). All AI-generated content has been manually reviewed, tested, and modified to ensure correctness and safety.

---

## 🍴 来源声明 (Origin Declaration)

本项目行为参考 [spin311/MicrosoftRewardsWebsite](https://github.com/spin311/MicrosoftRewardsWebsite)，但为满足商用合规已做 **clean-room 全新重实现**，未复制上游代码。

- 🌐 **全面汉化**：界面、文档与注释为简体中文
- ⚙️ **重构实现**：WXT MV3 + React 19 + TypeScript 5.8 全新实现
- 📦 **工程化**：Vitest 测试、双浏览器构建、GitHub Actions CI

感谢原作者 [spin311](https://github.com/spin311) 的思路启发。

---

## 📄 版权与协议说明 (Copyright & License)

本项目为 [spin311/MicrosoftRewardsWebsite](https://github.com/spin311/MicrosoftRewardsWebsite) 的 Fork 版本。

**原上游项目目前未设置开源协议，其代码版权归原作者 [spin311](https://github.com/spin311) 所有，本仓库不对其主张权利。**

本仓库**全新重实现/重构**的代码及新增的汉化、文档以 **木兰宽松许可证，第2版（Mulan PSL v2）** 开源，详见根目录 [`LICENSE`](./LICENSE)（SPDX: `MulanPSL-2.0`，http://license.coscl.org.cn/MulanPSL2）。重构后的 Chromium 扩展按此协议可自由使用、修改、分发及商用（需保留版权与许可证副本）。

> 旧提交中 `CC BY 4.0` 仅覆盖历史汉化文本，自本版起统一为 Mulan PSL v2。
