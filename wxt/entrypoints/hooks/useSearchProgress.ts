// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room: live progress hook reading background-owned storage keys.
// Spec §4.4 — popup shows completed/total without runtime messages.

import { useEffect, useState } from 'react';
import { storage } from '#imports';
import { getStorageItems } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { DEFAULTS } from '@/entrypoints/utils/settings';
import { toInt } from '@/entrypoints/utils/search';

export interface SearchProgressState {
  isLoaded: boolean;
  isSearching: boolean;
  completed: number;
  total: number;
}

const EMPTY_STATE: SearchProgressState = {
  isLoaded: false,
  isSearching: false,
  completed: 0,
  total: DEFAULTS.searches,
};

export function useSearchProgress(): SearchProgressState {
  const [state, setState] = useState<SearchProgressState>(EMPTY_STATE);

  useEffect(() => {
    let alive = true;
    void getStorageItems(['isSearching', 'currentSearch', 'searches'], StorageValues.SYNC).then((snap) => {
      if (!alive) return;
      setState({
        isLoaded: true,
        isSearching: Boolean(snap.isSearching),
        completed: toInt(snap.currentSearch, 0),
        total: toInt(snap.searches, DEFAULTS.searches),
      });
    });

    const subs = [
      storage.watch<boolean>('sync:isSearching', (v) => setState((p) => ({ ...p, isSearching: v ?? false }))),
      storage.watch<number>('sync:currentSearch', (v) => setState((p) => ({ ...p, completed: toInt(v, 0) }))),
      storage.watch<number>('sync:searches', (v) => setState((p) => ({ ...p, total: toInt(v, DEFAULTS.searches) }))),
    ];

    return () => {
      alive = false;
      subs.forEach((off) => off());
    };
  }, []);

  return state;
}
