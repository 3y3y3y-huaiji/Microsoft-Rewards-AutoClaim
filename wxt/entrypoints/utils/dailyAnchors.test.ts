import { describe, it, expect } from 'vitest';
import { matchDailyAnchors } from './dailyAnchors';

describe('matchDailyAnchors', () => {
  it('returns only grid anchors that point at a Bing search', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="grid">
        <a href="https://www.bing.com/search?q=daily1">one</a>
        <a href="https://rewards.bing.com/other">skip</a>
        <a href="https://www.bing.com/search?q=daily2">two</a>
      </div>
      <div class="other">
        <a href="https://www.bing.com/search?q=notgrid">skip</a>
      </div>`;
    const anchors = matchDailyAnchors(root);
    expect(anchors.map((a) => a.textContent)).toEqual(['one', 'two']);
  });

  it('returns an empty array when the grid has no matching anchors', () => {
    const root = document.createElement('div');
    root.innerHTML = `<div class="grid"><a href="https://example.com">x</a></div>`;
    expect(matchDailyAnchors(root)).toEqual([]);
  });
});
