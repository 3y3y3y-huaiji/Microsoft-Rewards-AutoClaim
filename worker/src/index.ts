/**
 * Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoClaim is licensed under Mulan PSL v2.
 * Cloudflare Worker for promo page - CPS聚合页，扩展外的小广告落地页
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/ads.json") {
      // 扩展 AdBanner fetch 的 JSON 源，不含远程 JS
      const ads = [
        {
          id: "promo-main",
          title: "精选 CPS 优惠合集",
          img: "https://via.placeholder.com/320x90?text=CPS+Promo",
          link: "https://你的域名/promo.html",
          desc: "点击查看全部 CPS 返利"
        }
      ];
      return new Response(JSON.stringify(ads), {
        headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" }
      });
    }

    // 默认返回 promo.html - 你的 CPS 聚合页
    const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>优惠聚合 - 微软自动领取积分 推广</title>
<style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 16px} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px} .card{border:1px solid #eee;border-radius:8px;padding:12px;text-align:center} .card img{width:100%;height:90px;object-fit:cover}</style>
</head>
<body>
<h1>精选 CPS 优惠</h1>
<p>本页由扩展可选推广入口跳转而来，收益用于支持项目维护。</p>
<div class="grid">
  <a class="card" href="https://你的CPS链接1" target="_blank" rel="noopener"><img src="https://via.placeholder.com/180x90?text=CPS1"><div>CPS 1 - 示例</div></a>
  <a class="card" href="https://你的CPS链接2" target="_blank" rel="noopener"><img src="https://via.placeholder.com/180x90?text=CPS2"><div>CPS 2 - 示例</div></a>
  <a class="card" href="https://你的CPS链接3" target="_blank" rel="noopener"><img src="https://via.placeholder.com/180x90?text=CPS3"><div>CPS 3 - 示例</div></a>
</div>
<!-- 在此可放 AdSense/百度联盟的网页广告代码（网页侧允许远程 JS） -->
<!-- <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script> -->
<p style="margin-top:32px;color:#888;font-size:12px">Mulan PSL v2 | 非 Microsoft 官方</p>
</body>
</html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
} satisfies ExportedHandler;
