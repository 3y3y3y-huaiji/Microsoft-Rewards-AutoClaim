// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { siteConfig } from './siteConfig';

describe('siteConfig', () => {
  it('has all required URL properties defined as valid URLs', () => {
    expect(siteConfig.pagesBase).toBe('https://mr-autosearch.pages.dev');
    expect(siteConfig.githubRepo).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite');
    expect(siteConfig.officialWebsite).toBe('https://mr-autosearch.pages.dev');
    expect(siteConfig.helpUrl).toBe('https://mr-autosearch.pages.dev/#faq');
    expect(siteConfig.mobileUrl).toBe('https://mr-autosearch.pages.dev/#mobile');
    expect(siteConfig.contactUrl).toBe('https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite/issues');
    expect(siteConfig.sponsorUrl).toBe('https://mr-autosearch.pages.dev/#sponsor');
    expect(siteConfig.uninstallUrl).toBe('https://mr-autosearch.pages.dev/uninstall.html?extension=Microsoft%20Rewards%20AutoSearch');
    expect(siteConfig.rewardsDashboard).toBe('https://rewards.bing.com/');
    expect(siteConfig.rewardsAbout).toBe('https://rewards.bing.com/about?section=benefits');
  });

  it('contains correctly encoded query parameter in uninstallUrl', () => {
    const url = new URL(siteConfig.uninstallUrl);
    expect(url.searchParams.get('extension')).toBe('Microsoft Rewards AutoSearch');
  });
});
