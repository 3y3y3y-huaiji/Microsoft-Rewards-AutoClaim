// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Spec §7 — pure GitHub centralization (M4). All public-facing URLs point to
// the fork's GitHub repo except the Bing Rewards dashboard itself.
// Clean-room: constants are spec-driven; comments are fresh.

export const siteConfig = {
  pagesBase: 'https://github.com/3y3y3y-huaiji/Microsoft-Rewards-AutoClaim',
  githubRepo: 'https://github.com/3y3y3y-huaiji/Microsoft-Rewards-AutoClaim',
  officialWebsite: 'https://github.com/3y3y3y-huaiji/Microsoft-Rewards-AutoClaim',
  helpUrl: 'https://github.com/3y3y3y-huaiji/Microsoft-Rewards-AutoClaim#readme',
  mobileUrl: 'https://github.com/3y3y3y-huaiji/Microsoft-Rewards-AutoClaim',
  contactUrl: 'https://github.com/3y3y3y-huaiji/Microsoft-Rewards-AutoClaim/issues',
  sponsorUrl: 'https://challenge.ccwu.cc/',
  uninstallUrl:
    'https://github.com/3y3y3y-huaiji/Microsoft-Rewards-AutoClaim/issues/new?title=%5B%E5%8D%B8%E8%BD%BD%E5%8F%8D%E9%A6%88%5D',
  // Cloudflare Worker - CPS 聚合落地页（大陆主域名 challenge.ccwu.cc，workers.dev 备用）
  promoUrl: 'https://challenge.ccwu.cc/',
  adsUrl: 'https://challenge.ccwu.cc/',
  privacyUrl: 'https://github.com/3y3y3y-huaiji/Microsoft-Rewards-AutoClaim#readme',
  rewardsDashboard: 'https://rewards.bing.com/',
  rewardsAbout: 'https://rewards.bing.com/about?section=benefits',
} as const;

export type SiteConfig = typeof siteConfig;
