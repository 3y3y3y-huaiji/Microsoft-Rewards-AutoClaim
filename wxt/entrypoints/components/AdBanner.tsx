/**
 * Copyright (c) 2026 Microsoft Rewards AutoSearch Contributors. Licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *          http://license.coscl.org.cn/MulanPSL2
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

import { siteConfig } from '@/entrypoints/config/siteConfig';

export interface AdBannerProps {
  /** Called when user dismisses the ad; caller should persist sync:adsEnabled=false */
  onClose: () => void;
}

/**
 * MV3-compliant opt-in ad banner — static only.
 *
 * - Rendered only in extension-owned UI (popup bottom, optionally options page);
 *   never injected into bing.com / rewards.bing.com or any content script.
 * - No remote JS, no fetch, no eval, no MutationObserver, no iframe/video.
 * - Image is a bundled static asset (wxt/public/imgs/*) via plain <img>.
 * - Click target href is restricted to siteConfig.adsUrl / sponsorUrl — no
 *   arbitrary URL props, no background forwarding, no query-param tracking.
 * - Dismiss writes back sync:adsEnabled=false via the caller's storage binding.
 */
export default function AdBanner({ onClose }: AdBannerProps) {
  // Allowlist: only siteConfig URLs may be used as the destination.
  // adsUrl is the dedicated sponsorship detail page; falls back to sponsorUrl
  // defensively if build-time config ever omits adsUrl.
  const href: string = siteConfig.adsUrl ?? siteConfig.sponsorUrl;

  return (
    <section
      id="ads-slot-popup"
      aria-label="赞助内容"
      style={{
        marginTop: '0.6em',
        borderTop: '1px solid #dbeae5',
        paddingTop: '0.45em',
        paddingBottom: '0.2em',
        paddingLeft: '15px',
        paddingRight: '15px',
        maxHeight: '90px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.35em',
          fontSize: '0.68em',
          color: '#5b5f5c',
          lineHeight: 1,
        }}
      >
        <span style={{ letterSpacing: '0.04em' }}>广告 · 支持我们</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭赞助展示"
          title="关闭赞助展示（可在设置中重新开启）"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#5b5f5c',
            fontSize: '1em',
            padding: '0 0.2em',
            lineHeight: 1,
          }}
        >
          ⓧ 关闭
        </button>
      </div>

      {/* Entire card is a plain anchor navigation — no window.open injection, no JS handler. */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="ad-banner-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6em',
          textDecoration: 'none',
          backgroundColor: '#fff',
          border: '1px solid #dbeae5',
          borderRadius: '0.35rem',
          padding: '0.45em 0.6em',
          maxHeight: '68px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <img
          src="/imgs/github.png"
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          style={{
            width: '32px',
            height: '32px',
            objectFit: 'contain',
            flexShrink: 0,
            maxWidth: '100%',
          }}
        />
        <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.78em',
              fontWeight: 700,
              color: '#18272F',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            支持本扩展持续维护
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '0.70em',
              fontWeight: 400,
              color: '#5b5f5c',
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '0.1em',
            }}
          >
            静态赞助位 · 不注入Bing页面
          </span>
        </span>
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            fontSize: '0.70em',
            fontWeight: 600,
            color: '#2282ad',
            border: '1px solid #2282ad',
            borderRadius: '999px',
            padding: '0.18em 0.55em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          去看看
        </span>
      </a>
    </section>
  );
}
