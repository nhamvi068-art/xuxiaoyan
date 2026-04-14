import React, { useState, useRef, useEffect, startTransition } from 'react';
import { saveDataUrlToWorks, savePortfolioToProject } from './devUpload';
import {
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  X,
  Maximize2,
  Palette,
  Plus
} from 'lucide-react';

// ==========================================
// 默认作品集卡片数据
// 说明：图片使用 base64 格式存储在 localStorage 中
// 当前为 Unsplash 占位图，用户上传后会替换
// ==========================================
const DEFAULT_CARDS = [
  {
    id: 1,
    title: '金融应用',
    desc: '移动端 UI/UX 设计',
    img: 'https://images.unsplash.com/photo-1616077168712-fc6c788db4af?auto=format&fit=crop&w=600&q=80',
    mainImages: [
      'https://images.unsplash.com/photo-1616077168712-fc6c788db4af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
    ],
    amazonLink: '',
    rotate: '-rotate-6',
    translateY: '-translate-y-4 md:translate-y-[50px]',
    aplusDesktopImages: [],
    aplusMobileImages: []
  },
  {
    id: 2,
    title: '品牌视觉',
    desc: '视觉系统与标志设计',
    img: 'https://images.unsplash.com/photo-1600697395543-ef3ee6e9af7b?auto=format&fit=crop&w=600&q=80',
    mainImages: [
      'https://images.unsplash.com/photo-1600697395543-ef3ee6e9af7b?auto=format&fit=crop&w=800&q=80'
    ],
    amazonLink: '',
    rotate: 'rotate-3',
    translateY: 'translate-y-2 md:translate-y-[100px]',
    aplusDesktopImages: [],
    aplusMobileImages: []
  },
  {
    id: 3,
    title: '电商平台',
    desc: '网页与移动端设计',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    mainImages: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
    ],
    amazonLink: '',
    rotate: '-rotate-2',
    translateY: 'translate-y-8 md:translate-y-[110px]',
    aplusDesktopImages: [],
    aplusMobileImages: []
  },
  {
    id: 4,
    title: '营销网站',
    desc: '落地页设计',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    mainImages: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
    ],
    amazonLink: '',
    rotate: 'rotate-6',
    translateY: 'translate-y-2 md:translate-y-[100px]',
    aplusDesktopImages: [],
    aplusMobileImages: []
  },
  {
    id: 5,
    title: '产品包装',
    desc: '包装设计',
    img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=600&q=80',
    mainImages: [
      'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=800&q=80'
    ],
    amazonLink: '',
    rotate: '-rotate-6',
    translateY: '-translate-y-4 md:translate-y-[50px]',
    aplusDesktopImages: [],
    aplusMobileImages: []
  }
];

// 首页大海报占位图
const HERO_POSTER_DEFAULT =
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=2000&q=85';

