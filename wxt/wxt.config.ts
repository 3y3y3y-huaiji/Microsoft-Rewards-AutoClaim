import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist',
  modules: ['@wxt-dev/module-react'],
  alias: { '@': '.' },
  manifest: {
    name: '微软 Rewards 自动搜索器 (稳定版)',
    description:
      '【稳定版-WXT 0.20.6】自动或一键获取每日最高微软 Rewards 积分的浏览器扩展。',
    permissions: ['storage', 'alarms'],
    icons: { 16: 'imgs/logo.png', 32: 'imgs/logo2.png', 48: 'imgs/logo2.png', 128: 'imgs/logo3.png' },
    action: {
      default_icon: { 16: 'imgs/logo.png', 32: 'imgs/logo2.png', 48: 'imgs/logo2.png', 128: 'imgs/logo3.png' },
      default_title: '微软 Rewards 自动搜索器',
    },
    browser_specific_settings: {
      gecko: { id: 'microsoft_automatic_rewards@example.com', strict_min_version: '91.0' },
    },
  },
});
