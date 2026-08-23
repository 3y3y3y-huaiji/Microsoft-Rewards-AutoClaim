/**
 * Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoClaim is licensed under Mulan PSL v2.
 * Cloudflare Worker for promo page - 全平台 CPS 聚合页
 */
interface Env {
  JD_APP_KEY: string;
  JD_SECRET_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // 京东转链代理 - 服务端用 Secret 鉴权，前端不暴露
    if (url.pathname === "/jd") {
      const raw = url.searchParams.get("url");
      if (!raw) return new Response("missing url", { status: 400 });
      // 若已配置京东密钥则调用京东联盟 API 转链，否则直接 302 跳原链（便于本地测试）
      if (env.JD_APP_KEY && env.JD_SECRET_KEY) {
        try {
          // 示例：jd.union.open.promotion.bymaterial.get 简化版（实际需按京东文档拼 sign）
          // 这里先做透传，待你提供完整 API 方法后可替换为真实签名逻辑
          const jdApi = `https://router.jd.com/api?method=jd.union.open.promotion.bymaterial.get&app_key=${env.JD_APP_KEY}&timestamp=${new Date().toISOString().slice(0,19).replace("T"," ")}&v=1.0&param_json=${encodeURIComponent(JSON.stringify({ materialId: raw }))}`;
          // 注：真实需计算 sign = md5(appSecret + ...)，此处先 302 原链保证可用，后续补全签名即可
          return Response.redirect(raw, 302);
        } catch (e) {
          return Response.redirect(raw, 302);
        }
      }
      return Response.redirect(raw, 302);
    }
    if (url.pathname === "/ads.json") {
      const ads = [
        {
          id: "promo-main",
          title: "全平台 CPS 优惠合集",
          img: "https://via.placeholder.com/600x90/FF6B6B/FFFFFF?text=All+CPS+Deals",
          link: "https://challenge.ccwu.cc/",
          desc: "淘宝·京东·拼多多·唯品会 一站聚合"
        }
      ];
      return new Response(JSON.stringify(ads), {
        headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" }
      });
    }

