// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { siteConfig } from './siteConfig';

describe('siteConfig', () => {
  it('has all required URL properties defined as valid URLs', () => {
    expect(siteConfig.pagesBase).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite');
    expect(siteConfig.githubRepo).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite');
    expect(siteConfig.officialWebsite).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite');
    expect(siteConfig.helpUrl).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite#readme');
    expect(siteConfig.mobileUrl).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite');
    expect(siteConfig.contactUrl).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite/issues');
    expect(siteConfig.sponsorUrl).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite');
    expect(siteConfig.uninstallUrl).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite/issues/new?title=%5B%E5%8D%B8%E8%BD%BD%E5%8F%8D%E9%A6%88%5D');
    expect(siteConfig.rewardsDashboard).toBe('https://rewards.bing.com/');
    expect(siteConfig.rewardsAbout).toBe('https://rewards.bing.com/about?section=benefits');
  });

  it('contains correctly encoded title query parameter in uninstallUrl', () => {
    const url = new URL(siteConfig.uninstallUrl);
    expect(url.searchParams.get('title')).toBe('[卸载反馈]');
  });
});
