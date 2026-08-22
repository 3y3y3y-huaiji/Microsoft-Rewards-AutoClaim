// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room reimplementation per docs/rewrite/spec.md §3.
// Storage keys are `${namespace}:${key}` via wxt/storage. Batch helpers restore
// short keys after getItems. Comments and identifiers are fresh.

import { useEffect, useState } from 'react';
import { storage } from '#imports';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import type { StorageItem } from '@/entrypoints/types/storageItem';

type NamespacedKey = `${StorageValues}:${string}`;

function namespaced(key: string, ns: StorageValues): NamespacedKey {
  return `${ns}:${key}` as NamespacedKey;
}

export function useStorage<T>(key: string, fallback: T, ns: StorageValues = StorageValues.LOCAL) {
  const full = namespaced(key, ns);
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.getItem<T>(full).then((stored) => {
      setValue(stored ?? fallback);
      setReady(true);
    });
  }, [full]);

  useEffect(() => {
    if (ready) void storage.setItem(full, value);
  }, [full, value, ready]);

  return [value, setValue] as const;
}

export async function getStorageItem<T = unknown>(
  key: string,
  ns: StorageValues = StorageValues.LOCAL,
): Promise<T | null> {
  return (await storage.getItem<T>(namespaced(key, ns))) as T | null;
}

export async function setStorageItem<T = unknown>(
  key: string,
  value: T,
  ns: StorageValues = StorageValues.LOCAL,
): Promise<void> {
  await storage.setItem(namespaced(key, ns), value);
}

export async function setStorageItems(
  mapping: Record<string, unknown>,
  ns: StorageValues = StorageValues.LOCAL,
): Promise<void> {
  const entries = Object.entries(mapping).map(([k, v]) => ({
    key: namespaced(k, ns),
    value: v,
  }));
  await storage.setItems(entries);
}

export async function getStorageItems<T = unknown>(
  keys: string[],
  ns: StorageValues = StorageValues.LOCAL,
): Promise<Record<string, T>> {
  const fullKeys: NamespacedKey[] = keys.map((k) => namespaced(k, ns));
  const raw = await storage.getItems(fullKeys);
  return (raw as StorageItem[]).reduce<Record<string, T>>((acc, cur) => {
    const short = cur.key.split(':')[1];
    if (short) acc[short] = cur.value as T;
    return acc;
  }, {});
}

function asArray<T>(input: T | T[]): T[] {
  return Array.isArray(input) ? input : [input];
}

export async function mergeIntoStorageItem<T>(
  key: string,
  patch: T | T[],
  ns: StorageValues = StorageValues.LOCAL,
): Promise<void> {
  const full = namespaced(key, ns);
  const existing = await storage.getItem(full);
  let next: unknown;
  if (existing == null) {
    next = asArray(patch);
  } else if (Array.isArray(existing)) {
    next = (existing as unknown[]).concat(asArray(patch as unknown as never));
  } else if (typeof existing === 'string') {
    next = existing + String(patch);
  } else if (typeof existing === 'number') {
    const delta = typeof patch === 'number' ? patch : Number(patch);
    next = (existing as number) + delta;
  } else {
    throw new Error('mergeIntoStorageItem: Unsupported data type for appending.');
  }
  await storage.setItem(full, next);
}
