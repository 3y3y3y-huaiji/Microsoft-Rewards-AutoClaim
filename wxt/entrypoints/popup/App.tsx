// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

import './App.css';
import { useEffect, useState } from 'react';
import { useStorage } from '@/entrypoints/hooks/useStorage';
import { useSearchProgress } from '@/entrypoints/hooks/useSearchProgress';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { DEFAULTS, LEVEL_SEARCHES } from '@/entrypoints/utils/settings';
import { clearBadge } from '@/entrypoints/utils/browserAction';
import NumberInput from '@/entrypoints/components/NumberInput';
import AccountLevelSelect from '@/entrypoints/components/AccountLevelSelect';
import ManualClaimButton from '@/entrypoints/components/ManualClaimButton';
import SearchProgressBar from '@/entrypoints/components/SearchProgressBar';
import { siteConfig } from '@/entrypoints/config/siteConfig';

function App() {
  const [active, setActive] = useStorage<boolean>('active', DEFAULTS.active, StorageValues.SYNC);
  const [autoDaily, setAutoDaily] = useStorage<boolean>('autoDaily', DEFAULTS.autoDaily, StorageValues.SYNC);
  const [searches, setSearches] = useStorage<number>('searches', DEFAULTS.searches, StorageValues.SYNC);
  const [timeout, setTimeoutValue] = useStorage<number>('timeout', DEFAULTS.timeout, StorageValues.SYNC);
  const [closeTime, setCloseTime] = useStorage<number>('closeTime', DEFAULTS.closeTime, StorageValues.SYNC);
  const [accountLevel, setAccountLevel] = useStorage<string>('accountLevel', DEFAULTS.accountLevel, StorageValues.SYNC);
  const [openFirstResult, setOpenFirstResult] = useStorage<boolean>('openFirstResult', DEFAULTS.openFirstResult, StorageValues.SYNC);
  const [donateHover, setDonateHover] = useState(false);
  const { isLoaded, isSearching, completed, total } = useSearchProgress();

  useEffect(() => {
    if (isLoaded && !isSearching) clearBadge();
  }, [isLoaded, isSearching]);

  const hasRunToShow = isLoaded && (isSearching || completed > 0);

  function handleLevelChange(level: string): void {
    setAccountLevel(level);
    setSearches(LEVEL_SEARCHES[level] ?? DEFAULTS.searches);
  }

  return (
    <>
      <h3 className="container-fluid text-center mt-2 heading">微软 Rewards 自动搜索助手</h3>
      <div className="container-fluid text-center my-2">
        <a href={siteConfig.helpUrl} className="float-start links" target="_blank" rel="noopener noreferrer">
          帮助
        </a>
        <a href={siteConfig.officialWebsite} className="float-start links" target="_blank" rel="noopener noreferrer">
          官网
        </a>
        <a className="links" href={siteConfig.contactUrl} target="_blank" rel="noopener noreferrer" id="contact">
          联系我
        </a>
      </div>

      <div className="text-center">
        <ManualClaimButton isSearching={isSearching} />
        {hasRunToShow && <SearchProgressBar completed={completed} total={total} isSearching={isSearching} />}
        <div className="checkboxes">
          <div className="input-with-info">
            <input className="form-check-input" type="checkbox" id="autoCheckbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <label htmlFor="autoCheckbox">每日自动搜索</label>
            <span className="tooltip-icon info" data-tooltip="每天首次打开浏览器时自动打开 Bing 搜索标签页">
              ℹ
            </span>
          </div>
          <div className="input-with-info">
            <input className="form-check-input" type="checkbox" id="autoDaily" checked={autoDaily} onChange={(e) => setAutoDaily(e.target.checked)} />
            <label htmlFor="autoDaily">每日任务集</label>
            <span className="tooltip-icon info" data-tooltip="自动打开 Bing Rewards 标签页并完成每日任务以获取额外积分">
              ℹ
            </span>
          </div>
          <div className="input-with-info">
            <input className="form-check-input" type="checkbox" id="openFirstResult" checked={openFirstResult} onChange={(e) => setOpenFirstResult(e.target.checked)} />
            <label htmlFor="openFirstResult">打开搜索结果中的首条链接</label>
            <span className="tooltip-icon info" data-tooltip="在每个打开的搜索标签页中，在短暂随机延迟后跳转至首个搜索结果">
              ℹ
            </span>
          </div>
        </div>

        <div className="inputs">
          <div className="width-100">
            <div className="input-with-info">
              <AccountLevelSelect value={accountLevel} onChange={handleLevelChange} />
              <span className="tooltip-icon info" data-tooltip="您的 Rewards 会员等级决定默认搜索次数（基础会员 5 次，白银会员 10 次，黄金会员 20 次）">
                ℹ
              </span>
            </div>
          </div>
          <div className="width-100">
            <div className="input-with-info">
              <NumberInput id="searches" label="搜索次数" value={searches} min={1} max={999} onChange={setSearches} />
              <span className="tooltip-icon info" data-tooltip="在 Bing 中自动打开的随机搜索标签页数量">
                ℹ
              </span>
            </div>
          </div>
          <div>
            <NumberInput id="timeout" label="搜索间隔时间 (秒)" value={timeout} min={0} max={9999} onChange={setTimeoutValue} />
          </div>
          <div>
            <NumberInput id="closeTime" label="自动关闭标签页等待时间 (秒)" value={closeTime} min={0} max={300} onChange={setCloseTime} />
          </div>
        </div>
      </div>

      <div className="container-fluid text-center footer-links">
        <span>
          <a href={siteConfig.githubRepo} className="float-start links" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <img src="/imgs/github.png" alt="GitHub 标志" />
        </span>
        <a className="links" href={siteConfig.rewardsDashboard} target="_blank" rel="noopener noreferrer" id="rewardsLink">
          Rewards 页面
        </a>
        <span className="float-end" style={{ display: 'flex', alignItems: 'center' }}>
          <a
            href={siteConfig.sponsorUrl}
            className="links"
            target="_blank"
            rel="noopener noreferrer"
            id="donateText"
            onMouseOver={() => setDonateHover(true)}
          >
            赞助
          </a>
          <img src="/imgs/justAGirlSmol.png" alt="小猫" id="donateImg" style={{ visibility: donateHover ? 'visible' : 'hidden' }} />
        </span>
      </div>
    </>
  );
}

export default App;
