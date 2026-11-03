/* ==========================================================
   app.js · 路由与外壳（极简版 + 登录）
   未登录显示登录页；登录后按角色进入工作台 / 管理后台
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

    if (Store.isAdmin()) {
      html += '<div class="nav-group">' +
        '<button class="nav-item ' + (active === 'admin' ? 'active' : '') + '" data-key="admin">' +
        '<span class="ico">' + ICON('shield', 16) + '</span>管理后台</button></div>';
    }

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
        '<button class="icon-btn" id="logout" title="退出登录">' + ICON('logout', 17) + '</button>' +
      '</div>';
    tb.querySelector('#menu').onclick = function () {
      document.getElementById('sidebar').classList.toggle('open');
    };
    tb.querySelector('#logout').onclick = logout;
  }

  function parseHash() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('?');
    var key = parts[0] || 'dashboard';
    var params = new URLSearchParams(parts[1] || '');
    return { key: key, params: params };
  }

  function renderApp() {
    var h = parseHash();
    var key = h.key;
    var page = PAGES[key];
    if (!page) { key = 'dashboard'; page = PAGES.dashboard; }

    /* 管理后台仅 root 可见 */
    if (key === 'admin' && !Store.isAdmin()) {
      location.hash = '#/dashboard';
      return;
    }

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

  /* ---------------- 登录 ---------------- */
  function buildLoginHTML() {
    return '' +
      '<div class="login">' +
        '<div class="login-brand">' +
          '<span class="login-blob b1"></span><span class="login-blob b2"></span><span class="login-blob b3"></span>' +
          '<div class="login-logo">TK</div>' +
          '<h2 class="login-brand-name">TikTok Shop 工作系统</h2>' +
          '<p class="login-brand-sub">全链路选品 · 测品 · 内容 · 达人 · 投放</p>' +
          '<ul class="login-points">' +
            '<li><span></span>选品加权打分，自动算分判断</li>' +
            '<li><span></span>测品判定口径写死，结论可复现</li>' +
            '<li><span></span>素材审核流，进剪辑前先过审</li>' +
          '</ul>' +
        '</div>' +
        '<div class="login-form-wrap">' +
          '<div class="login-form">' +
            '<h1>欢迎回来</h1>' +
            '<p class="login-sub">登录以继续使用工作系统</p>' +
            '<div class="login-tabs">' +
              '<button class="on" data-tab="pwd">密码登录</button>' +
              '<button data-tab="sms">验证码登录</button>' +
            '</div>' +
            '<div class="login-fields">' +
              '<input class="login-input" id="lk-user" placeholder="用户名" autocomplete="username">' +
              '<input class="login-input" id="lk-pass" type="password" placeholder="密码" autocomplete="current-password">' +
              '<label class="login-auto"><input type="checkbox" id="lk-auto"> 自动登录（本机记住）</label>' +
              '<button class="login-btn" id="lk-go">登 录</button>' +
            '</div>' +
            '<div class="login-hint">演示账号：<b>boss</b>（工作）· <b>root</b>（管理后台）</div>' +
            '<div class="login-foot">账号与安全由管理员在「管理后台」维护</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function bindLogin() {
    var root = document.getElementById('login-root');

    var tabs = root.querySelectorAll('.login-tabs button');
    tabs.forEach(function (b) {
      b.onclick = function () {
        tabs.forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var sms = b.getAttribute('data-tab') === 'sms';
        var fields = root.querySelector('.login-fields');
        if (sms) {
          fields.style.display = 'none';
          var notice = root.querySelector('.login-sms-notice');
          if (!notice) {
            notice = document.createElement('div');
            notice.className = 'login-sms-notice';
            notice.textContent = '验证码登录即将上线，请使用密码登录。';
            root.querySelector('.login-form').insertBefore(notice, root.querySelector('.login-hint'));
          }
        } else {
          fields.style.display = '';
          var n2 = root.querySelector('.login-sms-notice');
          if (n2) n2.remove();
        }
      };
    });

    function submit() {
      var u = (root.querySelector('#lk-user').value || '').trim();
      var p = (root.querySelector('#lk-pass').value || '').trim();
      if (!u || !p) { UI.toast('请输入用户名和密码', 'err'); return; }
      var res = Store.login(u, p);
      if (!res.ok) { UI.toast('用户名或密码错误', 'err'); return; }
      var go = res.role === 'admin' ? '#/admin' : '#/dashboard';
      if (location.hash === go) onRoute(); else location.hash = go;
    }

    root.querySelector('#lk-go').onclick = submit;
    [root.querySelector('#lk-user'), root.querySelector('#lk-pass')].forEach(function (el) {
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    });
  }

  function showLogin() {
    document.body.classList.add('login-mode');
    var root = document.getElementById('login-root');
    root.innerHTML = buildLoginHTML();
    bindLogin();
    var first = root.querySelector('#lk-user');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }

  function hideLogin() {
    document.body.classList.remove('login-mode');
  }

  function logout() {
    Store.logout();
    onRoute();
  }

  /* ---------------- 路由 ---------------- */
  function onRoute() {
    if (!Store.session()) { showLogin(); return; }
    hideLogin();
    renderApp();
  }

  function boot() {
    if (!Store.session()) { showLogin(); return; }
    onRoute();
  }

  window.addEventListener('hashchange', onRoute);
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
