// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

interface AccountLevelSelectProps {
  value: string;
  onChange: (level: string) => void;
}

const LEVELS: { value: string; label: string }[] = [
  { value: 'member', label: '基础会员 (Member)' },
  { value: 'silver', label: '白银会员 (Silver)' },
  { value: 'gold', label: '黄金会员 (Gold)' },
];

function AccountLevelSelect({ value, onChange }: AccountLevelSelectProps) {
  return (
    <span className="field">
      <select id="accountLevel" value={value} onChange={(e) => onChange(e.target.value)}>
        {LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
      <label htmlFor="accountLevel">
        <a
          className="normal-link level-link"
          href="https://rewards.bing.com/about?section=benefits"
          target="_blank"
          rel="noopener noreferrer"
        >
          账号等级
        </a>
      </label>
    </span>
  );
}

export default AccountLevelSelect;
