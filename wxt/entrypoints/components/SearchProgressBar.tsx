// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

import { toSearchProgress } from '@/entrypoints/utils/progress';

interface SearchProgressBarProps {
  completed: number;
  total: number;
  isSearching: boolean;
}

function SearchProgressBar({ completed, total, isSearching }: SearchProgressBarProps) {
  const { completed: done, total: goal, percent } = toSearchProgress(completed, total);
  const isComplete = done >= goal;
  const state = isSearching ? 'running' : isComplete ? 'done' : 'idle';
  const label = isSearching ? '正在搜索中…' : isComplete ? '已完成所有搜索' : '搜索已停止';

  return (
    <div className="progress-card" role="status" aria-live="polite">
      <div className="progress-row">
        <span className="progress-title">
          <span className={`progress-dot progress-dot--${state}`} aria-hidden="true" />
          {label}
        </span>
        <span className="progress-count">
          <strong>{done}</strong>/{goal}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-label={`已完成 ${goal} 次每日搜索中的 ${done} 次`}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default SearchProgressBar;
