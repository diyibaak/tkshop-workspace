/* ==========================================================
   pages.js · 极简版业务页面
   原则：4 个入口；每页一排胶囊；表格最多 4 列
   ========================================================== */
(function () {
  'use strict';

  var esc = UI.esc, num = UI.num, money = UI.money, tag = UI.tag, icon = UI.icon;
  var PAGES = {};

  function div(cls, html) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    if (html) d.innerHTML = html;
    return d;
  }
  function clamp(text, w) {
    return '<div style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:' + (w || 340) + 'px;color:var(--ink2)">' + esc(text || '—') + '</div>';
  }
  function main(text, sub) {
    return '<div class="cell-main">' + esc(text) + '</div>' + (sub ? '<div class="cell-sub">' + esc(sub) + '</div>' : '');
  }

  /* 页面外壳：顶部一排胶囊，切换下面整块内容 */
  function shell(segs, params) {
    var root = div('');
    var bar = div('seg', '');
    var body = div('');
    bar.style.marginBottom = '14px';

    var start = 0;
    var want = params && params.get ? params.get('s') : null;
    if (want != null && want !== '' && !isNaN(Number(want))) {
      start = Math.min(Number(want), segs.length - 1);
    }

    function show(i) {
      Array.prototype.forEach.call(bar.children, function (x, k) {
        x.classList.toggle('on', k === i);
      });
      body.innerHTML = '';
      body.appendChild(segs[i].build());
    }

    segs.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = s.label;
      b.onclick = function () { show(i); };
      bar.appendChild(b);
    });

    root.appendChild(bar);
    root.appendChild(body);
    show(start);
    return root;
  }

  /* ============================================================
     工作台
     ============================================================ */
  function dashboard() {
    var hour = new Date().getHours();
    var greet = hour < 6 ? '凌晨好' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 19 ? '下午好' : '晚上好';

    var root = div('');
    var hero = div('hero', '');
    hero.innerHTML = '<h1>' + greet + '，' + esc(Store.user()) + '</h1>' +
      '<p>选品 · 测品 · 内容 · 达人 · 广告，一处搞定。</p>';
    root.appendChild(hero);
    root.appendChild(div('section-title', '开始工作'));

    var tools = [
      { hash: '#/selection', ico: 'box', title: '选品库', desc: '打分判断值不值得做' },
      { hash: '#/testing', ico: 'flask', title: '测品', desc: '数据到线就自动判定' },
      { hash: '#/content?s=0', ico: 'script', title: '脚本库', desc: '钩子 + 画面 + 文案' },
      { hash: '#/content?s=5', ico: 'play', title: '视频', desc: '追踪自己的发布与转化' },
      { hash: '#/content?s=4', ico: 'film', title: '分镜素材', desc: '审过才能进剪辑' },
      { hash: '#/creators?s=0', ico: 'users', title: '达人管理', desc: '邀约到结算一路推' },
      { hash: '#/creators?s=2', ico: 'target', title: '广告', desc: 'ROAS 低于 2 就提醒' }
    ];

    var grid = div('tool-grid', '');
    tools.forEach(function (t) {
      var card = div('tool-card', '');
      card.innerHTML =
        '<div class="tool-top"><div class="tool-ico">' + icon(t.ico, 16) + '</div></div>' +
        '<div class="tool-title">' + t.title + '</div>' +
        '<div class="tool-desc">' + t.desc + '</div>';
      card.onclick = function () { location.hash = t.hash; };
      grid.appendChild(card);
    });
    root.appendChild(grid);
    return root;
  }

  /* ============================================================
     选品
     ============================================================ */
  function selectionTable(stage) {
    var t = UI.DataTable({
      collection: 'products',
      baseFilter: stage ? function (p) { return p.stage === stage; } : null,
      searchPlaceholder: '搜产品 / SKU',
      searchKeys: ['name', 'sku', 'notes'],
      newLabel: '新增',
      onNew: function () { UI.openForm('products', stage ? { stage: stage } : null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'name', label: '产品', render: function (r) { return main(r.name, r.sku || r.category); } },
        { key: 'price', label: '售价', align: 'right', className: 'num', render: function (r) { return money(r.price); } },
        {
          key: 'score', label: '评分', width: '180px', render: function (r) {
            var s = Biz.scoreOf(r);
            if (s == null) return '<span style="color:var(--muted)">未打分</span>';
            var tone = s >= 80 ? 'mint' : s >= 60 ? 'amber' : 'gray';
            return UI.meter(s, 100, null) + '<div class="cell-sub" style="margin-left:0">' + tag(s >= 80 ? '高潜' : s >= 60 ? '可测' : '观察', tone) + '</div>';
          }
        }
      ],
      rowExtra: function (r) {
        return r.stage === '选品池'
          ? '<button class="icon-btn" data-row-act="promote" title="移入在库">' + icon('check', 14) + '</button>' : '';
      },
      onRowAction: function (act, row, refresh) {
        if (act !== 'promote') return;
        Store.save('products', { id: row.id, stage: '在库' });
        UI.toast('已移入在库');
        refresh();
      }
    });
    return t.el;
  }

  function selectionPage(params) {
    return shell([
      { label: '全部', build: function () { return selectionTable(''); } },
      { label: '选品池', build: function () { return selectionTable('选品池'); } },
      { label: '在库', build: function () { return selectionTable('在库'); } },
      { label: '测品中', build: function () { return selectionTable('测品中'); } },
      { label: '主推', build: function () { return selectionTable('主推'); } }
    ], params);
  }

  /* ============================================================
     测品
     ============================================================ */
  function testingTable(status) {
    var t = UI.DataTable({
      collection: 'tests',
      baseFilter: status ? function (x) { return x.status === status; } : null,
      searchPlaceholder: '搜批次 / 产品',
      searchKeys: ['name', 'product', 'verdict'],
      newLabel: '新建',
      onNew: function () { UI.openForm('tests', status ? { status: status } : null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'name', label: '批次', render: function (r) { return main(r.name, r.product); } },
        {
          key: 'roi', label: 'ROI', align: 'right', className: 'num', render: function (r) {
            var v = Biz.roiOf(r);
            return '<span class="cell-strong" style="color:' + (v >= 3 ? 'var(--mint)' : v >= 2 ? 'var(--amber)' : 'var(--danger)') + '">' + (v || '—') + '</span>';
          }
        },
        { key: 'cvr', label: '转化', align: 'right', className: 'num', render: function (r) { return UI.pct(Biz.cvrOf(r)); } },
        { key: 'judge', label: '判定', render: function (r) { var j = Biz.judge(r); return tag(j.text, j.tone); } }
      ],
      rowExtra: function (r) {
        return r.verdict ? '<button class="icon-btn" data-row-act="verdict" title="看结论">' + icon('script', 14) + '</button>'
          : '<button class="icon-btn" data-row-act="verdict" title="写结论">' + icon('spark', 14) + '</button>';
      },
      onRowAction: function (act, row, refresh) {
        if (act !== 'verdict') return;
        var j = Biz.judge(row);
        UI.openModal({
          title: row.name,
          sub: '系统判定：' + j.text,
          body: '<div class="field"><label>人工结论</label><textarea class="textarea" id="verdict" placeholder="继续加投 / 优化素材 / 砍掉，写清理由">' + esc(row.verdict || '') + '</textarea></div>',
          buttons: [
            { label: '关闭' },
            {
              label: '保存', primary: true, onClick: function (w) {
                Store.save('tests', {
                  id: row.id,
                  verdict: w.querySelector('#verdict').value.trim(),
                  status: j.text === '通过' ? '已通过' : j.text === '淘汰' ? '已淘汰' : '待判定'
                });
                UI.toast('已保存');
                refresh();
              }
            }
          ]
        });
      }
    });
    return t.el;
  }

  function testingPage(params) {
    return shell([
      { label: '全部', build: function () { return testingTable(''); } },
      { label: '进行中', build: function () { return testingTable('进行中'); } },
      { label: '待判定', build: function () { return testingTable('待判定'); } },
      { label: '已通过', build: function () { return testingTable('已通过'); } },
      { label: '已淘汰', build: function () { return testingTable('已淘汰'); } }
    ], params);
  }

  /* ============================================================
     内容：脚本 / 对标 / 模板 / 拍摄 / 分镜
     ============================================================ */
  function exportScript(s) {
    UI.printHTML('脚本 · ' + s.scriptNo,
      '<h1>' + esc(s.title) + '</h1>' +
      '<div class="meta">' + esc(s.scriptNo) + ' · ' + esc(s.type) + ' · ' + esc(s.product || '') + '</div>' +
      '<h2>前 3 秒钩子</h2><div class="block">' + esc(s.hook || '—') + '</div>' +
      '<h2>画面描述</h2><div class="block">' + esc(s.descEn || '—') + '</div>' +
      '<h2>英文口播</h2><div class="block">' + esc(s.copyEn || '—') + '</div>');
  }

  function scriptsTable() {
    var t = UI.DataTable({
      collection: 'scripts',
      searchPlaceholder: '搜编号 / 名称',
      searchKeys: ['scriptNo', 'title', 'product', 'descEn', 'copyEn', 'hook'],
      newLabel: '新增',
      onNew: function () { UI.openForm('scripts', null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'scriptNo', label: '编号', render: function (r) { return main(r.scriptNo, r.date); } },
        { key: 'title', label: '脚本', render: function (r) { return main(r.title, r.product); } },
        { key: 'status', label: '状态', render: function (r) { return tag(r.status, UI.statusTone(r.status)); } }
      ],
      rowExtra: function () { return '<button class="icon-btn" data-row-act="pdf" title="导出 PDF">' + icon('download', 14) + '</button>'; },
      onRowAction: function (act, row) { if (act === 'pdf') exportScript(row); }
    });
    return t.el;
  }

  function benchmarksTable() {
    var t = UI.DataTable({
      collection: 'benchmarks',
      searchPlaceholder: '搜标题 / 账号',
      searchKeys: ['title', 'account', 'breakdown', 'reusable'],
      newLabel: '新增',
      onNew: function () { UI.openForm('benchmarks', null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'title', label: '视频', render: function (r) { return main(r.title, r.account); } },
        { key: 'views', label: '播放', align: 'right', className: 'num', width: '110px', render: function (r) { return num(r.views); } },
        { key: 'reusable', label: '可复用点', render: function (r) { return clamp(r.reusable, 420); } }
      ],
      rowExtra: function (r) {
        return r.url ? '<a class="icon-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener" title="打开">' + icon('arrow', 14) + '</a>' : '';
      }
    });
    return t.el;
  }

  function templatesTable() {
    var t = UI.DataTable({
      collection: 'templates',
      searchPlaceholder: '搜模板',
      searchKeys: ['name', 'content', 'kind'],
      newLabel: '新增',
      onNew: function () { UI.openForm('templates', null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'name', label: '模板', render: function (r) { return main(r.name, r.kind); } },
        { key: 'content', label: '内容', render: function (r) { return '<div style="white-space:pre-wrap;max-width:620px;color:var(--ink2);font-size:12.6px">' + esc(r.content || '') + '</div>'; } }
      ]
    });
    return t.el;
  }

  function episodesTable() {
    var t = UI.DataTable({
      collection: 'episodes',
      searchPlaceholder: '搜编号 / 名称',
      searchKeys: ['code', 'title', 'product', 'owner'],
      newLabel: '新增',
      onNew: function () { UI.openForm('episodes', null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'code', label: '编号', width: '130px' },
        { key: 'title', label: '剧情', render: function (r) { return main(r.title, r.product); } },
        { key: 'status', label: '状态', render: function (r) { return tag(r.status, UI.statusTone(r.status)); } }
      ]
    });
    return t.el;
  }

  function shotsTable() {
    var t = UI.DataTable({
      collection: 'shots',
      searchPlaceholder: '搜分镜 / 文件',
      searchKeys: ['episode', 'shot', 'file', 'note'],
      newLabel: '上传',
      onNew: function () { UI.openForm('shots', { uploadedAt: Util.now() }, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'shot', label: '分镜', width: '150px', render: function (r) { return main(r.shot || '—', r.episode); } },
        { key: 'note', label: '内容', render: function (r) { return clamp(r.note, 420); } },
        { key: 'status', label: '状态', render: function (r) { return tag(r.status, UI.statusTone(r.status)); } }
      ],
      rowExtra: function (r) {
        return r.status === '已审核' ? '' : '<button class="icon-btn" data-row-act="approve" title="审核通过">' + icon('check', 14) + '</button>';
      },
      onRowAction: function (act, row, refresh) {
        if (act !== 'approve') return;
        Store.save('shots', { id: row.id, status: '已审核' });
        UI.toast('已通过');
        refresh();
      }
    });
    return t.el;
  }

  function videosTable() {
    var t = UI.DataTable({
      collection: 'videos',
      searchPlaceholder: '搜标题 / 账号 / 产品',
      searchKeys: ['title', 'account', 'product', 'url'],
      newLabel: '新增',
      onNew: function () { UI.openForm('videos', null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'title', label: '视频', render: function (r) { return main(r.title, r.account); } },
        { key: 'views', label: '播放', align: 'right', className: 'num', width: '120px', render: function (r) { return num(r.views); } },
        { key: 'gmv', label: '转化 GMV', align: 'right', className: 'num', width: '130px', render: function (r) { return '<span class="cell-strong">' + money(r.gmv) + '</span>'; } },
        { key: 'status', label: '状态', render: function (r) { return tag(r.status, UI.statusTone(r.status)); } }
      ],
      rowExtra: function (r) {
        return r.url ? '<a class="icon-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener" title="打开">' + icon('arrow', 14) + '</a>' : '';
      }
    });
    return t.el;
  }

  function contentPage(params) {
    return shell([
      { label: '脚本', build: scriptsTable },
      { label: '对标视频', build: benchmarksTable },
      { label: '拆解模板', build: templatesTable },
      { label: '拍摄计划', build: episodesTable },
      { label: '分镜素材', build: shotsTable },
      { label: '视频', build: videosTable }
    ], params);
  }

  /* ============================================================
     达人 / 账号 / 广告
     ============================================================ */
  var CREATOR_FLOW = ['待邀约', '已邀约', '已寄样', '已出片', '已结算'];

  function creatorsTable() {
    var t = UI.DataTable({
      collection: 'creators',
      searchPlaceholder: '搜账号 / 姓名',
      searchKeys: ['handle', 'name', 'category', 'note'],
      newLabel: '新增',
      onNew: function () { UI.openForm('creators', null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'handle', label: '达人', render: function (r) { return main(r.handle, r.name); } },
        { key: 'followers', label: '粉丝', align: 'right', className: 'num', width: '110px', render: function (r) { return num(r.followers); } },
        { key: 'status', label: '状态', render: function (r) { return tag(r.status, UI.statusTone(r.status)); } },
        { key: 'gmv', label: 'GMV', align: 'right', className: 'num', width: '120px', render: function (r) { return '<span class="cell-strong">' + money(r.gmv) + '</span>'; } }
      ],
      rowExtra: function (r) {
        var i = CREATOR_FLOW.indexOf(r.status);
        return (i > -1 && i < CREATOR_FLOW.length - 1)
          ? '<button class="icon-btn" data-row-act="advance" title="推进到下一状态">' + icon('arrow', 14) + '</button>' : '';
      },
      onRowAction: function (act, row, refresh) {
        if (act !== 'advance') return;
        var next = CREATOR_FLOW[CREATOR_FLOW.indexOf(row.status) + 1];
        Store.save('creators', { id: row.id, status: next });
        UI.toast(row.handle + ' → ' + next);
        refresh();
      }
    });
    return t.el;
  }

  function accountsTable() {
    var t = UI.DataTable({
      collection: 'accounts',
      searchPlaceholder: '搜账号',
      searchKeys: ['name', 'role', 'owner', 'position'],
      newLabel: '新增',
      onNew: function () { UI.openForm('accounts', null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'name', label: '账号', render: function (r) { return main(r.name, r.role || r.position); } },
        { key: 'owner', label: '负责人', width: '130px' },
        { key: 'followers', label: '粉丝', align: 'right', className: 'num', width: '110px', render: function (r) { return num(r.followers); } },
        { key: 'status', label: '状态', render: function (r) { return tag(r.status, UI.statusTone(r.status)); } }
      ]
    });
    return t.el;
  }

  function adsTable() {
    var t = UI.DataTable({
      collection: 'ads',
      searchPlaceholder: '搜计划 / 产品',
      searchKeys: ['name', 'product', 'note'],
      newLabel: '新建',
      onNew: function () { UI.openForm('ads', null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'name', label: '计划', render: function (r) { return main(r.name, r.product); } },
        { key: 'spend', label: '消耗', align: 'right', className: 'num', width: '110px', render: function (r) { return money(r.spend); } },
        {
          key: 'roas', label: 'ROAS', align: 'right', className: 'num', width: '90px', render: function (r) {
            var v = Biz.roiOf(r);
            return '<span class="cell-strong" style="color:' + (v >= 3 ? 'var(--mint)' : v >= 2 ? 'var(--amber)' : 'var(--danger)') + '">' + (v || '—') + '</span>';
          }
        },
        { key: 'status', label: '状态', render: function (r) { return tag(r.status, UI.statusTone(r.status)); } }
      ]
    });
    return t.el;
  }

  function creatorsPage(params) {
    return shell([
      { label: '达人', build: creatorsTable },
      { label: 'TK 账号', build: accountsTable },
      { label: '广告', build: adsTable }
    ], params);
  }

  /* ============================================================
     设置：数据 / 团队 / 留痕
     ============================================================ */
  function dataPanel() {
    var root = div('card card-pad', '');
    var total = Object.keys(Store.schemas).reduce(function (a, k) { return a + Store.count(k); }, 0);
    root.innerHTML =
      '<div class="cell-main">共 ' + total + ' 条数据 · 占用 ' + (Store.storageUsed() / 1024).toFixed(1) + ' KB</div>' +
      '<div class="cell-sub" style="margin-top:2px">数据存在这台电脑的浏览器里，换设备或清缓存会丢，建议每周导出一次。</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">' +
        '<button class="btn btn-primary" id="exp">' + icon('download', 14) + '导出备份</button>' +
        '<button class="btn" id="imp">' + icon('upload', 14) + '导入备份</button>' +
        '<button class="btn btn-danger" id="reset">恢复演示数据</button>' +
      '</div>';

    root.querySelector('#exp').onclick = function () {
      UI.download('tkshop-backup-' + Util.today() + '.json', Store.exportJSON(), 'application/json');
      UI.toast('已导出');
    };
    root.querySelector('#imp').onclick = function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = function () {
        var f = input.files[0];
        if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
          try { Store.importJSON(rd.result); UI.toast('已导入'); setTimeout(function () { location.reload(); }, 500); }
          catch (e) { UI.toast('文件格式不对', 'err'); }
        };
        rd.readAsText(f);
      };
      input.click();
    };
    root.querySelector('#reset').onclick = function () {
      UI.confirmDialog('清空当前数据，恢复演示数据？', function () {
        Store.reset();
        setTimeout(function () { location.reload(); }, 400);
      }, '确认重置');
    };
    return root;
  }

  function membersTable() {
    var t = UI.DataTable({
      collection: 'members',
      searchPlaceholder: '搜姓名 / 角色',
      searchKeys: ['name', 'role'],
      newLabel: '新增',
      onNew: function () { UI.openForm('members', null, t.refresh); },
      pageSize: 12,
      columns: [
        { key: 'name', label: '姓名' },
        { key: 'role', label: '角色', render: function (r) { return tag(r.role, r.role === '所有者' ? 'mint' : 'sky'); } },
        { key: 'permission', label: '权限' }
      ]
    });
    return t.el;
  }

  function logsTable() {
    var t = UI.DataTable({
      collection: 'logs',
      readonly: true,
      searchPlaceholder: '搜操作 / 对象',
      searchKeys: ['user', 'action', 'target'],
      pageSize: 20,
      columns: [
        { key: 'time', label: '时间', width: '170px', render: function (r) { return '<span class="cell-sub" style="font-size:12.2px">' + esc(r.time) + '</span>'; } },
        { key: 'action', label: '动作', width: '110px', render: function (r) { return tag(r.action, 'gray'); } },
        { key: 'target', label: '对象', render: function (r) { return '<span style="color:var(--ink2)">' + esc(r.target || '—') + '</span>'; } }
      ]
    });
    return t.el;
  }

  function settingsPage(params) {
    return shell([
      { label: '数据', build: dataPanel },
      { label: '团队', build: membersTable },
      { label: '操作记录', build: logsTable }
    ], params);
  }

  /* ---------------- 路由表 ---------------- */
  PAGES.dashboard = { title: '', render: dashboard };
  PAGES.selection = { title: '选品', sub: '三项打分：需求 40 / 可拍 35 / 利润 25', render: selectionPage };
  PAGES.testing = { title: '测品', sub: 'ROI ≥ 3 且转化 ≥ 3% 通过', render: testingPage };
  PAGES.content = { title: '内容', sub: '脚本 · 对标 · 模板 · 拍摄 · 分镜 · 视频', render: contentPage };
  PAGES.creators = { title: '达人', sub: '达人 · 账号 · 广告', render: creatorsPage };
  PAGES.settings = { title: '设置', sub: '数据 · 团队 · 操作记录', render: settingsPage };

  /* 旧链接兜底：迁到新入口 */
  PAGES.stock = PAGES.selection;
  PAGES.scripts = PAGES.content;
  PAGES.benchmarks = PAGES.content;
  PAGES.templates = PAGES.content;
  PAGES.episodes = PAGES.content;
  PAGES.shots = PAGES.content;
  PAGES.accounts = PAGES.creators;
  PAGES.ads = PAGES.creators;
  PAGES.members = PAGES.settings;
  PAGES.logs = PAGES.settings;

  window.PAGES = PAGES;
})();