export default function App() {
  const [activeProject, setActiveProject] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('portfolio_logged_in'));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // 首页大海报
  const [heroImage, setHeroImage] = useState(HERO_POSTER_DEFAULT);
  const heroInitialized = useRef(false);

  const [heroFile, setHeroFile] = useState(null);
  const heroFileRef = useRef(null);

  // 作品卡片
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const cardsInitialized = useRef(false);
  const cardFileRef = useRef(null);

  // 读取配置：public/data/portfolio.json（随 Git 提交）> config.json > localStorage
  useEffect(() => {
    const applyLocalFallback = () => {
      if (!heroInitialized.current) {
        const savedHero = localStorage.getItem('hero_image');
        if (savedHero) {
          setHeroImage(savedHero);
          heroInitialized.current = true;
        }
      }
      if (!cardsInitialized.current) {
        const savedCards = localStorage.getItem('portfolio_cards');
        if (savedCards) {
          try {
            const parsed = JSON.parse(savedCards);
            // 规范化：确保每个卡片有 colorVariants
            const normalized = parsed.map(c => {
              if (!Array.isArray(c.colorVariants) || c.colorVariants.length === 0) {
                return {
                  ...c,
                  colorVariants: [{
                    id: 'default',
                    label: '默认',
                    img: c.img || '',
                    mainImages: Array.isArray(c.mainImages) ? c.mainImages : (c.img ? [c.img] : []),
                    aplusDesktopImages: Array.isArray(c.aplusImages) ? c.aplusImages : [],
                    aplusMobileImages: []
                  }]
                };
              }
              return c;
            });
            setCards(normalized);
            cardsInitialized.current = true;
          } catch (e) {
            // ignore
          }
        }
      }
    };

    const load = async () => {
      const cacheBuster = `?t=${Date.now()}`;
      try {
        const res = await fetch(`/data/portfolio.json${cacheBuster}`);
        if (res.ok) {
          const data = await res.json();
          const hasHero = data.heroImage && String(data.heroImage).trim().length > 0;
          const hasCards = Array.isArray(data.cards) && data.cards.length > 0;
          // 优先使用 portfolio.json（即使为空也要标记为已初始化，不再尝试其他数据源）
          if (hasHero) {
            setHeroImage(data.heroImage);
            heroInitialized.current = true;
          }
          // 必须调用 setCards，即使数组为空（否则会保持 DEFAULT_CARDS 初始值）
          if (hasCards) {
            const normalizedCards = data.cards.map(c => {
              if (!Array.isArray(c.colorVariants) || c.colorVariants.length === 0) {
                return {
                  ...c,
                  colorVariants: [{
                    id: 'default',
                    label: '默认',
                    img: c.img || '',
                    mainImages: Array.isArray(c.mainImages) ? c.mainImages : (c.img ? [c.img] : []),
                    aplusDesktopImages: Array.isArray(c.aplusImages) ? c.aplusImages : [],
                    aplusMobileImages: []
                  }]
                };
              }
              return c;
            });
            setCards(normalizedCards);
          } else {
            setCards([]);
          }
          cardsInitialized.current = true;
          heroInitialized.current = heroInitialized.current || hasHero;
          return;
        }
      } catch (_) { /* ignore */ }

      try {
        const res = await fetch('/config.json');
        if (res.ok) {
          const config = await res.json();
          if (config.heroImage && (config.heroImage.startsWith('data:') || config.heroImage.startsWith('/'))) {
            setHeroImage(config.heroImage);
            heroInitialized.current = true;
          }
          if (config.cards && config.cards.length > 0) {
            setCards(config.cards);
            cardsInitialized.current = true;
          }
        }
      } catch (_) { /* ignore */ }

      applyLocalFallback();
    };

    load();
  }, []);

  const scrollToWork = () => {
    document.getElementById('work-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 自动保存到项目（仅编辑模式下使用）
  const handleAutoSaveCards = async (cardsToSave) => {
    if (!editMode) return;
    const result = await savePortfolioToProject({ heroImage, cards: JSON.parse(JSON.stringify(cardsToSave)) });
    if (result.ok) {
      if (result.cards) {
        setCards(result.cards);
        localStorage.setItem('portfolio_cards', JSON.stringify(result.cards));
      }
    } else {
      console.warn('自动保存失败:', result.reason || result.error);
    }
  };

  // 导出配置：下载 JSON（备用）
  const handleExportConfig = () => {
    const config = {
      version: new Date().toISOString().split('T')[0],
      heroImage: heroImage || HERO_POSTER_DEFAULT,
      cards
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 写入 public/data/portfolio.json + public/works/（仅本地 npm run dev）
  const handleSaveToProject = async () => {
    const cardsToSave = JSON.parse(JSON.stringify(cards));
    const result = await savePortfolioToProject({ heroImage, cards: cardsToSave });
    if (result.ok) {
      localStorage.setItem('hero_image', heroImage);
      localStorage.setItem('portfolio_cards', JSON.stringify(cardsToSave));
      if (result.heroImage) {
        setHeroImage(result.heroImage);
      }
      if (result.cards) {
        setCards(result.cards);
        localStorage.setItem('portfolio_cards', JSON.stringify(result.cards));
      }
      window.alert('已保存到项目：public/data/portfolio.json，图片在 public/works/。请用 Git 提交后再推送。');
    } else {
      window.alert(result.reason || result.error || '保存失败（请确认正在使用 npm run dev）');
    }
  };

  const handleHeroFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroFile(file);
  };

  const handleCardFileChange = (e) => {
    const file = e.target.files?.[0];
    const cardId = cardFileRef.current?.dataset?.cardId;
    if (!file || !cardId) return;
    delete cardFileRef.current.dataset.cardId;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const url = await saveDataUrlToWorks(dataUrl, `card-${cardId}`);
      const updated = cards.map(c => c.id === Number(cardId) ? { ...c, img: url } : c);
      setCards(updated);
      localStorage.setItem('portfolio_cards', JSON.stringify(updated));
      console.log('封面已更新，调用 savePortfolioToProject 保存到文件');
      // 自动保存到 portfolio.json
      const result = await savePortfolioToProject({ heroImage, cards: JSON.parse(JSON.stringify(updated)) });
      console.log('savePortfolioToProject 结果:', result);
      if (result.ok) {
        if (result.cards) {
          setCards(result.cards);
          localStorage.setItem('portfolio_cards', JSON.stringify(result.cards));
        }
      } else {
        console.warn('更换封面保存失败:', result.reason || result.error);
      }
    };
    reader.readAsDataURL(file);
  };

  // 删除卡片（自动保存到项目）
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('确定要删除这个项目卡片吗？')) return;
    const updated = cards.filter(c => c.id !== cardId);
    setCards(updated);
    localStorage.setItem('portfolio_cards', JSON.stringify(updated));
    // 自动保存到 portfolio.json
    const cardsToSave = JSON.parse(JSON.stringify(updated));
    const result = await savePortfolioToProject({ heroImage, cards: cardsToSave });
    if (result.ok) {
      if (result.cards) {
        setCards(result.cards);
        localStorage.setItem('portfolio_cards', JSON.stringify(result.cards));
      }
    } else {
      console.warn('删除卡片保存失败:', result.reason || result.error);
    }
  };

  // 新建卡片（自动保存到项目）
  const handleAddCard = async () => {
    const newId = Date.now();
    const newCard = {
      id: newId,
      title: '新项目',
      desc: '',
      img: '',
      mainImages: [],
      amazonLink: '',
      rotate: 'rotate-0',
      translateY: 'translate-y-0',
      aplusImages: [],
      aplusDesktopImages: [],
      aplusMobileImages: [],
      colorVariants: [{
        id: 'default',
        label: '默认',
        img: '',
        mainImages: [],
        aplusDesktopImages: [],
        aplusMobileImages: []
      }]
    };
    const updated = [...cards, newCard];
    setCards(updated);
    localStorage.setItem('portfolio_cards', JSON.stringify(updated));
    startTransition(() => setActiveProject(newCard));
    // 自动保存到 portfolio.json
    const cardsToSave = JSON.parse(JSON.stringify(updated));
    const result = await savePortfolioToProject({ heroImage, cards: cardsToSave });
    if (result.ok) {
      if (result.cards) {
        setCards(result.cards);
        localStorage.setItem('portfolio_cards', JSON.stringify(result.cards));
      }
      console.log('[DEBUG] 新建卡片已保存到项目');
    } else {
      console.warn('[DEBUG] 新建卡片保存失败:', result.reason || result.error);
    }
  };

  // 更换海报：开发环境下写入 public/works/ 并改用 /works/xxx 路径
  useEffect(() => {
    if (!heroFile) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const url = await saveDataUrlToWorks(dataUrl, 'hero');
      setHeroImage(url);
      localStorage.setItem('hero_image', url);
      setHeroFile(null);
    };
    reader.readAsDataURL(heroFile);
  }, [heroFile]);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans overflow-x-hidden flex flex-col selection:bg-[#65d064] selection:text-white relative">

      {/* 大海报图片上传的隐藏 input */}
      <input
        ref={heroFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleHeroFileChange}
      />
      {/* 卡片缩略图上传的隐藏 input */}
      <input
        ref={cardFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCardFileChange}
      />

      {/* ==========================================
          导航栏 (Navbar)
         ========================================== */}
      <header className="w-full sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-2 md:py-2.5 flex items-center justify-between">
        {/* Logo */}
        <div className="cursor-pointer" onClick={() => setActiveProject(null)}>
          <span className="text-xl font-semibold tracking-wider text-gray-800">Xiaoyang</span>
        </div>

        {/* 登录/编辑按钮 */}
        {!isLoggedIn ? (
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setShowLoginModal(true); }}
            className="bg-[#1a1a1a] hover:bg-[#333] text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm"
          >
            登录
          </a>
        ) : editMode ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSaveToProject}
              className="bg-[#1a1a1a] hover:bg-[#333] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm"
              title="写入 public/data/portfolio.json 与 public/works/（需 npm run dev）"
            >
              保存到项目
            </button>
            <button
              type="button"
              onClick={handleExportConfig}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              导出
            </button>
            <button
              type="button"
              onClick={() => { setEditMode(false); }}
              className="bg-[#65d064] hover:bg-[#58bd57] text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm"
            >
              完成
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!isLoggedIn) {
                setShowLoginModal(true);
              } else {
                setEditMode(true);
              }
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 px-5 py-2 rounded-full text-sm font-medium transition-all"
          >
            编辑
          </button>
        )}
        </div>
      </header>

      {/* ==========================================
          视图切换逻辑
         ========================================== */}
      {!activeProject ? (
        // --- 首页视图：白底 + 顶部大海报 + 精选作品 ---
        <main className="flex-1 w-full flex flex-col relative z-20 animate-in fade-in duration-700 min-h-0 pb-6">

          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            {/* 顶部大海报 */}
            <section className="mt-4 md:mt-6">
              <div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl h-[min(58vh,600px)] sm:h-[min(65vh,700px)] md:h-[min(72vh,780px)] max-h-[900px] min-h-[320px] bg-neutral-200">
                <img
                  src={heroImage}
                  alt="作品集首页海报"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-10 lg:p-12 text-left">
                  <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight max-w-2xl leading-tight">
                    让好产品，一眼动心
                  </h1>
                  <p className="mt-3 md:mt-4 text-white/85 text-sm md:text-base font-light max-w-xl leading-relaxed">
                    用视觉讲清产品价值，让每一次点击都更接近成交。
                  </p>
                  <button
                    type="button"
                    onClick={scrollToWork}
                    className="mt-5 md:mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md ring-1 ring-white/25 transition hover:bg-white/25"
                  >
                    浏览作品
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                {/* 仅登录+编辑模式下显示的上传按钮 - 放在最上层 */}
                {isLoggedIn && editMode && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); heroFileRef.current?.click(); }}
                    className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-3 py-2 rounded-full text-sm font-medium backdrop-blur-md ring-1 ring-white/30 transition"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    更换图片
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* ==========================================
              标准项目卡片区域 (Project Cards Section)
             ========================================== */}
          <div id="work-section" className="w-full max-w-[1600px] mx-auto mt-4 sm:mt-6 md:mt-8 px-2 sm:px-4 md:px-6 lg:px-12 relative pb-8 md:pb-10">

            {/* 区域标题（参考图：简洁左对齐） */}
            <h2 className="mb-6 md:mb-8 text-left text-sm md:text-base font-semibold text-[#1a1a1a] tracking-wide">
              精选作品
            </h2>

            {/* 项目卡片：全屏背景图 + 渐变遮罩 + 叠加文字 */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 w-full">
              {cards.map((card) => {
                const mainLen = card.mainImages?.length ?? 0;
                const aplusLen = card.aplusImages?.length ?? 0;
                const imageCount = mainLen + aplusLen > 0 ? mainLen + aplusLen : card.img ? 1 : 0;
                return (
                  <div
                    key={card.id}
                    onClick={() => { setActiveProject(card); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-square bg-gray-900 shadow-sm hover:shadow-2xl transition-all duration-500"
                  >
                    {/* 背景图片 */}
                    <img src={card.img} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-110" />

                    {/* 右上角图标 */}
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-100">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>

                    {/* 编辑模式下：更换封面和删除按钮 */}
                    {isLoggedIn && editMode && (
                      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.stopPropagation(); cardFileRef.current.dataset.cardId = card.id; cardFileRef.current?.click(); }}
                          className="bg-black/60 text-white px-2 py-1 rounded-full text-xs backdrop-blur-md hover:bg-black/80 transition-colors">
                          更换封面
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                          className="bg-red-500/80 text-white px-2 py-1 rounded-full text-xs backdrop-blur-md hover:bg-red-600 transition-colors">
                          删除
                        </button>
                      </div>
                    )}

                    {/* 底部文字 */}
                    <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 flex flex-col justify-end transform transition-transform duration-500">
                      <span className="text-white/80 text-xs font-light tracking-widest uppercase mb-2 opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                        {imageCount} WORKS
                      </span>
                      {isLoggedIn && editMode ? (
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newTitle = e.target.value;
                            const updated = cards.map(c => c.id === card.id ? { ...c, title: newTitle } : c);
                            setCards(updated);
                            localStorage.setItem('portfolio_cards', JSON.stringify(updated));
                            if (editMode) {
                              handleAutoSaveCards(updated);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-white text-xl font-medium tracking-wide bg-transparent border-b border-white/50 focus:border-white outline-none w-full"
                          placeholder="输入标题..."
                        />
                      ) : (
                        <h3 className="text-white text-xl font-medium tracking-wide translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          {card.title}
                        </h3>
                      )}
                      <div className="h-[2px] w-0 bg-white/70 mt-4 group-hover:w-8 transition-all duration-500 delay-100" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 编辑模式下：新建卡片按钮 */}
            {isLoggedIn && editMode && (
              <button
                type="button"
                onClick={handleAddCard}
                className="mt-6 w-full py-8 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:border-[#65d064] hover:text-[#65d064] transition-colors flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                新建项目卡片
              </button>
            )}
          </div>

          {/* 占满剩余高度，避免页脚上移与卡片重叠 */}
          <div className="flex-1 min-h-6 shrink-0" aria-hidden="true" />

          {/* 底部版权信息 */}
          <footer className="w-full shrink-0 mt-6 sm:mt-8 border-t border-gray-100 pt-4 pb-4">
            <div className="flex items-center justify-center gap-6 text-gray-400 text-xs">
              <span>© 2024 XIAOYANG</span>
              <span>•</span>
              <span>All Rights Reserved</span>
            </div>
          </footer>
        </main>
      ) : (
        // --- 项目详情视图 ---
        <ProjectDetailView
          project={activeProject}
          editMode={editMode}
          heroImage={heroImage}
          onAutoSave={handleAutoSaveCards}
          onUpdate={(updated) => {
            const updatedCards = cards.map(c => c.id === updated.id ? updated : c);
            setCards(updatedCards);
            localStorage.setItem('portfolio_cards', JSON.stringify(updatedCards));
            startTransition(() => setActiveProject(updated));
            // 编辑模式下自动保存到项目文件
            if (editMode) {
              handleAutoSaveCards(updatedCards);
            }
          }}
          onBack={() => {
            // 返回前先同步当前编辑状态到 cards
            const currentCard = cards.find(c => c.id === activeProject?.id);
            if (currentCard) {
              // 通知 ProjectDetailView 触发 onUpdate 来保存最新状态
              // 这里直接更新 cards 和 localStorage
              const updatedCards = cards.map(c => c.id === activeProject.id ? { ...currentCard } : c);
              setCards(updatedCards);
              localStorage.setItem('portfolio_cards', JSON.stringify(updatedCards));
            }
            startTransition(() => setActiveProject(null));
          }}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => { setIsLoggedIn(true); setShowLoginModal(false); setEditMode(true); }}
        />
      )}

    </div>
  );
}

