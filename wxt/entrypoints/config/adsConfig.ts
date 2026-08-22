/**
 * MV3-compliant ad slot placeholder — static only, no remote code.
 * - 仅在扩展自有 UI（popup 底部 / 可选 options 页）展示静态图片+外链
 * - 禁止向 bing.com / rewards.bing.com 注入任何广告内容或远程 JS
 * - 是否展示以 StorageValues.SYNC:adsEnabled 为准，默认 false（见 docs/ads/ads-spec.md §4）
 * - 跳转 URL 必须收敛到 siteConfig.adsUrl / sponsorUrl，不接受运行时任意 URL
 */

export type AdSlot = "popup-bottom" | "options-inline";

export const adsConfig = {
  /** 编译期总开关，占位期保持 false；运行时以 sync:adsEnabled 为准 */
  enabled: false as boolean,
  /** 主广告位：popup 底部（App.tsx footer-links 下方） */
  slot: "popup-bottom" as AdSlot,
  /** 次位：options 页内联横幅（可选，需用户已 opt-in） */
  optionalSlot: "options-inline" as AdSlot,
  /** 存储键名（完整键为 sync:adsEnabled，见 StorageValues.SYNC） */
  storageKey: "adsEnabled" as const,
  /** 存储区域，与 StorageValues.SYNC 对应 */
  storageArea: "sync" as const,
  /** 默认不展示，需用户显式 opt-in */
  defaultEnabled: false as boolean,
  /** 必须经首次安装披露弹层/设置页复选框同意 */
  requireOptIn: true as const,
  /** MV3 红线：永远不允许远程 JS */
  allowRemoteJs: false as const,
  /** 披露文案版本，用于后续更新时重新提示 */
  disclosureVersion: 1 as number,
  /** 仅作占位：静态披露与隐私信息由 siteConfig.privacyUrl 承载 */
  privacyPolicyKey: "privacyUrl" as const,
} as const;

export type AdsConfig = typeof adsConfig;
