// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

import { browser } from 'wxt/browser';

interface ManualClaimButtonProps {
  isSearching: boolean;
}

function ManualClaimButton({ isSearching }: ManualClaimButtonProps) {
  const onClick = (): void => {
    browser.runtime.sendMessage({ action: isSearching ? 'stop' : 'popup' });
  };

  return (
    <button id="button" className={`btn my-1 ${isSearching ? 'btn-fail' : 'btn-success'}`} onClick={onClick}>
      {isSearching ? '停止搜索' : '开始获取奖励'}
    </button>
  );
}

export default ManualClaimButton;
