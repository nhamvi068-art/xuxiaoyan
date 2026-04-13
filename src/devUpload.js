/**
 * 本地开发时：把图片写入 public/works/（需 Vite 插件 __dev/save-image）
 * 生产构建 / GitHub Pages：无此接口，仍用 data URL 或已有 /works/ 路径
 */

export async function saveDataUrlToWorks(dataUrl, label = 'img') {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  if (!import.meta.env.DEV) {
    return dataUrl;
  }
  try {
    const r = await fetch('/__dev/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, label })
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      console.warn('[devUpload] save-image failed', err);
      return dataUrl;
    }
    const { url } = await r.json();
    return url || dataUrl;
  } catch (e) {
    console.warn('[devUpload]', e);
    return dataUrl;
  }
}

export async function savePortfolioToProject({ heroImage, cards }) {
  console.log('[savePortfolioToProject] 调用, heroImage:', heroImage, 'cards数量:', cards?.length, 'DEV:', import.meta.env.DEV);
  if (!import.meta.env.DEV) {
    return { ok: false, reason: '仅在本地 npm run dev 时可用' };
  }
  try {
    const r = await fetch('/__dev/save-portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heroImage, cards })
    });
    console.log('[savePortfolioToProject] 响应状态:', r.status, 'ok:', r.ok);
    const data = await r.json();
    console.log('[savePortfolioToProject] 返回数据:', JSON.stringify(data).slice(0, 200));
    if (!r.ok) throw new Error(data.error || 'save failed');
    return { ok: true, ...data };
  } catch (e) {
    console.error('[savePortfolioToProject] 异常:', e.message);
    return { ok: false, error: String(e.message || e) };
  }
}
