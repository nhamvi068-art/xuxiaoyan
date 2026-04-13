import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function parseDataUrl(dataUrl) {
  // 更健壮的匹配：支持带参数的 MIME 类型（如 image/png;charset=utf-8）
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return null;
  const mime = m[1];
  // 清理 base64 字符串：去除换行、空格、制表符等（浏览器有时会添加软换行）
  const cleanBase64 = m[2].replace(/[\s\n\r\t]/g, '');
  if (!cleanBase64 || cleanBase64.length < 10) return null;
  const buf = Buffer.from(cleanBase64, 'base64');
  if (!buf || buf.length === 0) return null;
  let ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  if (ext === 'svg+xml') ext = 'svg';
  return { buf, ext };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function localUploadPlugin() {
  return {
    name: 'local-upload',
    configureServer(server) {
      const root = path.resolve(__dirname);
      const worksDir = path.join(root, 'public', 'works');
      const dataDir = path.join(root, 'public', 'data');

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST') return next();

        if (req.url === '/__dev/save-image') {
          try {
            const body = await readBody(req);
            const { dataUrl, label = 'img' } = body;
            if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '需要 data URL 图片' }));
              return;
            }
            const parsed = parseDataUrl(dataUrl);
            if (!parsed) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '无法解析图片' }));
              return;
            }
            ensureDir(worksDir);
            const safeLabel = String(label).replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'img';
            const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeLabel}.${parsed.ext}`;
            const filePath = path.join(worksDir, name);
            fs.writeFileSync(filePath, parsed.buf);
            const url = `/works/${name}`;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, url }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(e.message || e) }));
          }
          return;
        }

        if (req.url === '/__dev/save-portfolio') {
          try {
            const body = await readBody(req);
            console.log('[vite-plugin] save-portfolio 收到 body, cards[0].img:', body.cards?.[0]?.img);
            let { heroImage = '', cards = [] } = body;

            async function saveIfDataUrl(str, label) {
              if (!str || typeof str !== 'string') return str;
              if (!str.startsWith('data:')) return str;
              const parsed = parseDataUrl(str);
              if (!parsed) return str;
              ensureDir(worksDir);
              const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${label}.${parsed.ext}`;
              fs.writeFileSync(path.join(worksDir, name), parsed.buf);
              return `/works/${name}`;
            }

            heroImage = await saveIfDataUrl(heroImage, 'hero');

            const nextCards = [];
            for (let i = 0; i < cards.length; i++) {
              const c = cards[i];
              const id = c.id ?? i;
              const img = await saveIfDataUrl(c.img, `card-${id}-thumb`);

              // 处理顶层 mainImages 和 aplusImages（向后兼容旧数据）
              const mainImages = await Promise.all(
                (c.mainImages || []).map((u, j) => saveIfDataUrl(u, `card-${id}-main-${j}`))
              );
              const aplusImages = await Promise.all(
                (c.aplusImages || []).map((u, j) => (u ? saveIfDataUrl(u, `card-${id}-aplus-${j}`) : u))
              );

              // 处理 colorVariants 中的所有图片（核心修复）
              const nextColorVariants = [];
              for (let vi = 0; vi < (c.colorVariants || []).length; vi++) {
                const v = c.colorVariants[vi];
                const vId = v.id || `variant-${vi}`;
                const vImg = v.img ? await saveIfDataUrl(v.img, `card-${id}-v-${vi}-img`) : v.img;
                const vMainImages = v.mainImages
                  ? await Promise.all(v.mainImages.map((u, j) => saveIfDataUrl(u, `card-${id}-v-${vi}-main-${j}`)))
                  : v.mainImages;
                const vAplusDesktopImages = v.aplusDesktopImages
                  ? await Promise.all(v.aplusDesktopImages.map((u, j) => saveIfDataUrl(u, `card-${id}-v-${vi}-aplus-desktop-${j}`)))
                  : v.aplusDesktopImages;
                const vAplusMobileImages = v.aplusMobileImages
                  ? await Promise.all(v.aplusMobileImages.map((u, j) => saveIfDataUrl(u, `card-${id}-v-${vi}-aplus-mobile-${j}`)))
                  : v.aplusMobileImages;
                nextColorVariants.push({
                  ...v,
                  id: vId,
                  img: vImg,
                  mainImages: vMainImages,
                  aplusDesktopImages: vAplusDesktopImages,
                  aplusMobileImages: vAplusMobileImages
                });
              }

              nextCards.push({ ...c, img, mainImages, aplusImages, colorVariants: nextColorVariants });
            }

            ensureDir(dataDir);
            const out = {
              version: new Date().toISOString().split('T')[0],
              heroImage,
              cards: nextCards
            };
            const portfolioPath = path.join(dataDir, 'portfolio.json');
            fs.writeFileSync(portfolioPath, JSON.stringify(out, null, 2), 'utf8');

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.end(JSON.stringify({ ok: true, ...out }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(e.message || e) }));
          }
          return;
        }

        next();
      });
    }
  };
}