// ==========================================
// 项目详情视图（A+ 式卡片流：主图纵向全宽 + A+ 响应式栅格）
// ==========================================
function ProjectDetailView({ project, editMode, onUpdate, onBack, heroImage, onAutoSave }) {
  // 变体迁移：兼容旧数据（无 colorVariants 字段）
  const getInitialVariants = () => {
    if (Array.isArray(project.colorVariants) && project.colorVariants.length > 0) {
      return project.colorVariants;
    }
    return [{
      id: 'default',
      label: '默认',
      img: project.img || '',
      mainImages: project.mainImages?.length ? [...project.mainImages] : (project.img ? [project.img] : []),
      aplusDesktopImages: Array.isArray(project.aplusDesktopImages) ? [...project.aplusDesktopImages] : [],
      aplusMobileImages: Array.isArray(project.aplusMobileImages) ? [...project.aplusMobileImages] : []
    }];
  };

  const [colorVariants, setColorVariants] = useState(getInitialVariants);
  const [activeVariantId, setActiveVariantId] = useState(getInitialVariants()[0].id);
  const activeVariant = colorVariants.find(v => v.id === activeVariantId) || colorVariants[0];

  const [amazonLink, setAmazonLink] = useState(project.amazonLink || '');
  const [title, setTitle] = useState(project.title || '');
  const [desc, setDesc] = useState(project.desc || '');
  const [deviceView, setDeviceView] = useState('desktop');
  const [activeAplusTab, setActiveAplusTab] = useState(0);
  const [showAllMain, setShowAllMain] = useState(false);
  const currentAplusImages = deviceView === 'desktop' ? activeVariant.aplusDesktopImages : activeVariant.aplusMobileImages;
  const [previewIndex, setPreviewIndex] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const mainFileRef = useRef(null);
  const aplusFileRef = useRef(null);

  // ESC 键关闭 Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && lightboxOpen) {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // 自动同步 amazonLink 到父组件（编辑模式下，链接变化时立即保存）
  const prevAmazonLink = useRef(amazonLink);
  useEffect(() => {
    if (!editMode) return;
    if (amazonLink !== prevAmazonLink.current) {
      prevAmazonLink.current = amazonLink;
      onUpdate({ ...project, amazonLink, title, desc, colorVariants });
    }
  }, [amazonLink, editMode]);

  // 打开预览
  const openPreview = (type, idx) => {
    setPreviewType(type);
    setPreviewIndex(idx);
  };

  // 打开 Lightbox
  const openLightbox = (index, type = 'main') => {
    setPreviewType(type);
    setLightboxImageIndex(index);
    setLightboxOpen(true);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewIndex(null);
    setPreviewType(null);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const lightboxNextImage = () => {
    const total = previewType === 'main' ? activeVariant.mainImages.length : currentAplusImages.length;
    setLightboxImageIndex((p) => (p === total - 1 ? 0 : p + 1));
  };
  const lightboxPrevImage = () => {
    const total = previewType === 'main' ? activeVariant.mainImages.length : currentAplusImages.length;
    setLightboxImageIndex((p) => (p === 0 ? total - 1 : p - 1));
  };

  // 上一张
  const prevImage = () => {
    const images = previewType === 'main' ? activeVariant.mainImages : currentAplusImages;
    setPreviewIndex((previewIndex - 1 + images.length) % images.length);
  };

  // 下一张
  const nextImage = () => {
    const images = previewType === 'main' ? activeVariant.mainImages : currentAplusImages;
    setPreviewIndex((previewIndex + 1) % images.length);
  };

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 更新当前变体（同时同步到父组件）
  // 注意：不再自动更新 img 封面图，封面图只在首页卡片区域单独更换
  const updateVariant = (updater) => {
    setColorVariants(vars => {
      const updated = vars.map(v =>
        v.id === activeVariantId ? updater(v) : v
      );
      // 同步到父组件，保留原有的封面图，不自动更新
      onUpdate({ ...project, amazonLink, title, desc, colorVariants: updated });
      return updated;
    });
  };

  // 当前变体的主图/A+（直接取 state）
  const mainImages = activeVariant.mainImages;
  const setMainImages = (fn) => updateVariant(v => ({
    ...v,
    mainImages: typeof fn === 'function' ? fn(v.mainImages) : fn,
    img: typeof fn === 'function' ? fn(v.mainImages)[0] || v.img : fn[0] || v.img
  }));

  const setAplusDesktopImages = (fn) => updateVariant(v => ({
    ...v,
    aplusDesktopImages: typeof fn === 'function' ? fn(v.aplusDesktopImages) : fn
  }));

  const setAplusMobileImages = (fn) => updateVariant(v => ({
    ...v,
    aplusMobileImages: typeof fn === 'function' ? fn(v.aplusMobileImages) : fn
  }));

  const setCurrentAplusImages = deviceView === 'desktop' ? setAplusDesktopImages : setAplusMobileImages;

  const handleMainUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const url = await saveDataUrlToWorks(dataUrl, `project-${project.id}-${activeVariantId}-main`);
    const newMain = [...activeVariant.mainImages, url];
    updateVariant(v => ({ ...v, mainImages: newMain }));
    e.target.value = '';
  };

  const handleAplusUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const suffix = deviceView === 'desktop' ? 'aplus-desktop' : 'aplus-mobile';
    const url = await saveDataUrlToWorks(dataUrl, `project-${project.id}-${activeVariantId}-${suffix}-${Date.now()}`);
    const replaceIdx = aplusFileRef.current?.dataset?.replaceIdx;
    const setter = deviceView === 'desktop' ? setAplusDesktopImages : setAplusMobileImages;
    if (replaceIdx !== undefined && replaceIdx !== '') {
      setter(imgs => { const u = [...imgs]; u[parseInt(replaceIdx)] = url; return u; });
      aplusFileRef.current.dataset.replaceIdx = '';
    } else {
      setter(imgs => [...imgs, url]);
    }
    e.target.value = '';
  };

  const addMainImage = () => mainFileRef.current?.click();
  const addAplusImage = () => aplusFileRef.current?.click();
  const removeMainImage = (idx) => setMainImages(imgs => imgs.filter((_, i) => i !== idx));
  const removeAplusImage = (idx) => setCurrentAplusImages(imgs => imgs.filter((_, i) => i !== idx));
  const handleAplusImageClick = (idx) => {
    if (!editMode) return;
    aplusFileRef.current.dataset.replaceIdx = idx;
    aplusFileRef.current.click();
  };

  // 新增颜色变体
  const addColorVariant = () => {
    const newId = `variant-${Date.now()}`;
    const newLabel = `变体 ${colorVariants.length + 1}`;
    setColorVariants(vars => [...vars, {
      id: newId,
      label: newLabel,
      img: '',
      mainImages: [],
      aplusDesktopImages: [],
      aplusMobileImages: []
    }]);
    setActiveVariantId(newId);
    setDeviceView('desktop');
  };

  // 删除颜色变体（至少保留一个）
  const removeColorVariant = (id) => {
    if (colorVariants.length <= 1) return;
    setColorVariants(vars => vars.filter(v => v.id !== id));
    if (activeVariantId === id) {
      setActiveVariantId(colorVariants.find(v => v.id !== id)?.id);
    }
  };

  // 重命名变体标签
  const renameVariant = (id, newLabel) => {
    setColorVariants(vars => vars.map(v => v.id === id ? { ...v, label: newLabel } : v));
  };

  const handleSave = () => {
    // 同步到父组件，保留原有的封面图
    onUpdate({ ...project, amazonLink, title, desc, colorVariants });
  };

  const hasChanges =
    amazonLink !== (project.amazonLink || '') ||
    title !== (project.title || '') ||
    desc !== (project.desc || '') ||
    JSON.stringify(colorVariants) !== JSON.stringify(getInitialVariants());

  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 lg:px-12 pt-3 pb-20 animate-in fade-in duration-700 relative z-20">

      {/* 返回按钮 + 颜色变体 + 亚马逊链接 合并行 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        {/* 左侧：返回按钮 + 胶囊变体切换按钮 */}
        <div className="flex items-center gap-4 flex-[1_1_auto] min-w-0">
          <button
            onClick={() => {
              if (editMode && hasChanges) {
                if (!window.confirm('有未保存的更改，确定要返回吗？')) return;
              }
              onBack();
            }}
            className="shrink-0 text-gray-500 hover:text-[#1a1a1a] transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          {/* 编辑模式下显示保存提示 */}
          {editMode && hasChanges && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              有未保存的更改，返回前请保存
            </div>
          )}
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar:hidden] flex items-center gap-2 flex-nowrap min-w-max">
            {colorVariants.map((v) => (
              <div key={v.id} className="flex items-center gap-1.5 shrink-0">
                {editMode ? (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={v.label}
                      onChange={(e) => renameVariant(v.id, e.target.value)}
                      className="w-16 pl-2 pr-6 py-1.5 text-xs rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#65d064]/40 text-center text-gray-700 font-medium"
                    />
                    {colorVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColorVariant(v.id)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ) : null}
              <button
                type="button"
                onClick={() => setActiveVariantId(v.id)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeVariantId === v.id
                    ? 'bg-[#65d064] text-white shadow-md shadow-[#65d064]/25'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {v.label}
              </button>
              </div>
            ))}
            {editMode && (
              <button
                type="button"
                onClick={addColorVariant}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold bg-[#65d064]/10 text-[#65d064] hover:bg-[#65d064]/20 transition-colors border border-dashed border-[#65d064]/30 shrink-0"
              >
                <Plus size={12} />
                新增
              </button>
            )}
          </div>
        </div>

        {/* 右侧：亚马逊链接 */}
        <div className="flex items-center gap-2 shrink-0">
          {editMode ? (
            <input
              type="url"
              value={amazonLink}
              onChange={(e) => setAmazonLink(e.target.value)}
              placeholder="亚马逊链接..."
              className="max-w-[14rem] px-3 py-1.5 rounded-lg border border-gray-200/90 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65d064]/40"
            />
          ) : amazonLink ? (
            <a
              href={amazonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-[#65d064] hover:text-[#58bd57] font-medium"
            >
              亚马逊链接
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          ) : null}
        </div>
      </div>

      {/* 专题画布：上下分栏 — 上方主副图 / 下方 A+ */}
      <div className="rounded-2xl md:rounded-[22px] bg-[#f3f2ef] p-3 sm:p-6 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-black/[0.05]">

        {/* ========== 上方：主副图（横向卡片网格） ========== */}
        <section aria-labelledby="detail-main-label" className="mb-10 lg:mb-12">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h2 id="detail-main-label" className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">
                主图
              </h2>
              <span className="hidden text-[11px] text-gray-400 sm:inline">Main</span>
            </div>
            <div className="flex items-center gap-3">
              {mainImages.length > 7 && (
                <button
                  onClick={() => setShowAllMain(!showAllMain)}
                  className="flex items-center gap-1 text-xs font-medium transition-all"
                  style={showAllMain ? { color: '#65d064' } : { color: '#9ca3af' }}
                >
                  {showAllMain ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronsUpDown size={13} strokeWidth={2} />}
                  {showAllMain ? '收起' : `全部 ${mainImages.length} 张`}
                </button>
              )}
              {editMode && (
                <button
                  type="button"
                  onClick={addMainImage}
                  className="shrink-0 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#65d064] shadow-sm ring-1 ring-black/[0.06] transition hover:bg-white"
                >
                  + 添加主图
                </button>
              )}
            </div>
          </div>

          {mainImages.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-gray-300/80 bg-white/60 text-gray-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p className="mt-2 text-sm">暂无主图</p>
              {editMode && (
                <button type="button" onClick={addMainImage} className="mt-3 text-xs font-semibold text-[#65d064] underline underline-offset-2">点击添加</button>
              )}
            </div>
          ) : showAllMain ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-3 sm:px-5 pt-4 pb-4">
                <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {mainImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(idx, 'main')}
                      className="relative rounded-xl overflow-hidden group cursor-pointer ring-1 ring-gray-200 hover:shadow-md hover:ring-gray-300 transition-all w-full"
                    >
                      <img
                        src={img}
                        alt={`主图 ${idx + 1}`}
                        className="w-full h-auto object-contain block"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={20} strokeWidth={1.5} />
                      </div>
                      {editMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeMainImage(idx); }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-stretch">
              {/* 左侧主图 */}
              <div className="group relative overflow-hidden cursor-pointer bg-white border border-gray-100 rounded-xl flex-shrink-0 w-full md:w-[42%]"
                onClick={() => openLightbox(0, 'main')}
              >
                <img
                  src={mainImages[0]}
                  alt="主图"
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02] block"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-black text-[10px] font-medium px-2 py-1 rounded-md shadow-sm">
                  01 / 主图
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                  <Maximize2 className="text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={28} strokeWidth={1.5} />
                </div>
                {editMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeMainImage(0); }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* 右侧：两行三列 */}
              <div className="hidden md:flex flex-col gap-3 lg:gap-4 flex-1">
                {/* 第一行：3张图 */}
                <div className="grid grid-cols-3 gap-3 lg:gap-4 flex-1">
                  {mainImages.slice(1, 4).map((img, idx) => (
                    <div
                      key={idx + 1}
                      className="group relative overflow-hidden cursor-pointer bg-white border border-gray-100 rounded-xl"
                      onClick={() => openLightbox(idx + 1, 'main')}
                    >
                      <img
                        src={img}
                        alt={`主图 ${idx + 2}`}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02] block"
                      />
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-black text-[10px] font-medium px-2 py-1 rounded-md shadow-sm">
                        0{idx + 2}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                        <Maximize2 className="text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={18} strokeWidth={1.5} />
                      </div>
                      {editMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeMainImage(idx + 1); }}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {/* 第二行：3张图 */}
                <div className="grid grid-cols-3 gap-3 lg:gap-4 flex-1">
                  {mainImages.slice(4, 7).map((img, idx) => (
                    <div
                      key={idx + 4}
                      className="group relative overflow-hidden cursor-pointer bg-white border border-gray-100 rounded-xl"
                      onClick={() => openLightbox(idx + 4, 'main')}
                    >
                      <img
                        src={img}
                        alt={`主图 ${idx + 5}`}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02] block"
                      />
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-black text-[10px] font-medium px-2 py-1 rounded-md shadow-sm">
                        0{idx + 5}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                        <Maximize2 className="text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={18} strokeWidth={1.5} />
                      </div>
                      {editMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeMainImage(idx + 4); }}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 区块分隔线 */}
        <div className="mb-10 lg:mb-12 h-px bg-gray-200/60" />

        {/* ========== 下方：A+ 内容（响应式栅格） ========== */}
        <section aria-labelledby="detail-aplus-label">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h2 id="detail-aplus-label" className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">
                A+ 内容
              </h2>
              <span className="hidden text-[11px] text-gray-400 sm:inline">A+</span>
            </div>
            {editMode && (
              <button
                type="button"
                onClick={addAplusImage}
                className="shrink-0 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#65d064] shadow-sm ring-1 ring-black/[0.06] transition hover:bg-white"
              >
                + 添加图片
              </button>
            )}
          </div>

          {currentAplusImages.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-gray-300/80 bg-white/60 text-gray-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p className="mt-2 text-sm">暂无 {deviceView === 'desktop' ? '电脑端' : '手机端'} A+ 内容</p>
              {editMode && (
                <button type="button" onClick={addAplusImage} className="mt-3 text-xs font-semibold text-[#65d064] underline underline-offset-2">点击添加</button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl flex flex-col items-center min-h-[400px] border border-gray-100 overflow-hidden">
              {/* 顶部：设备切换 + 图片编号 合并一行居中 */}
              <div className="w-full flex items-center justify-center gap-3 pt-5 pb-4 px-4">
                {/* 设备切换胶囊 */}
                <div className="flex bg-gray-100 p-1 rounded-full gap-0.5">
                  <button
                    onClick={() => { setDeviceView('desktop'); setActiveAplusTab(0); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      deviceView === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Monitor size={13} strokeWidth={2} /> 电脑端
                  </button>
                  <button
                    onClick={() => { setDeviceView('mobile'); setActiveAplusTab(0); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      deviceView === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Smartphone size={13} strokeWidth={2} /> 手机端
                  </button>
                </div>

                {/* 分隔点 */}
                {currentAplusImages.length >= 2 && (
                  <div className="w-px h-4 bg-gray-300" />
                )}

                {/* 图片编号胶囊 */}
                {currentAplusImages.length >= 2 && (
                  <div className="flex bg-gray-100 p-1 rounded-full gap-0.5">
                    {currentAplusImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveAplusTab(idx)}
                        className={`w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                          activeAplusTab === idx
                            ? 'bg-[#65d064] text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 图片区域 */}
              <div className="flex-1 flex justify-center items-start w-full px-2 sm:px-4 pb-6">
                <div className={`transition-all duration-500 ease-in-out ${deviceView === 'desktop' ? 'w-full max-w-[970px]' : 'w-[375px] max-w-full'}`}>
                  <div className="relative group">
                    {editMode ? (
                      <div
                        onClick={() => handleAplusImageClick(activeAplusTab)}
                        className="w-full cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={currentAplusImages[activeAplusTab]}
                          alt={`A+ Module ${activeAplusTab}`}
                          className="w-full h-auto block"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                          <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 size={20} className="text-gray-700" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={currentAplusImages[activeAplusTab]}
                        alt={`A+ Module ${activeAplusTab}`}
                        className="w-full h-auto block cursor-pointer"
                        loading="lazy"
                        decoding="async"
                        onClick={() => openLightbox(activeAplusTab, 'aplus')}
                      />
                    )}
                    {editMode && (
                      <button
                        onClick={() => removeAplusImage(activeAplusTab)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <input ref={mainFileRef} type="file" accept="image/*" className="hidden" onChange={handleMainUpload} />
          <input ref={aplusFileRef} type="file" accept="image/*" className="hidden" onChange={handleAplusUpload} />
        </section>
      </div>

      {/* 暗色 Lightbox：主图/A+放大查看 */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2"
            onClick={closeLightbox}
          >
            <X size={28} />
          </button>

          <div className="absolute top-8 left-8 text-gray-400 text-sm font-medium tracking-widest">
            {lightboxImageIndex + 1} / {(previewType === 'main' ? mainImages : currentAplusImages).length}
          </div>

          <button
            className="absolute left-2 md:left-6 text-gray-500 hover:text-white transition-colors p-4"
            onClick={(e) => { e.stopPropagation(); lightboxPrevImage(); }}
          >
            <ChevronLeft size={36} strokeWidth={1.5} />
          </button>

          <img
            src={(previewType === 'main' ? mainImages : currentAplusImages)[lightboxImageIndex]}
            alt="Enlarged view"
            className="max-h-[85vh] md:max-h-[90vh] max-w-[85vw] md:max-w-[90vw] object-contain select-none"
          />

          <button
            className="absolute right-2 md:right-6 text-gray-500 hover:text-white transition-colors p-4"
            onClick={(e) => { e.stopPropagation(); lightboxNextImage(); }}
          >
            <ChevronRight size={36} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </main>
  );
}

// ==========================================
// 登录模态框
// ==========================================
function LoginModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'hybzan5432') {
      localStorage.setItem('portfolio_logged_in', '1');
      onSuccess();
    } else {
      setError('密码错误，请重试');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-center mb-6">请输入管理员密码</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="输入密码..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#65d064] text-sm"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#65d064] hover:bg-[#58bd57] text-white py-3 rounded-xl font-semibold transition-colors"
          >
            确认
          </button>
        </form>
        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 图片预览模态框（点击放大查看）
// ==========================================
function ImagePreviewModal({ images, currentIndex, onClose, onNext, onPrev }) {
  return (
    <div
      className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* 上一张 */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}

      {/* 图片 */}
      <img
        src={images[currentIndex]}
        alt={`预览 ${currentIndex + 1}`}
        className="max-w-[92vw] max-h-[92vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 下一张 */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      {/* 页码指示器 */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
