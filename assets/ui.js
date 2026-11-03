/* ==========================================================
   ui.js · 组件库
   图标 / 标签 / 表格引擎 / 表单 / 弹窗 / 提示
   ========================================================== */
(function () {
  'use strict';

  var ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
    box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5l8 4.5 8-4.5"/><path d="M12 12v9"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6L4.5 18a2 2 0 001.7 3h11.6a2 2 0 001.7-3L14 9V3"/><path d="M7.5 15h9"/>',
    script: '<path d="M7 3h9a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5v-7z"/>',
    clapper: '<path d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/><path d="M3 8l2-4h14l2 4"/><path d="M8 4l-1.5 4M13 4l-1.5 4"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 12h18"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 11a3 3 0 100-6"/><path d="M18 20c0-2.4-1-4-3-4.8"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-4 8"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    shield: '<path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z"/><path d="M9.5 12l1.8 1.8 3.4-3.6"/>',
    history: '<path d="M3 12a9 9 0 1015.5-6.2"/><path d="M3 4v5h5"/><path d="M12 8v4.5l3 1.8"/>',
    database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 4v11"/><path d="M7.5 11.5L12 16l4.5-4.5"/><path d="M4 19h16"/>',
    edit: '<path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14.5 5.5l4 4"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    refresh: '<path d="M20 12a8 8 0 11-2.3-5.6"/><path d="M20 4v5h-5"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/>',
    upload: '<path d="M12 20V9"/><path d="M7.5 12.5L12 8l4.5 4.5"/><path d="M4 4h16"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>'
  };

  function icon(name, size, cls) {
    var p = ICONS[name] || ICONS.grid;
    return '<svg class="' + (cls || '') + '" width="' + (size || 16) + '" height="' + (size || 16) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) {
    if (n == null || n === '') return '—';
    var v = Number(n);
    if (isNaN(v)) return esc(n);
    return v.toLocaleString('en-US');
  }
  function money(n, cur) {
    if (n == null || n === '') return '—';
    var v = Number(n);
    if (isNaN(v)) return esc(n);
    return (cur === false ? '' : '$') + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function pct(n) { return (n == null || n === '') ? '—' : Number(n).toFixed(2) + '%'; }

  function tag(text, tone) {
    return '<span class="tag tag-' + (tone || 'gray') + '">' + esc(text) + '</span>';
  }
  function statusTone(v) {
    var map = {
      '主推': 'mint', '在库': 'sky', '测品中': 'amber', '选品池': 'gray', '已淘汰': 'danger',
      '已通过': 'mint', '进行中': 'sky', '待判定': 'amber', '未审核': 'amber', '已审核': 'mint', '需补拍': 'danger',
      '已定稿': 'sky', '草稿': 'gray', '拍摄中': 'amber', '已发布': 'mint', '已爆': 'violet', '已下架': 'gray',
      '筹备中': 'gray', '已杀青': 'mint', '已归档': 'gray',
      '待邀约': 'gray', '已邀约': 'sky', '已寄样': 'amber', '已出片': 'mint', '已结算': 'violet', '已放弃': 'danger',
      '正常': 'mint', '限流': 'amber', '养号中': 'sky', '已封禁': 'danger',
      '投放中': 'mint', '已暂停': 'amber', '已结束': 'gray',
      '剧情': 'pink', '口播': 'violet', '测评': 'sky', '混剪': 'amber'
    };
    return map[v] || 'gray';
  }
  function typeTag(v) { return tag(v, statusTone(v)); }

  /* ---------------- toast ---------------- */
  function toast(msg, tone) {
    var root = document.getElementById('toast-root');
    var el = document.createElement('div');
    el.className = 'toast ' + (tone || 'ok');
    el.innerHTML = icon(tone === 'err' ? 'x' : 'check', 15) + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.transition = 'all .25s';
      setTimeout(function () { el.remove(); }, 260);
    }, 2200);
  }

  /* ---------------- modal ---------------- */
  var modalRoot = null;
  function closeModal() {
    if (modalRoot) { modalRoot.remove(); modalRoot = null; }
    document.body.style.overflow = '';
  }
  function openModal(opt) {
    closeModal();
    var wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML =
      '<div class="modal ' + (opt.wide ? 'wide' : '') + '" role="dialog" aria-modal="true">' +
        '<div class="modal-head">' +
          '<div class="modal-title">' + esc(opt.title || '') + '</div>' +
          (opt.sub ? '<div class="modal-sub">' + esc(opt.sub) + '</div>' : '') +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-foot"></div>' +
      '</div>';
    var body = wrap.querySelector('.modal-body');
    var foot = wrap.querySelector('.modal-foot');
    if (typeof opt.body === 'string') body.innerHTML = opt.body;
    else if (opt.body) body.appendChild(opt.body);

    (opt.buttons || [{ label: '关闭' }]).forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'btn ' + (b.primary ? 'btn-primary' : '') + (b.danger ? ' btn-danger' : '');
      btn.textContent = b.label;
      btn.onclick = function () {
        if (b.onClick) {
          var keep = b.onClick(wrap, body);
          if (keep === false) return;
        }
        closeModal();
      };
      foot.appendChild(btn);
    });
    wrap.addEventListener('click', function (e) { if (e.target === wrap) closeModal(); });
    document.addEventListener('keydown', function escKey(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escKey); }
    });
    document.body.appendChild(wrap);
    document.body.style.overflow = 'hidden';
    modalRoot = wrap;
    var first = wrap.querySelector('input,select,textarea');
    if (first) setTimeout(function () { first.focus(); }, 60);
    return wrap;
  }

  function confirmDialog(msg, onOk, okLabel) {
    openModal({
      title: '确认操作',
      body: '<div style="font-size:13px;color:var(--ink2);line-height:1.7">' + esc(msg).replace(/\n/g, '<br>') + '</div>',
      buttons: [
        { label: '取消' },
        { label: okLabel || '确认删除', danger: true, onClick: function () { onOk(); } }
      ]
    });
  }

  /* ---------------- 表单 ---------------- */
  function openForm(collection, record, onSaved) {
    var schema = Store.schema(collection);
    if (!schema) return;
    var isEdit = !!(record && record.id);
    var data = Object.assign({}, record || {});
    if (!isEdit && collection === 'scripts' && !data.date) data.date = Util.today();
    if (!isEdit && collection === 'episodes' && !data.planDate) data.planDate = Util.today();

    var html = '<div class="form-grid">';
    schema.fields.forEach(function (fd) {
      var full = fd.full || fd.type === 'textarea';
      var val = data[fd.key] == null ? '' : data[fd.key];
      html += '<div class="field ' + (full ? 'full' : '') + '" data-key="' + fd.key + '">';
      html += '<label>' + esc(fd.label) + (fd.required ? ' <span style="color:#D2544F">*</span>' : '') + '</label>';
      if (fd.type === 'textarea') {
        html += '<textarea class="textarea" data-field="' + fd.key + '" placeholder="' + esc(fd.placeholder || '') + '">' + esc(val) + '</textarea>';
      } else if (fd.type === 'select') {
        html += '<select class="select" data-field="' + fd.key + '"><option value="">请选择</option>';
        (fd.options || []).forEach(function (o) {
          html += '<option value="' + esc(o) + '"' + (String(val) === String(o) ? ' selected' : '') + '>' + esc(o) + '</option>';
        });
        html += '</select>';
      } else {
        html += '<input class="input" data-field="' + fd.key + '" type="' + (fd.type === 'number' ? 'number' : fd.type === 'date' ? 'date' : 'text') + '"' +
          (fd.step ? ' step="' + fd.step + '"' : '') + (fd.min != null ? ' min="' + fd.min + '"' : '') + (fd.max != null ? ' max="' + fd.max + '"' : '') +
          ' value="' + esc(val) + '" placeholder="' + esc(fd.placeholder || '') + '">';
      }
      if (fd.hint) html += '<div class="hint">' + esc(fd.hint) + '</div>';
      html += '</div>';
    });
    html += '</div>';

    var wrap = openModal({
      title: (isEdit ? '编辑' : '新增') + schema.label,
      sub: isEdit ? '修改后立即生效，并记入操作留痕' : '填写后即保存到本地数据库',
      wide: schema.fields.length > 12,
      body: html,
      buttons: [
        { label: '取消' },
        {
          label: isEdit ? '保存修改' : '创建', primary: true, onClick: function () {
            var out = {};
            /* 表单里没显示的字段（如从哪个分段进来的阶段值）原样带回，避免丢数据 */
            Object.keys(data).forEach(function (k) {
              if (k === 'id') return;
              var shown = schema.fields.some(function (fd) { return fd.key === k; });
              if (!shown) out[k] = data[k];
            });
            var bad = null;
            schema.fields.forEach(function (fd) {
              var input = wrap.querySelector('[data-field="' + fd.key + '"]');
              if (!input) return;
              var v = input.value.trim();
              if (fd.required && !v) { bad = bad || fd; input.closest('.field').classList.add('field-err'); return; }
              if (fd.type === 'number') out[fd.key] = v === '' ? '' : Number(v);
              else out[fd.key] = v;
            });
            if (bad) { toast('「' + bad.label + '」必填', 'err'); return false; }
            out.id = record && record.id ? record.id : undefined;
            Store.save(collection, out);
            toast(isEdit ? '已保存' : '已创建');
            if (onSaved) onSaved();
          }
        }
      ]
    });
  }

  /* ---------------- 表格引擎 ---------------- */
  function DataTable(opts) {
    var coll = opts.collection;
    var pageSize = opts.pageSize || 10;
    var state = { q: '', page: 1, filters: {} };
    (opts.filters || []).forEach(function (fl) { state.filters[fl.key] = ''; });

    var root = document.createElement('div');
    root.className = 'card table-card';

    var toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    var searchHtml = '<div class="search">' + icon('search', 14) +
      '<input class="input" placeholder="' + esc(opts.searchPlaceholder || '搜索…') + '"></div>';
    toolbar.innerHTML = searchHtml;

    /* 分段胶囊：一个维度就够，不再堆下拉筛选 */
    var segDef = opts.segments && opts.segments[0];
    if (segDef) {
      state.filters[segDef.key] = '';
      var seg = document.createElement('div');
      seg.className = 'seg';
      ['全部'].concat(segDef.options || []).forEach(function (o, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = o;
        if (i === 0) b.classList.add('on');
        b.onclick = function () {
          state.filters[segDef.key] = o === '全部' ? '' : o;
          state.page = 1;
          Array.prototype.forEach.call(seg.children, function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          refresh();
        };
        seg.appendChild(b);
      });
      toolbar.appendChild(seg);
    }

    var grow = document.createElement('div');
    grow.className = 'grow';
    toolbar.appendChild(grow);

    var meta = document.createElement('div');
    meta.className = 'meta';
    toolbar.appendChild(meta);

    if (opts.extraToolbar) {
      opts.extraToolbar.forEach(function (b) {
        var btn = document.createElement('button');
        btn.className = 'btn btn-sm';
        btn.innerHTML = (b.icon ? icon(b.icon, 13) : '') + esc(b.label);
        btn.onclick = b.onClick;
        toolbar.appendChild(btn);
      });
    }
    if (opts.onNew) {
      var addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary btn-sm';
      addBtn.innerHTML = icon('plus', 14) + esc(opts.newLabel || '新增');
      addBtn.onclick = opts.onNew;
      toolbar.appendChild(addBtn);
    }

    var wrapTable = document.createElement('div');
    wrapTable.className = 'table-wrap';
    var pager = document.createElement('div');
    pager.className = 'pager';

    root.appendChild(toolbar);
    root.appendChild(wrapTable);
    root.appendChild(pager);

    toolbar.querySelector('input').addEventListener('input', function (e) {
      state.q = e.target.value.trim().toLowerCase();
      state.page = 1;
      refresh();
    });

    function rows() {
      var list = Store.all(coll);
      if (opts.baseFilter) list = list.filter(opts.baseFilter);
      if (state.q) {
        var keys = opts.searchKeys || [];
        list = list.filter(function (r) {
          return keys.some(function (k) { return String(r[k] || '').toLowerCase().indexOf(state.q) > -1; });
        });
      }
      Object.keys(state.filters).forEach(function (k) {
        var v = state.filters[k];
        if (v) list = list.filter(function (r) { return String(r[k]) === v; });
      });
      if (opts.sort) list.sort(opts.sort);
      return list;
    }

    function refresh() {
      var list = rows();
      var pages = Math.max(1, Math.ceil(list.length / pageSize));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * pageSize;
      var slice = list.slice(start, start + pageSize);
      meta.textContent = list.length + ' 条记录';

      var cols = opts.columns;
      var html = '<table class="grid"><thead><tr>';
      cols.forEach(function (c) {
        html += '<th' + (c.width ? ' style="width:' + c.width + '"' : '') +
          (c.align ? ' style="text-align:' + c.align + '"' : '') + '>' + esc(c.label) + '</th>';
      });
      if (!opts.readonly) html += '<th style="width:92px;text-align:right">操作</th></tr></thead><tbody>';
      else html += '</tr></thead><tbody>';

      if (!slice.length) {
        html += '<tr><td colspan="' + (cols.length + 1) + '"><div class="empty"><div class="big">' +
          (opts.emptyTitle || '还没有数据') + '</div>' + esc(opts.emptyText || '点右上角按钮新增第一条记录') + '</div></td></tr>';
      }
      slice.forEach(function (r) {
        html += '<tr data-id="' + r.id + '">';
        cols.forEach(function (c) {
          var content = c.render ? c.render(r) : esc(r[c.key] == null || r[c.key] === '' ? '—' : r[c.key]);
          html += '<td class="' + (c.className || '') + '"' + (c.align ? ' style="text-align:' + c.align + '"' : '') + '>' + content + '</td>';
        });
        if (opts.readonly) { html += '</tr>'; return; }
        html += '<td><div class="row-actions">' +
          (opts.rowExtra ? opts.rowExtra(r) : '') +
          '<button class="icon-btn" data-act="edit" title="编辑">' + icon('edit', 14) + '</button>' +
          '<button class="icon-btn" data-act="del" title="删除">' + icon('trash', 14) + '</button>' +
          '</div></td></tr>';
      });
      html += '</tbody></table>';
      wrapTable.innerHTML = html;

      if (pages <= 1) {
        pager.style.display = 'none';
        pager.innerHTML = '';
      } else {
        pager.style.display = 'flex';
        pager.innerHTML = '<span>第 ' + state.page + ' / ' + pages + ' 页</span><span class="grow"></span>' +
          '<button class="btn btn-sm" data-pg="prev"' + (state.page <= 1 ? ' disabled style="opacity:.4"' : '') + '>上一页</button>' +
          '<button class="btn btn-sm" data-pg="next"' + (state.page >= pages ? ' disabled style="opacity:.4"' : '') + '>下一页</button>';

        pager.querySelector('[data-pg="prev"]').onclick = function () { if (state.page > 1) { state.page--; refresh(); } };
        pager.querySelector('[data-pg="next"]').onclick = function () { if (state.page < pages) { state.page++; refresh(); } };
      }

      wrapTable.querySelectorAll('tr[data-id]').forEach(function (tr) {
        var id = tr.getAttribute('data-id');
        tr.querySelectorAll('[data-act]').forEach(function (btn) {
          btn.onclick = function (e) {
            e.stopPropagation();
            var act = btn.getAttribute('data-act');
            if (act === 'edit') {
              openForm(coll, Store.get(coll, id), refresh);
            } else if (act === 'del') {
              var row = Store.get(coll, id);
              confirmDialog('删除后不可恢复，确认删除这条记录？\n' + (row && (row.name || row.title || row.scriptNo) || ''), function () {
                Store.remove(coll, id);
                toast('已删除');
                refresh();
                if (opts.onChange) opts.onChange();
              });
            } else if (opts.onRowAction) {
              opts.onRowAction(act, Store.get(coll, id), refresh);
            }
          };
        });
        tr.querySelectorAll('[data-row-act]').forEach(function (btn) {
          btn.onclick = function (e) {
            e.stopPropagation();
            if (opts.onRowAction) opts.onRowAction(btn.getAttribute('data-row-act'), Store.get(coll, id), refresh);
          };
        });
      });
      if (opts.onRender) opts.onRender(list);
    }

    refresh();
    return { el: root, refresh: refresh, rows: rows };
  }

  /* ---------------- 其他片段 ---------------- */
  function pageHead(o) {
    var d = document.createElement('div');
    d.className = 'page-head';
    d.innerHTML =
      '<div class="grow">' +
        (o.kicker ? '<div class="page-kicker">' + esc(o.kicker) + '</div>' : '') +
        '<h1 class="page-title">' + esc(o.title) + '</h1>' +
        (o.desc ? '<div class="page-desc">' + o.desc + '</div>' : '') +
      '</div>' +
      '<div class="page-head-actions">' + (o.actions || '') + '</div>';
    return d;
  }

  function kpis(items) {
    var d = document.createElement('div');
    d.className = 'kpi-row';
    d.innerHTML = items.map(function (i) {
      return '<div class="kpi"><div class="k">' + esc(i.k) + '</div><div class="v">' + i.v + '</div>' +
        (i.d ? '<div class="d ' + (i.tone || '') + '">' + i.d + '</div>' : '') + '</div>';
    }).join('');
    return d;
  }

  function meter(value, max, lowThreshold) {
    var v = Number(value) || 0;
    var p = Math.max(0, Math.min(100, max ? v / max * 100 : 0));
    var cls = '';
    if (lowThreshold != null) {
      if (v <= lowThreshold) cls = 'low';
      else if (v <= lowThreshold * 2) cls = 'mid';
    }
    return '<div class="meter ' + cls + '"><div class="bar"><i style="width:' + p + '%"></i></div>' +
      '<span class="num">' + (max === 100 ? v.toFixed(1) : num(v)) + '</span></div>';
  }

  function download(name, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  function toCSV(list, columns) {
    var head = columns.map(function (c) { return '"' + String(c.label).replace(/"/g, '""') + '"'; }).join(',');
    var body = list.map(function (r) {
      return columns.map(function (c) {
        var v = r[c.key] == null ? '' : String(r[c.key]);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');
    return '\ufeff' + head + '\n' + body;
  }

  function printHTML(title, innerHTML) {
    var w = window.open('', '_blank');
    if (!w) { toast('浏览器拦截了新窗口，请允许弹窗', 'warn'); return; }
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title>' +
      '<style>body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#132A22;max-width:760px;margin:40px auto;padding:0 24px;line-height:1.75;font-size:14px}' +
      'h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:26px 0 8px;color:#1FA97A;letter-spacing:.02em}' +
      '.meta{color:#8AA096;font-size:12px;margin-bottom:22px}.block{background:#F7FBF9;border:1px solid #E8F0EB;border-radius:10px;padding:14px 16px;white-space:pre-wrap}' +
      'table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:8px}td,th{border-bottom:1px solid #E8F0EB;padding:7px 8px;text-align:left}' +
      '@media print{body{margin:0}}</style></head><body>' + innerHTML + '</body></html>');
    w.document.close();
    setTimeout(function () { w.focus(); w.print(); }, 350);
  }

  window.UI = {
    icon: icon, esc: esc, num: num, money: money, pct: pct, tag: tag, typeTag: typeTag,
    statusTone: statusTone, toast: toast, openModal: openModal, closeModal: closeModal,
    confirmDialog: confirmDialog, openForm: openForm, DataTable: DataTable,
    pageHead: pageHead, kpis: kpis, meter: meter, download: download, toCSV: toCSV, printHTML: printHTML
  };
})();
