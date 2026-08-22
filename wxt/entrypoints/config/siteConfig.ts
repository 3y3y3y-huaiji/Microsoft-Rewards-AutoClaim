export const siteConfig = {
  pagesBase: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite',
  githubRepo: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite',
  officialWebsite: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite',
  helpUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite#readme',
  mobileUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite',
  contactUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite/issues',
  sponsorUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite',
  // MV3 opt-in ad slot landing page (static sponsor details, not an ad network).
  // AdBanner href is restricted to siteConfig.adsUrl / sponsorUrl (see docs/ads/ads-spec.md §6).
  adsUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite#sponsor',
  privacyUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite#privacy',
  uninstallUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite/issues/new?title=%5B%E5%8D%B8%E8%BD%BD%E5%8F%8D%E9%A6%88%5D',
  rewardsDashboard: 'https://rewards.bing.com/',
  rewardsAbout: 'https://rewards.bing.com/about?section=benefits',
} as const;

export type SiteConfig = typeof siteConfig;
