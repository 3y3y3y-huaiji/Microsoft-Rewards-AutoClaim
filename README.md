# 微软 Rewards 自动搜索助手 (Microsoft Rewards AutoSearch)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Framework: WXT](https://img.shields.io/badge/Framework-WXT-green.svg)](https://wxt.dev/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Tests: 37 Passed](https://img.shields.io/badge/Tests-37%20Passed-brightgreen.svg)]()

## 📖 项目简介 (Overview)

**微软 Rewards 自动搜索助手 (Microsoft Rewards AutoSearch)** 是一款 100% 纯净无广告、完全开源的 Microsoft Rewards 自动化搜索工具。基于现代化的 [WXT](https://wxt.dev/) 框架与 React + TypeScript 构建，旨在帮助广大微软 Rewards 用户安全、高效、自动化地获取每日 Bing 搜索积分。

本项目已全面清理所有第三方推广广告与恶意外链，并采用开放透明的 Apache License 2.0 开源协议发布，代码库完全解耦，支持一键部署官方静态站点至 Cloudflare Pages。

---

## ✨ 核心功能 (Features)

- 🤖 **全自动搜索执行 (Automated Search)**：自动在 Bing 产生桌面端及移动端随机关键词搜索，完成指定搜索次数后自动关闭搜索标签页。
- 🎁 **任务集一键领取 (Task Set Claims)**：支持自动识别并辅助完成 Rewards 仪表盘中的每日任务集（Daily Sets）与额外活动卡片。
- ⏱️ **随机延迟安全防护 (Random Delay Safety)**：内建智能随机搜索间隔与标签页留存等待，模拟真实人类操作习惯，保障账号安全。
- 👑 **会员等级预设 (Membership Presets)**：内置 Level 1（PC 10次 / 30分）、Level 2（PC 30次 / 90分 + 移动端 20次 / 60分）以及自定义策略预设，一键快速切换。
- 🛡️ **100% 纯净无广告 (100% Ad-Free)**：无第三方软件推荐、无弹窗广告、无私货推导，打造极致纯粹的使用体验。

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

本扩展采用 TypeScript + React 开发，基于 WXT 现代化扩展构建工具，测试套件使用 Vitest。

### 前置要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 开发命令
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

# 运行 Vitest 单元测试套件 (包含 37+ 单元测试)
npm run test

# 生产环境打包构建
npm run build           # 构建 Chrome MV3 产物 -> wxt/dist/chrome-mv3
npm run build:firefox   # 构建 Firefox MV2 产物 -> wxt/dist/firefox-mv2
npm run zip             # 打包生成商店上传 Zip
```

---

## 🌐 Cloudflare Pages 部署教程 (Cloudflare Pages Deployment Guide)

本项目提供完整的静态官网与卸载意见反馈站点源码（位于根目录 `site/`），可无缝部署至 Cloudflare Pages：

### 部署步骤
1. 将 GitHub 仓库 `3y3y3y-huaiji/MicrosoftRewardsWebsite` Fork 或关联至您的 GitHub 账号。
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，在左侧导航栏选择 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
3. 选择 GitHub 仓库 `3y3y3y-huaiji/MicrosoftRewardsWebsite`。
4. 设置构建参数：
   - **Framework preset**: `None`
   - **Build command**: (留空无需编译)
   - **Build output directory**: `site`
5. 点击 **Save and Deploy**，部署完成后 Cloudflare Pages 将自动分配如 `mr-autosearch.pages.dev` 的访问域名。
6. 站点包含：
   - 官方主页与功能介绍：`site/index.html`
   - 卸载反馈收集页面：`site/uninstall.html`
   - Wrangler 部署配置：`site/wrangler.json`

---

## ❓ 常见问题 (FAQ)

**Q: 使用自动搜索助手会被微软 Rewards 判定为违规吗？**  
A: 本扩展内置智能随机延迟机制（如每次搜索随机间隔 3~6 秒，留存 2 秒后关闭），高度模拟真实用户的浏览行为。建议搭配合理的分散搜索策略，避免设置过于激进的 0 秒刷新。

**Q: 为什么搜索没有增加积分？**  
A: 1. 请确认您已在 Edge/Bing 中登录了微软账号；  
2. 微软 Rewards 每日有搜索冷却限制或积分上限；  
3. 检查扩展设置中的搜索次数是否符合您当前账户等级（Level 1 每日最高 30 分，Level 2 最高 90 分 PC + 60 分 移动端）。

**Q: 插件是完全免费且开源的吗？**  
A: 是的，本项目 100% 开源，采用 Apache License 2.0 协议，无任何隐藏收费或商业广告。

---

## 📄 开源协议 (License)

本项目基于 **Apache License Version 2.0** 协议开源发布。  
版权所有 Copyright 2026 **3y3y3y-huaiji**。

完整协议内容请参阅 [LICENSE](LICENSE) 文件。