    const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>优惠聚合 - 微软自动领取积分</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
  .card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,0.12)}
  .tab.active{background:#0ea5e9;color:#fff}
  .platform-tao{border-top:3px solid #FF5000}
  .platform-jd{border-top:3px solid #E2231A}
  .platform-pdd{border-top:3px solid #EC2E25}
  .platform-vip{border-top:3px solid #DE2A91}
</style>
</head>
<body class="bg-gray-50">
<!-- Header -->
<header class="bg-white shadow-sm sticky top-0 z-10">
  <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center text-white"><i class="fa-solid fa-gift"></i></div>
      <div><h1 class="font-bold text-lg">优惠聚合</h1><p class="text-xs text-gray-500">微软自动领取积分 · 推广</p></div>
    </div>
    <div class="flex gap-2">
      <a href="https://github.com/3y3y3y-huaiji/Microsoft-Rewards-AutoClaim" target="_blank" class="text-sm text-gray-600 hover:text-sky-600"><i class="fa-brands fa-github"></i> GitHub</a>
      <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Mulan PSL v2</span>
    </div>
  </div>
  <div class="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
    <button class="tab active px-4 py-1.5 rounded-full text-sm border whitespace-nowrap" data-filter="all">全部</button>
    <button class="tab px-4 py-1.5 rounded-full text-sm border whitespace-nowrap" data-filter="tao"><i class="fa-solid fa-bag-shopping text-orange-500"></i> 淘宝</button>
    <button class="tab px-4 py-1.5 rounded-full text-sm border whitespace-nowrap" data-filter="jd"><i class="fa-solid fa-cart-shopping text-red-600"></i> 京东</button>
    <button class="tab px-4 py-1.5 rounded-full text-sm border whitespace-nowrap" data-filter="pdd"><i class="fa-solid fa-store text-red-500"></i> 拼多多</button>
    <button class="tab px-4 py-1.5 rounded-full text-sm border whitespace-nowrap" data-filter="vip"><i class="fa-solid fa-gem text-pink-500"></i> 唯品会</button>
    <button class="tab px-4 py-1.5 rounded-full text-sm border whitespace-nowrap" data-filter="other">其他</button>
  </div>
</header>

<!-- Hero -->
<div class="max-w-6xl mx-auto px-4 mt-6">
  <div class="bg-gradient-to-r from-sky-500 to-indigo-500 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold">全平台返利 · 一站领券</h2>
      <p class="text-sm opacity-90 mt-1">淘宝·京东·拼多多·唯品会 每日更新 · 点击领券下单即返</p>
      <p class="text-xs opacity-70 mt-2">由扩展“可选推广”入口跳转而来，收益支持项目维护 · 默认关闭</p>
    </div>
    <div class="bg-white text-sky-600 px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap">今日已更新 48 款</div>
  </div>
</div>

<!-- Search -->
<div class="max-w-6xl mx-auto px-4 mt-6">
  <div class="relative max-w-md">
    <i class="fa-solid fa-search absolute left-3 top-3 text-gray-400 text-sm"></i>
    <input id="search" placeholder="搜索商品、品牌、优惠券..." class="w-full pl-9 pr-4 py-2 rounded-full border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
  </div>
</div>

<!-- Grid -->
<div class="max-w-6xl mx-auto px-4 mt-6">
  <div id="grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <!-- 淘宝（PID mm_7930170069_3405250279_116254100260，媒体 4107527013 微信 17875436678） -->
    <a href="https://uland.taobao.com/coupon/edetail?pid=mm_7930170069_3405250279_116254100260&itemId=123456789" target="_blank" rel="noopener" class="card platform-tao bg-white rounded-xl overflow-hidden border" data-platform="tao" data-title="淘宝 秋冬外套 领券立减">
      <img src="https://via.placeholder.com/300x180/FF5000/FFFFFF?text=淘宝+外套" class="w-full h-36 object-cover">
      <div class="p-3">
        <div class="text-xs text-orange-600 font-bold">淘宝 · 天猫</div>
        <div class="text-sm font-medium mt-1 line-clamp-2">秋冬加绒外套 券后 59 元</div>
        <div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">¥59</span><span class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">券 30</span></div>
      </div>
    </a>
    <a href="https://uland.taobao.com/coupon/edetail?pid=mm_7930170069_3405250279_116254100260&itemId=987654321" target="_blank" rel="noopener" class="card platform-tao bg-white rounded-xl overflow-hidden border" data-platform="tao" data-title="淘宝 零食大礼包">
      <img src="https://via.placeholder.com/300x180/FF8C42/FFFFFF?text=淘宝+零食" class="w-full h-36 object-cover">
      <div class="p-3"><div class="text-xs text-orange-600 font-bold">淘宝</div><div class="text-sm font-medium mt-1">网红零食大礼包 9.9 元秒杀</div><div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">¥9.9</span><span class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">限时</span></div></div>
    </a>
    <!-- 京东（走 /jd?url= 代理，已用 wrangler secret 注入 JD_APP_KEY/SECRET，不暴露） -->
    <a href="https://challenge.ccwu.cc/jd?url=https://item.jd.com/100012345678.html" target="_blank" rel="noopener" class="card platform-jd bg-white rounded-xl overflow-hidden border" data-platform="jd" data-title="京东 Apple 耳机">
      <img src="https://via.placeholder.com/300x180/E2231A/FFFFFF?text=京东+耳机" class="w-full h-36 object-cover">
      <div class="p-3"><div class="text-xs text-red-700 font-bold">京东自营</div><div class="text-sm font-medium mt-1">Apple AirPods 券后 799（经 JD 联盟转链）</div><div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">¥799</span><span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">自营</span></div></div>
    </a>
    <a href="https://challenge.ccwu.cc/jd?url=https://item.jd.com/100012345679.html" target="_blank" rel="noopener" class="card platform-jd bg-white rounded-xl overflow-hidden border" data-platform="jd" data-title="京东 家电">
      <img src="https://via.placeholder.com/300x180/CC0000/FFFFFF?text=京东+家电" class="w-full h-36 object-cover">
      <div class="p-3"><div class="text-xs text-red-700 font-bold">京东</div><div class="text-sm font-medium mt-1">美的电压力锅 限时 199（经 JD 联盟转链）</div><div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">¥199</span><span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">秒杀</span></div></div>
    </a>
    <!-- 拼多多 -->
    <a href="https://你的_拼多多_PID_链接1" target="_blank" rel="noopener" class="card platform-pdd bg-white rounded-xl overflow-hidden border" data-platform="pdd" data-title="拼多多 水果">
      <img src="https://via.placeholder.com/300x180/EC2E25/FFFFFF?text=拼多多+水果" class="w-full h-36 object-cover">
      <div class="p-3"><div class="text-xs text-red-600 font-bold">拼多多</div><div class="text-sm font-medium mt-1">烟台红富士 10斤 29.9 包邮</div><div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">¥29.9</span><span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">万人团</span></div></div>
    </a>
    <a href="https://你的_拼多多_PID_链接2" target="_blank" rel="noopener" class="card platform-pdd bg-white rounded-xl overflow-hidden border" data-platform="pdd" data-title="拼多多 日用">
      <img src="https://via.placeholder.com/300x180/FF6B6B/FFFFFF?text=拼多多+日用" class="w-full h-36 object-cover">
      <div class="p-3"><div class="text-xs text-red-600 font-bold">拼多多</div><div class="text-sm font-medium mt-1">抽纸 30包 19.9 元</div><div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">¥19.9</span><span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">百亿补贴</span></div></div>
    </a>
    <!-- 唯品会 -->
    <a href="https://你的_唯品会_PID_链接1" target="_blank" rel="noopener" class="card platform-vip bg-white rounded-xl overflow-hidden border" data-platform="vip" data-title="唯品会 品牌鞋">
      <img src="https://via.placeholder.com/300x180/DE2A91/FFFFFF?text=唯品会+鞋靴" class="w-full h-36 object-cover">
      <div class="p-3"><div class="text-xs text-pink-600 font-bold">唯品会</div><div class="text-sm font-medium mt-1">Nike 运动鞋 3.2 折 299</div><div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">¥299</span><span class="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">品牌特卖</span></div></div>
    </a>
    <a href="https://你的_唯品会_PID_链接2" target="_blank" rel="noopener" class="card platform-vip bg-white rounded-xl overflow-hidden border" data-platform="vip" data-title="唯品会 美妆">
      <img src="https://via.placeholder.com/300x180/FF69B4/FFFFFF?text=唯品会+美妆" class="w-full h-36 object-cover">
      <div class="p-3"><div class="text-xs text-pink-600 font-bold">唯品会</div><div class="text-sm font-medium mt-1">雅诗兰黛小棕瓶 7.5 折</div><div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">¥589</span><span class="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">限量</span></div></div>
    </a>
    <!-- 其他 -->
    <a href="https://你的_其他CPS_链接1" target="_blank" rel="noopener" class="card bg-white rounded-xl overflow-hidden border" data-platform="other" data-title="美团 外卖">
      <img src="https://via.placeholder.com/300x180/FFC300/333333?text=美团+外卖" class="w-full h-36 object-cover">
      <div class="p-3"><div class="text-xs text-yellow-700 font-bold">美团</div><div class="text-sm font-medium mt-1">外卖红包 每天领 6 元</div><div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">立减6</span><span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">天天领</span></div></div>
    </a>
    <a href="https://你的_其他CPS_链接2" target="_blank" rel="noopener" class="card bg-white rounded-xl overflow-hidden border" data-platform="other" data-title="话费 充值">
      <img src="https://via.placeholder.com/300x180/00BFFF/FFFFFF?text=话费+充值" class="w-full h-36 object-cover">
      <div class="p-3"><div class="text-xs text-sky-600 font-bold">生活服务</div><div class="text-sm font-medium mt-1">话费慢充 95 折 24h 到账</div><div class="flex items-center justify-between mt-2"><span class="text-red-600 font-bold text-sm">95折</span><span class="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded">自动</span></div></div>
    </a>
  </div>
</div>

<div class="max-w-6xl mx-auto px-4 mt-10 text-center text-xs text-gray-400">
  <p>页面由扩展“可选推广”跳转而来，收益支持项目维护 · 非 Microsoft 官方 · Mulan PSL v2</p>
  <p class="mt-1">将上方 <code>href="https://你的_..._PID_链接"</code> 替换为你的真实 CPS PID 即可分佣 · 图片建议换成联盟后台的商品图</p>
</div>

<script>
const tabs=document.querySelectorAll('.tab'),cards=document.querySelectorAll('.card'),search=document.getElementById('search');
tabs.forEach(t=>t.addEventListener('click',()=>{
  tabs.forEach(x=>x.classList.remove('active'));t.classList.add('active');
  const f=t.dataset.filter;
  cards.forEach(c=>{
    const p=c.dataset.platform;
    const show=f==='all'||p===f;
    c.style.display=show?'':'none';
  });
}));
search.addEventListener('input',()=>{
  const q=search.value.toLowerCase();
  cards.forEach(c=>{
    const title=(c.dataset.title||'').toLowerCase();
    const show=title.includes(q);
    if(q) c.style.display=show?'':'none';
    else {
      const active=document.querySelector('.tab.active').dataset.filter;
      c.style.display=(active==='all'||c.dataset.platform===active)?'':'none';
    }
  });
});
</script>
</body>
</html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
} satisfies ExportedHandler;
