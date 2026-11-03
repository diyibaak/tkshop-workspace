/* ==========================================================
   store.js · 数据层
   纯前端持久化（localStorage），可一键导出 JSON 备份
   ========================================================== */
(function () {
  'use strict';

  var KEY = 'tkshop.db.v1';
  var SESSION_USER = 'Boss';
  var AUTH_KEY = 'tkshop.auth.v1';
  var SESSION_KEY = 'tkshop.session.v1';

  /* 两个账号：boss=工作账户，root=管理后台账户 */
  var DEFAULT_ACCOUNTS = [
    { user: 'boss', name: 'Boss', role: 'user', pass: 'tkshop2026' },
    { user: 'root', name: 'root', role: 'admin', pass: 'root123' }
  ];

  function loadAccounts() {
    var raw = rawGet(AUTH_KEY);
    if (raw) { try { return JSON.parse(raw); } catch (e) {} }
    var def = DEFAULT_ACCOUNTS.map(function (a) { return Object.assign({}, a); });
    rawSet(AUTH_KEY, JSON.stringify(def));
    return def;
  }
  function saveAccounts(list) { rawSet(AUTH_KEY, JSON.stringify(list)); }

  function uid(prefix) {
    return (prefix || 'x') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function now() {
    var d = new Date();
    return today() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function daysAgo(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------------- 字段定义 helper ---------------- */
  function f(key, label, type, opts) {
    return Object.assign({ key: key, label: label, type: type || 'text' }, opts || {});
  }

  /* ---------------- 集合定义（驱动表格与表单） ---------------- */
  var SCHEMAS = {
    products: {
      label: '产品',
      prefix: 'p',
      icon: 'box',
      fields: [
        f('name', '产品名称', 'text', { required: true, full: true, placeholder: '例：Dave\'s Killer Bread' }),
        f('price', '售价 (USD)', 'number', { step: '0.01' }),
        f('stock', '库存', 'number'),
        f('dDemand', '需求', 'number', { min: 1, max: 5, step: 1, hint: '1-5 分' }),
        f('dContent', '可拍性', 'number', { min: 1, max: 5, step: 1, hint: '1-5 分' }),
        f('dMargin', '利润', 'number', { min: 1, max: 5, step: 1, hint: '1-5 分' }),
        f('notes', '备注', 'textarea', { full: true })
      ]
    },
    tests: {
      label: '测品批次',
      prefix: 't',
      icon: 'flask',
      fields: [
        f('name', '批次名称', 'text', { required: true, full: true, placeholder: '例：QKB 第 1 轮' }),
        f('product', '产品', 'text'),
        f('spend', '花费 (USD)', 'number', { step: '0.01' }),
        f('gmv', 'GMV (USD)', 'number', { step: '0.01' }),
        f('clicks', '点击', 'number'),
        f('orders', '单量', 'number'),
        f('verdict', '结论', 'textarea', { full: true, placeholder: '加投 / 换素材 / 砍掉，写清理由' })
      ]
    },
    scripts: {
      label: '脚本',
      prefix: 's',
      icon: 'script',
      fields: [
        f('scriptNo', '编号', 'text', { required: true, placeholder: '20261103-501' }),
        f('title', '脚本名称', 'text', { required: true }),
        f('hook', '前 3 秒钩子', 'text', { full: true }),
        f('descEn', '画面描述', 'textarea', { full: true }),
        f('copyEn', '英文口播', 'textarea', { full: true }),
        f('status', '状态', 'select', { options: ['草稿', '已定稿', '拍摄中', '已发布'] })
      ]
    },
    benchmarks: {
      label: '对标视频',
      prefix: 'b',
      icon: 'play',
      fields: [
        f('title', '视频标题 / 钩子', 'text', { required: true, full: true }),
        f('url', '链接', 'text', { full: true }),
        f('views', '播放量', 'number'),
        f('reusable', '可复用点', 'textarea', { full: true })
      ]
    },
    episodes: {
      label: '拍摄计划',
      prefix: 'e',
      icon: 'clapper',
      fields: [
        f('code', '编号', 'text', { required: true, placeholder: '20261103-001' }),
        f('title', '剧情名称', 'text', { required: true }),
        f('planDate', '拍摄日', 'date'),
        f('status', '状态', 'select', { options: ['筹备中', '拍摄中', '已杀青', '已归档'] })
      ]
    },
    shots: {
      label: '分镜素材',
      prefix: 'f',
      icon: 'film',
      fields: [
        f('shot', '分镜', 'text', { required: true, placeholder: 'S01 镜头01' }),
        f('episode', '所属剧情', 'text'),
        f('note', '镜头内容', 'textarea', { full: true }),
        f('status', '状态', 'select', { options: ['未审核', '已审核', '需补拍'] })
      ]
    },
    creators: {
      label: '达人',
      prefix: 'c',
      icon: 'users',
      fields: [
        f('handle', '达人账号', 'text', { required: true, placeholder: '@sarah.eats' }),
        f('name', '姓名 / 昵称', 'text'),
        f('followers', '粉丝数', 'number'),
        f('gmv', '带来 GMV (USD)', 'number', { step: '0.01' }),
        f('status', '状态', 'select', { options: ['待邀约', '已邀约', '已寄样', '已出片', '已结算', '已放弃'] }),
        f('note', '沟通记录', 'textarea', { full: true })
      ]
    },
    accounts: {
      label: 'TK 账号',
      prefix: 'a',
      icon: 'at',
      fields: [
        f('name', '账号名', 'text', { required: true }),
        f('role', '角色', 'select', { options: ['主账号', '矩阵号', '达人号', '品牌号'] }),
        f('owner', '负责人', 'text'),
        f('followers', '粉丝数', 'number'),
        f('status', '状态', 'select', { options: ['正常', '限流', '养号中', '已封禁'] })
      ]
    },
    ads: {
      label: '广告计划',
      prefix: 'ad',
      icon: 'target',
      fields: [
        f('name', '计划名称', 'text', { required: true, full: true }),
        f('product', '推广产品', 'text'),
        f('spend', '累计消耗 (USD)', 'number', { step: '0.01' }),
        f('gmv', '带来 GMV (USD)', 'number', { step: '0.01' }),
        f('status', '状态', 'select', { options: ['投放中', '已暂停', '已结束'] }),
        f('note', '优化动作', 'textarea', { full: true })
      ]
    },
    templates: {
      label: '拆解模板',
      prefix: 'tpl',
      icon: 'layers',
      fields: [
        f('name', '模板名称', 'text', { required: true }),
        f('content', '内容 / 动作清单', 'textarea', { full: true })
      ]
    },
    videos: {
      label: '视频',
      prefix: 'vid',
      icon: 'play',
      fields: [
        f('title', '视频标题', 'text', { required: true, full: true, placeholder: '例：我儿子只吃这一款面包' }),
        f('url', '链接', 'text', { full: true, placeholder: 'https://www.tiktok.com/@...' }),
        f('account', '发布账号', 'text'),
        f('product', '关联产品', 'text'),
        f('views', '播放量', 'number'),
        f('gmv', '转化 GMV (USD)', 'number', { step: '0.01' }),
        f('status', '状态', 'select', { options: ['拍摄中', '已发布', '已爆', '已下架'] })
      ]
    },
    members: {
      label: '成员',
      prefix: 'm',
      icon: 'shield',
      fields: [
        f('name', '姓名', 'text', { required: true }),
        f('role', '角色', 'select', { options: ['所有者', '运营', '剪辑', '达人 BD', '投手'] }),
        f('permission', '权限', 'select', { options: ['全部', '内容生产', '选品测品', '达人投放', '只读'] })
      ]
    }
  };

  /* ---------------- 种子数据 ---------------- */
  function seed() {
    var P = [
      { name: "Dave's Killer Bread - Organic Bread", sku: 'DKB-ORG-810', category: '食品', market: '美国', stage: '主推', price: 11.49, cost: 5.85, weight: 810, stock: 860, sold7d: 712, supplier: 'US Foods 直采', owner: 'Boss', dDemand: 5, dPrice: 4, dComp: 3, dContent: 5, dSupply: 4, dMargin: 4, notes: '21 种全谷物 + 无人工添加，内容端好讲“配料表干净”。' },
      { name: "Queen's Killer Bread - Organic Bread", sku: 'QKB-ORG-680', category: '食品', market: '美国', stage: '在库', price: 12.99, cost: 6.40, weight: 680, stock: 420, sold7d: 386, supplier: 'US Foods 直采', owner: 'Boss', dDemand: 5, dPrice: 3, dComp: 3, dContent: 5, dSupply: 4, dMargin: 4, notes: '与 DKB 同场景竞争，需错开价格带或主打“切片厚度”。' },
      { name: "Dave's Killer Bread Thins", sku: 'DKB-THN-425', category: '食品', market: '美国', stage: '在库', price: 9.99, cost: 5.10, weight: 425, stock: 240, sold7d: 188, supplier: 'US Foods 直采', owner: 'Boss', dDemand: 4, dPrice: 5, dComp: 4, dContent: 4, dSupply: 4, dMargin: 3, notes: '低卡人群切口，适合做“减脂早餐”主题。' },
      { name: 'Fattie High Quality Peanut Butter', sku: 'FTL-PNT-560', category: '食品', market: '美国', stage: '测品中', price: 13.99, cost: 6.90, weight: 560, stock: 60, sold7d: 43, supplier: 'Fattie 官方', owner: 'Boss', dDemand: 4, dPrice: 3, dComp: 4, dContent: 5, dSupply: 3, dMargin: 3, notes: '高蛋白花生酱，涂抹镜头出片率高；客单价偏高需测试。' },
      { name: 'Kirkland Signature Purified Water', sku: 'KS-WTR-480', category: '饮品', market: '美国', stage: '在库', price: 8.99, cost: 4.20, weight: 480, stock: 128, sold7d: 96, supplier: 'Costco 渠道', owner: 'Boss', dDemand: 5, dPrice: 4, dComp: 2, dContent: 2, dSupply: 5, dMargin: 2, notes: '重货 + 低毛利，只做凑单和复购，不建议主推。' },
      { name: "KIRKLAND Signature organic quinoa", sku: 'KS-QNO-1360', category: '食品', market: '美国', stage: '测品中', price: 16.99, cost: 9.20, weight: 1360, stock: 45, sold7d: 22, supplier: 'Costco 渠道', owner: 'Boss', dDemand: 3, dPrice: 2, dComp: 4, dContent: 3, dSupply: 3, dMargin: 3, notes: '健康主食，转化周期长，需要强内容教育。' },
      { name: "Nature's Path Organic Pumpkin Seed & Flax Granola", sku: 'NP-GRN-350', category: '食品', market: '美国', stage: '选品池', price: 10.99, cost: 5.50, weight: 350, stock: 0, sold7d: 0, supplier: '待确认', owner: 'Boss', dDemand: 3, dPrice: 4, dComp: 3, dContent: 4, dSupply: 2, dMargin: 3, notes: '包装颜值高，但供应商未锁，先放进选品池观察。' },
      { name: 'Great Value Purified Drinking Water', sku: 'GV-WTR-500', category: '饮品', market: '美国', stage: '选品池', price: 6.49, cost: 2.80, weight: 500, stock: 0, sold7d: 0, supplier: 'Walmart 渠道', owner: 'Boss', dDemand: 4, dPrice: 5, dComp: 1, dContent: 1, dSupply: 4, dMargin: 1, notes: '竞争极度激烈、无内容可拍，仅作价格锚点参考。' },
      { name: 'Simple Mills Almond Flour Crackers', sku: 'SM-CRK-120', category: '食品', market: '美国', stage: '已淘汰', price: 7.99, cost: 4.30, weight: 120, stock: 0, sold7d: 0, supplier: '待确认', owner: 'Boss', dDemand: 2, dPrice: 3, dComp: 2, dContent: 2, dSupply: 3, dMargin: 2, notes: '测过一轮，播放起不来、转化 <0.6%，已淘汰。' }
    ].map(function (p, i) {
      return Object.assign({ id: 'p_' + (i + 1), createdAt: daysAgo(30 - i * 2), notes: '' }, p);
    });

    var T = [
      { name: 'QKB 有机面包 · 第 1 轮', product: "Queen's Killer Bread", startDate: daysAgo(9), days: 7, budget: 1200, spend: 1106.0, views: 184000, clicks: 5120, orders: 341, gmv: 4429.6, refund: 3.2, status: '已通过', verdict: '转化率 6.7%，ROAS 16.0，可直接进主推；素材以“切片厚度 + 配料表”为主。' },
      { name: 'Fattie 花生酱 · 第 1 轮', product: 'Fattie High Quality Peanut Butter', startDate: daysAgo(6), days: 7, budget: 800, spend: 642.0, views: 96000, clicks: 2140, orders: 96, gmv: 1343.0, refund: 5.1, status: '待判定', verdict: '播放尚可但点击率 2.2% 偏低，问题在首帧与价格锚点，建议换钩子再测一轮。' },
      { name: 'Kirkland 藜麦 · 第 1 轮', product: 'KIRKLAND organic quinoa', startDate: daysAgo(4), days: 7, budget: 600, spend: 160.0, views: 52000, clicks: 890, orders: 22, gmv: 373.8, refund: 2.0, status: '进行中', verdict: '客单价高、决策链长，需 10 天以上观察，暂不判定。' },
      { name: 'Simple Mills 饼干 · 第 1 轮', product: 'Simple Mills Almond Flour Crackers', startDate: daysAgo(28), days: 7, budget: 180, spend: 174.0, views: 31000, clicks: 430, orders: 11, gmv: 87.9, refund: 9.0, status: '已淘汰', verdict: '转化 0.4%、退款 9%，内容与产品不匹配，砍。' }
    ].map(function (t, i) {
      return Object.assign({ id: 't_' + (i + 1) }, t);
    });

    var S = [
      { scriptNo: '20261006-501', date: '2026-10-06', type: '剧情', title: "Queen's Killer Bread Organic — Kitchen Table Story", product: "Queen's Killer Bread", descEn: 'Dave gives 7 reasons why this bread is the best. Whole-grain hero with the warm, funny neighbor.', copyEn: "My son won't eat bread unless it's this one. Seven reasons — I'll give you three.", hook: '前 3 秒直接把面包掰开露纹理，配“我儿子只吃这一款”', duration: 42, status: '已发布', owner: 'Boss' },
      { scriptNo: '20261006-502', date: '2026-10-06', type: '口播', title: "Dave's Killer Bread Thins — 100 Calorie Hook", product: "Dave's Killer Bread Thins", descEn: 'Talking head in a bright kitchen, holding the bag at chest height, quick cuts every 2s.', copyEn: '100 calories. 5g protein. And it actually tastes like bread.', hook: '把两片吐司压在手掌上：“这一整片，只有 100 卡。”', duration: 28, status: '已发布', owner: 'Boss' },
      { scriptNo: '20261006-503', date: '2026-10-06', type: '测评', title: 'Fattie Peanut Butter — Spoon Test', product: 'Fattie High Quality Peanut Butter', descEn: 'Close-up of spoon pulling a slow ribbon out of the jar, natural light from left.', copyEn: 'If your peanut butter drips like water, it is not peanut butter.', hook: '勺子挑起花生酱拉丝的慢镜头', duration: 35, status: '已定稿', owner: 'Boss' },
      { scriptNo: '20261006-504', date: '2026-10-06', type: '剧情', title: 'Great Value Purified Water — Fridge Restock', product: 'Great Value Purified Water', descEn: 'ASMR fridge restock, ice clinking, hands only.', copyEn: 'Restocking the fridge is my therapy. $6.49 for 24 bottles.', hook: 'ASMR 冰箱补货，冰块撞瓶声', duration: 22, status: '草稿', owner: 'Boss' },
      { scriptNo: '20261006-505', date: '2026-10-06', type: '剧情', title: 'Kirkland Purified Water — Costco Run', product: 'Kirkland Signature Purified Water', descEn: 'POV walking through Costco aisle, cart already loaded.', copyEn: 'Costco run, but I only came for one thing.', hook: '推着购物车冲进货架的第一视角', duration: 30, status: '已定稿', owner: 'Boss' },
      { scriptNo: '20261006-506', date: '2026-10-06', type: '测评', title: 'KIRKLAND Organic Quinoa — 5 Minute Lunch', product: 'KIRKLAND Signature organic quinoa', descEn: 'Hands-only cooking sequence, bowl assembly, overhead shot.', copyEn: 'Five minutes, four ingredients, one bowl that keeps me full till dinner.', hook: '倒计时 5 分钟，最后一秒端出成品', duration: 48, status: '已定稿', owner: 'Boss' },
      { scriptNo: '20261006-507', date: '2026-10-06', type: '口播', title: "Nature's Path Granola — Morning Routine", product: "Nature's Path Organic Pumpkin Seed & Flax Granola", descEn: 'Sunlit window, yogurt bowl build, soft focus background.', copyEn: 'My 6am routine takes four minutes. This is minute two.', hook: '早晨窗边光线 + 倒酸奶的声音', duration: 26, status: '草稿', owner: 'Boss' }
    ].map(function (s, i) {
      return Object.assign({ id: 's_' + (i + 1), notes: '' }, s);
    });

    var E = [
      { code: '20261006-001', title: "Queen's Killer Bread - 全流程", product: "Queen's Killer Bread", owner: 'Boss', planDate: '2026-10-06', shotCount: 6, status: '已杀青', notes: '棚拍 + 厨房实景，双机位。' },
      { code: '20261006-002', title: "Dave's Killer Bread Thins - 减脂早餐", product: "Dave's Killer Bread Thins", owner: 'Boss', planDate: '2026-10-09', shotCount: 6, status: '拍摄中', notes: '需要补一个秤重特写。' },
      { code: '20261103-001', title: 'Fattie 花生酱 - 拉丝特写', product: 'Fattie High Quality Peanut Butter', owner: 'Amy（剪辑）', planDate: '2026-11-05', shotCount: 4, status: '筹备中', notes: '等样品到位，需微距镜头。' }
    ].map(function (e, i) { return Object.assign({ id: 'e_' + (i + 1) }, e); });

    var shotRows = [
      ['20261006-001', 'S01 镜头01', '剧情-拍摄1', "20261006-001 Queen's Killer Bread - 全流程", '已审核', '拆包装 · 取出整条面包'],
      ['20261006-001', 'S01 镜头02', '剧情-拍摄1', "20261006-001 Queen's Killer Bread - 全流程", '已审核', '手撕面包 · 展示内部纹理'],
      ['20261006-001', 'S01 镜头03', '剧情-拍摄1', "20261006-001 Queen's Killer Bread - 全流程", '已审核', '抹黄油特写 · 慢速推近'],
      ['20261006-001', 'S01 镜头04', '剧情-拍摄1', "20261006-001 Queen's Killer Bread - 全流程", '未审核', '配料表翻面 · 手指逐行指读'],
      ['20261006-001', 'S01 镜头05', '剧情-补拍', "20261006-001 Queen's Killer Bread - 全流程", '需补拍', '早餐桌俯拍 · 逆光，画面过曝'],
      ['20261006-001', 'S01 镜头06', '剧情-补拍', "20261006-001 Queen's Killer Bread - 全流程", '未审核', '人物吃第一口 · 反应镜头'],
      ['20261006-002', 'S01 镜头01', '剧情-拍摄2', "20261006-002 Dave's Killer Bread Thins - 减脂早餐", '未审核', '秤重镜头 · 显示 100 卡'],
      ['20261006-002', 'S01 镜头02', '剧情-拍摄2', "20261006-002 Dave's Killer Bread Thins - 减脂早餐", '已审核', '两片吐司对压 · 手掌比例'],
      ['20261006-002', 'S01 镜头03', '剧情-拍摄2', "20261006-002 Dave's Killer Bread Thins - 减脂早餐", '已审核', '抹牛油果 · 抹刀特写'],
      ['20261006-002', 'S01 镜头04', '剧情-拍摄2', "20261006-002 Dave's Killer Bread Thins - 减脂早餐", '未审核', '成品摆盘 · 侧逆光'],
      ['20261006-002', 'S01 镜头05', '剧情-拍摄2', "20261006-002 Dave's Killer Bread Thins - 减脂早餐", '未审核', '包装袋入画 · 品牌露出'],
      ['20261006-002', 'S01 镜头06', '剧情-拍摄2', "20261006-002 Dave's Killer Bread Thins - 减脂早餐", '已审核', '收尾空镜 · 桌面残留']
    ];
    var SH = shotRows.map(function (r, i) {
      return { id: 'f_' + (i + 1), episode: r[0], shot: r[1], lib: r[2], file: r[3], status: r[4], note: r[5], uploadedAt: '2026-10-06 12:06' };
    });

    var C = [
      { handle: '@sarah.eats', name: 'Sarah M.', followers: 128000, category: '食品测评', region: '美国', email: 'sarah@creator.co', rate: 450, status: '已出片', videos: 2, gmv: 3180, note: '内容质量高，回复快，可长期合作。' },
      { handle: '@kitchenwithjay', name: 'Jay R.', followers: 86000, category: '生活方式', region: '美国', email: 'jay.creator@gmail.com', rate: 300, status: '已寄样', videos: 0, gmv: 0, note: '已签收样品，约定 11/06 前出片。' },
      { handle: '@momofthree', name: 'Emily K.', followers: 210000, category: '母婴', region: '美国', email: 'emily@familyblog.com', rate: 800, status: '已邀约', videos: 0, gmv: 0, note: '报价偏高，等第一轮数据再谈。' },
      { handle: '@fitfoodie.mia', name: 'Mia L.', followers: 54000, category: '健身', region: '美国', email: 'mia.fit@outlook.com', rate: 220, status: '待邀约', videos: 0, gmv: 0, note: '适合 Thins 低卡线，先发一份 brief。' },
      { handle: '@pantryraid', name: 'Chris D.', followers: 41000, category: '开箱', region: '美国', email: 'chris@pantryraid.co', rate: 180, status: '已结算', videos: 1, gmv: 640, note: '性价比不错，ROI 正常，可复投。' },
      { handle: '@dailybitehub', name: 'Nina P.', followers: 330000, category: '食品测评', region: '美国', email: 'nina@dailybitehub.com', rate: 1200, status: '已放弃', videos: 0, gmv: 0, note: '要求独家 + 高报价，投入产出不成立。' }
    ].map(function (c, i) { return Object.assign({ id: 'c_' + (i + 1) }, c); });

    var A = [
      { name: '@killerkitchen.us', role: '主账号', owner: 'Boss', position: '有机食品 / 家庭场景', device: 'iPhone 15 Pro · 美国节点', followers: 48200, status: '正常', note: '每天 1-2 条，GMV 主力来源。' },
      { name: '@pantrystocks', role: '矩阵号', owner: 'Amy（剪辑）', position: '囤货 / 补货 ASMR', device: 'iPhone 13 · 美国节点', followers: 12400, status: '正常', note: '跑量号，素材复用主账号。' },
      { name: '@thins.lowcarb', role: '矩阵号', owner: 'Amy（剪辑）', position: '低卡主食', device: 'iPhone 13 · 美国节点', followers: 6800, status: '养号中', note: '新号第 3 周，先养后投。' },
      { name: '@boss.direct', role: '品牌号', owner: 'Boss', position: '官方声明 / 售后', device: 'Mac · 美国节点', followers: 3100, status: '正常', note: '只发官方内容，不参与带货。' }
    ].map(function (a, i) { return Object.assign({ id: 'a_' + (i + 1) }, a); });

    var AD = [
      { name: 'QKB 有机面包 · GMV Max 起量', type: 'GMV Max', product: "Queen's Killer Bread", startDate: daysAgo(12), budget: 120, spend: 1344.0, gmv: 4820.0, status: '投放中', note: 'ROAS 3.6，稳定；素材每周换 2 条防疲劳。' },
      { name: 'DKB Thins · 低卡人群定向', type: '视频推广', product: "Dave's Killer Bread Thins", startDate: daysAgo(7), budget: 60, spend: 402.5, gmv: 910.0, status: '投放中', note: 'ROAS 2.3，点击率高但转化偏低，优化详情页。' },
      { name: 'Fattie 花生酱 · 素材测试', type: '商品卡', product: 'Fattie High Quality Peanut Butter', startDate: daysAgo(5), budget: 40, spend: 168.0, gmv: 320.0, status: '已暂停', note: 'ROAS 1.9 未达阈值，先停，等新素材。' }
    ].map(function (a, i) { return Object.assign({ id: 'ad_' + (i + 1) }, a); });

    var B = [
      { title: '“我儿子只吃这一款面包” — 3 秒钩子开头', url: 'https://www.tiktok.com/@example/video/1', account: '@breadlab', followers: 240000, views: 1800000, likes: 96000, category: '食品', breakdown: '钩子用家庭冲突起手，第 4 秒给出产品特写；中段连续 5 个特写镜头，节奏 1.2 秒/镜；结尾用价格对比收口。', reusable: '冲突式开头 + 配料表逐行指读 + 结尾限时价' },
      { title: 'Costco 补货 ASMR，全程无人声', url: 'https://www.tiktok.com/@example/video/2', account: '@restockqueen', followers: 890000, views: 4200000, likes: 210000, category: '食品', breakdown: '纯环境音 + 快剪，适合做矩阵号跑量；单条可拆 6-8 条二次素材。', reusable: '开袋声 / 冰块声 / 纸箱摩擦声 三段式音效结构' },
      { title: '100 卡吐司实测：秤给你看', url: 'https://www.tiktok.com/@example/video/3', account: '@fitfoodie', followers: 120000, views: 760000, likes: 38000, category: '食品', breakdown: '用“实测”建立可信度，秤重动作放在第 2 秒，避免前 3 秒流失。', reusable: '实测动作前置 + 数字字幕固定在右上角' },
      { title: '花生酱拉丝慢镜头，无口播', url: 'https://www.tiktok.com/@example/video/4', account: '@spoonful', followers: 320000, views: 2100000, likes: 140000, category: '食品', breakdown: '纯视觉说服，适合做“品质感”心智；转化靠评论区置顶链接。', reusable: '微距 + 逆光 + 慢速 0.5x' }
    ].map(function (b, i) { return Object.assign({ id: 'b_' + (i + 1) }, b); });

    var TPL = [
      { name: '食品类 · 3 秒钩子词库', kind: '拆解词模板', category: '食品', content: '“I was today years old when I found out…”\n“Stop buying X until you watch this.”\n“Three reasons this costs less than your coffee.”\n“My kid refuses to eat anything else.”', useCount: 18 },
      { name: '配料表指读动作', kind: '拆解动作库', category: '食品', content: '1. 手指从第一行开始缓慢下移\n2. 关键成分停下 0.5 秒并敲一下\n3. 镜头推到成分名占满画面\n4. 切回人物点头', useCount: 12 },
      { name: '开袋 / 拆封 5 连拍', kind: '拆解动作库', category: '通用', content: '正面平铺 → 撕口特写 → 抽出产品 → 手托展示 → 俯拍全貌', useCount: 24 },
      { name: '口播脚本骨架（25 秒）', kind: '剪辑脚本库', category: '通用', content: '0-3s 反常识断言\n3-8s 产品特写 + 价格\n8-16s 三个卖点快切\n16-22s 使用场景\n22-25s CTA + 限时信息', useCount: 9 }
    ].map(function (t, i) { return Object.assign({ id: 'tpl_' + (i + 1) }, t); });

    var M = [
      { name: 'Boss', role: '所有者', scope: '全盘', permission: '全部', note: '账号与资金权限唯一持有人。' },
      { name: 'Amy', role: '剪辑', scope: '脚本 → 素材 → 成片', permission: '内容生产', note: '负责分镜审核与成片交付。' },
      { name: '李维', role: '达人 BD', scope: '达人邀约 / 寄样 / 履约', permission: '达人投放', note: '每周一更新达人池状态。' }
    ].map(function (m, i) { return Object.assign({ id: 'm_' + (i + 1) }, m); });

    var V = [
      { title: "我儿子只吃这一款面包", url: 'https://www.tiktok.com/@killerkitchen.us/video/1', account: '@killerkitchen.us', product: "Queen's Killer Bread", views: 1280000, gmv: 3410, status: '已爆', date: daysAgo(12) },
      { title: '100 卡吐司 · 手掌称重', url: 'https://www.tiktok.com/@killerkitchen.us/video/2', account: '@killerkitchen.us', product: "Dave's Killer Bread Thins", views: 640000, gmv: 1120, status: '已发布', date: daysAgo(6) },
      { title: '花生酱拉丝特写', url: 'https://www.tiktok.com/@pantrystocks/video/3', account: '@pantrystocks', product: 'Fattie High Quality Peanut Butter', views: 92000, gmv: 210, status: '已发布', date: daysAgo(3) },
      { title: 'Costco 藜麦 5 分钟午餐', url: '', account: '@thins.lowcarb', product: 'KIRKLAND organic quinoa', views: 0, gmv: 0, status: '拍摄中', date: daysAgo(1) }
    ].map(function (v, i) { return Object.assign({ id: 'vid_' + (i + 1) }, v); });

    return {
      products: P, tests: T, scripts: S, episodes: E, shots: SH,
      creators: C, accounts: A, ads: AD, benchmarks: B, templates: TPL, members: M, videos: V,
      logs: [
        { id: uid('l'), time: now(), user: SESSION_USER, action: '系统初始化', target: '导入首轮货盘与脚本数据' },
        { id: uid('l'), time: '2026-11-02 18:40', user: 'Amy', action: '审核素材', target: "20261006-001 Queen's Killer Bread S01 镜头03 → 已审核" },
        { id: uid('l'), time: '2026-11-01 10:12', user: '李维', action: '更新达人', target: '@kitchenwithjay → 已寄样' }
      ]
    };
  }

  /* ---------------- 读写 ---------------- */
  var cache = null;
  var memory = {};
  var storageOK = true;

  function rawGet(k) {
    try { return localStorage.getItem(k); } catch (e) { storageOK = false; return memory[k] || null; }
  }
  function rawSet(k, v) {
    try { localStorage.setItem(k, v); return true; }
    catch (e) { storageOK = false; memory[k] = v; return false; }
  }

  function load() {
    if (cache) return cache;
    var raw = rawGet(KEY);
    try {
      cache = raw ? JSON.parse(raw) : seed();
    } catch (e) {
      cache = seed();
    }
    if (!cache || typeof cache !== 'object') cache = seed();
    return cache;
  }
  function persist() {
    rawSet(KEY, JSON.stringify(cache));
    return storageOK;
  }

  var Store = {
    schema: function (coll) { return SCHEMAS[coll]; },
    schemas: SCHEMAS,
    all: function (coll) { var d = load(); return (d[coll] || []).slice(); },
    get: function (coll, id) { return (load()[coll] || []).filter(function (r) { return r.id === id; })[0] || null; },
    count: function (coll) { return (load()[coll] || []).length; },
    save: function (coll, record) {
      var d = load();
      d[coll] = d[coll] || [];
      if (record.id) {
        var idx = d[coll].findIndex(function (r) { return r.id === record.id; });
        var old = idx > -1 ? d[coll][idx] : null;
        if (idx > -1) d[coll][idx] = Object.assign({}, d[coll][idx], record);
        else d[coll].push(record);
        Store.log('更新' + (SCHEMAS[coll] ? SCHEMAS[coll].label : ''),
          record.name || record.title || record.scriptNo ||
          (old && (old.name || old.title || old.scriptNo)) || record.id);
      } else {
        record.id = uid((SCHEMAS[coll] && SCHEMAS[coll].prefix) || 'r');
        record.createdAt = record.createdAt || today();
        d[coll].unshift(record);
        Store.log('新增' + (SCHEMAS[coll] ? SCHEMAS[coll].label : ''), record.name || record.title || record.scriptNo || record.id);
      }
      persist();
      return record;
    },
    remove: function (coll, id) {
      var d = load();
      var row = (d[coll] || []).filter(function (r) { return r.id === id; })[0];
      d[coll] = (d[coll] || []).filter(function (r) { return r.id !== id; });
      persist();
      if (row) Store.log('删除' + (SCHEMAS[coll] ? SCHEMAS[coll].label : ''), row.name || row.title || row.scriptNo || id);
      return true;
    },
    log: function (action, target) {
      var d = load();
      d.logs = d.logs || [];
      d.logs.unshift({ id: uid('l'), time: now(), user: Store.user(), action: action, target: target || '' });
      if (d.logs.length > 400) d.logs.length = 400;
      persist();
    },
    user: function () { var s = Store.session(); return (s && s.name) || SESSION_USER; },
    reset: function () { cache = seed(); persist(); },
    exportJSON: function () { return JSON.stringify(load(), null, 2); },
    importJSON: function (text) {
      var obj = JSON.parse(text);
      if (!obj || typeof obj !== 'object') throw new Error('格式不正确');
      cache = obj;
      persist();
      return true;
    },
    storageUsed: function () {
      var v = rawGet(KEY) || '';
      return v.length;
    },
    storageOK: function () { load(); return storageOK; },

    /* ---------------- 登录 / 账号 ---------------- */
    session: function () {
      var raw = rawGet(SESSION_KEY);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    },
    isAdmin: function () { var s = Store.session(); return !!(s && s.role === 'admin'); },
    login: function (u, p) {
      var list = loadAccounts();
      var acc = list.filter(function (a) { return a.user === u && a.pass === p; })[0];
      if (!acc) return { ok: false };
      var sess = { user: acc.user, name: acc.name, role: acc.role, at: now() };
      rawSet(SESSION_KEY, JSON.stringify(sess));
      Store.log('登录系统', acc.user + (acc.role === 'admin' ? '（管理后台）' : '（工作账户）'));
      return { ok: true, role: acc.role, name: acc.name };
    },
    logout: function () {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
      rawSet(SESSION_KEY, ''); // 兼容“禁用 localStorage”时的内存兜底，确保会话被清空
    },
    authAccounts: function () {
      return loadAccounts().map(function (a) { var c = Object.assign({}, a); delete c.pass; return c; });
    },
    changePassword: function (user, np) {
      var list = loadAccounts();
      var acc = list.filter(function (a) { return a.user === user; })[0];
      if (!acc) return false;
      acc.pass = np;
      saveAccounts(list);
      Store.log('修改密码', user);
      return true;
    }
  };

  /* ---------------- 业务计算 ---------------- */
  var WEIGHTS = { dDemand: 40, dContent: 35, dMargin: 25 };

  function scoreOf(p) {
    var total = 0, wsum = 0;
    Object.keys(WEIGHTS).forEach(function (k) {
      var v = Number(p[k]);
      if (!isNaN(v) && v > 0) { total += v * WEIGHTS[k]; wsum += WEIGHTS[k]; }
    });
    if (!wsum) return null;
    return Math.round((total / wsum) / 5 * 1000) / 10; // 0-100
  }
  function roiOf(row) {
    var spend = Number(row.spend) || 0, gmv = Number(row.gmv) || 0;
    return spend > 0 ? Math.round(gmv / spend * 100) / 100 : 0;
  }
  function ctrOf(row) {
    var v = Number(row.views) || 0, c = Number(row.clicks) || 0;
    return v > 0 ? Math.round(c / v * 10000) / 100 : 0; // %
  }
  function cvrOf(row) {
    var c = Number(row.clicks) || 0, o = Number(row.orders) || 0;
    return c > 0 ? Math.round(o / c * 10000) / 100 : 0;
  }
  function judge(row) {
    // 测品判定口径：ROI≥3 且转化率≥3% 通过；ROI<2 或转化<1.5% 淘汰
    var roi = roiOf(row), cvr = cvrOf(row);
    if (!roi) return { text: '数据不足', tone: 'gray' };
    if (roi >= 3 && cvr >= 3) return { text: '通过', tone: 'mint' };
    if (roi < 2 || cvr < 1.5) return { text: '淘汰', tone: 'danger' };
    return { text: '观察', tone: 'amber' };
  }

  window.Store = Store;
  window.Biz = {
    WEIGHTS: WEIGHTS, scoreOf: scoreOf, roiOf: roiOf,
    ctrOf: ctrOf, cvrOf: cvrOf, judge: judge
  };
  window.Util = { uid: uid, today: today, now: now, daysAgo: daysAgo };
})();
