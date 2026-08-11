export const siteConfig = {
  pagesBase: 'https://mr-autosearch.pages.dev',
  githubRepo: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite',
  officialWebsite: 'https://mr-autosearch.pages.dev',
  helpUrl: 'https://mr-autosearch.pages.dev/#faq',
  mobileUrl: 'https://mr-autosearch.pages.dev/#mobile',
  contactUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite/issues',
  sponsorUrl: 'https://mr-autosearch.pages.dev/#sponsor',
  uninstallUrl: 'https://mr-autosearch.pages.dev/uninstall.html?extension=Microsoft%20Rewards%20AutoSearch',
  rewardsDashboard: 'https://rewards.bing.com/',
  rewardsAbout: 'https://rewards.bing.com/about?section=benefits',
} as const;

export type SiteConfig = typeof siteConfig;
