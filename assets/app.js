/* ==========================================================
   app.js · 路由与外壳（极简版）
   导航只有 5 个入口 + 设置
   ========================================================== */
(function () {
  'use strict';

  var ICON = UI.icon;

  var NAV = [
    { key: 'dashboard', label: '工作台', icon: 'grid' },
    { key: 'selection', label: '选品', icon: 'box' },
    { key: 'testing', label: '测品', icon: 'flask' },
    { key: 'content', label: '内容', icon: 'script' },
    { key: 'creators', label: '达人', icon: 'users' }
  ];

  function countsFor(key) {
    if (key === 'testing') {
      var t = Store.all('tests').filter(function (x) { return x.status === '待判定'; }).length;
      return t || '';
    }
    if (key === 'creators') {
      var c = Store.all('creators').filter(function (x) { return ['待邀约', '已邀约', '已寄样'].indexOf(x.status) > -1; }).length;
      return c || '';
    }
    return '';
  }

  function renderSidebar(active) {
    var sb = document.getElementById('sidebar');
    var html = '<div class="brand"><div class="brand-mark">TK</div>' +
      '<div><div class="brand-name">TikTok Shop</div><div class="brand-sub">工作系统</div></div></div>';

    html += '<div class="nav-group">';
    NAV.forEach(function (it) {
      var c = countsFor(it.key);
      html += '<button class="nav-item ' + (it.key === active ? 'active' : '') + '" data-key="' + it.key + '">' +
        '<span class="ico">' + ICON(it.icon, 16) + '</span>' + it.label +
        (c ? '<span class="nav-count">' + c + '</span>' : '') + '</button>';
    });
    html += '</div>';

    html += '<div class="nav-group side-bottom">' +
      '<button class="nav-item ' + (active === 'settings' ? 'active' : '') + '" data-key="settings">' +
      '<span class="ico">' + ICON('database', 16) + '</span>设置</button></div>';

    sb.innerHTML = html;
    sb.querySelectorAll('.nav-item').forEach(function (btn) {
      btn.onclick = function () {
        location.hash = '#/' + btn.getAttribute('data-key');
        sb.classList.remove('open');
      };
    });
  }

  function renderTopbar(page, active) {
    var tb = document.getElementById('topbar');
    var title = active === 'dashboard' ? '工作台' : (page.title || '');
    tb.innerHTML =
      '<button class="btn btn-ghost menu-btn" id="menu">' + ICON('grid', 17) + '</button>' +
      '<div class="top-title">' + UI.esc(title) +
        (page.sub && active !== 'dashboard' ? '<span class="sub">' + UI.esc(page.sub) + '</span>' : '') +
      '</div>' +
      '<div class="topbar-actions">' +
        '<div class="avatar" title="' + UI.esc(Store.user()) + '">' + UI.esc(Store.user().slice(0, 1).toUpperCase()) + '</div>' +
      '</div>';
    tb.querySelector('#menu').onclick = function () {
      document.getElementById('sidebar').classList.toggle('open');
    };
  }

  function parseHash() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('?');
    var key = parts[0] || 'dashboard';
    var params = new URLSearchParams(parts[1] || '');
    return { key: key, params: params };
  }

  function route() {
    var h = parseHash();
    var key = h.key;
    var page = PAGES[key];
    if (!page) { key = 'dashboard'; page = PAGES.dashboard; }

    renderSidebar(key);
    renderTopbar(page, key);

    var view = document.getElementById('view');
    view.innerHTML = '';
    document.title = (page.title || '工作台') + ' · TikTok Shop';
    window.scrollTo(0, 0);
    try {
      view.appendChild(page.render(h.params));
    } catch (e) {
      console.error(e);
      view.innerHTML = '<div class="card card-pad"><div class="cell-main">页面出错</div>' +
        '<div class="cell-sub" style="margin-top:6px">' + UI.esc(e.message) + '</div></div>';
    }

    if (!Store.storageOK()) {
      var warn = document.createElement('div');
      warn.className = 'hint-box';
      warn.style.cssText = 'margin-bottom:14px;background:#FFF6E4;border-color:#F5E3BF';
      warn.innerHTML = ICON('shield', 16) +
        '<div><b>浏览器禁用了本地存储。</b>改动只在内存里，刷新会丢。</div>';
      view.insertBefore(warn, view.firstChild);
    }
  }

  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', function () {
    if (!location.hash) location.hash = '#/dashboard';
    route();
  });
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    if (!location.hash) location.hash = '#/dashboard';
    route();
  }
})();
