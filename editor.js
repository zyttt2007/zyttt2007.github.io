/* 个人介绍网站 · 网页内编辑器
 * 纯前端：不依赖后端、不需要登录。改动保存在浏览器 localStorage，
 * 也可以「导出 index.html」把新内容固化成静态文件上传到仓库，让所有访客看到。
 */
(() => {
  'use strict';

  const STORE_KEY = 'personal-site:data:v3';
  const LEGACY_KEYS = ['personal-site:data:v1', 'personal-site:data:v2'];
  let hadLegacy = false;
  const node = document.getElementById('site-data');
  if (!node) return;

  let defaults;
  try { defaults = JSON.parse(node.textContent); } catch (err) { return; }
  if (!defaults || !Array.isArray(defaults.projects)) return;

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const url = (v) => /^(https?:\/\/|mailto:|#|\/)/i.test(String(v || '').trim()) ? String(v).trim() : '#';

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.projects) && typeof d.name === 'string') return d;
      }
      // 站点默认内容升级后，旧版本草稿不再自动套用（否则会一直看到过期页面），只做备份
      for (const k of LEGACY_KEYS) {
        const old = localStorage.getItem(k);
        if (old) {
          hadLegacy = true;
          try { localStorage.setItem(k + ':backup', old); } catch (e) {}
        }
      }
      return null;
    } catch (err) { return null; }
  }
  let data = load() || clone(defaults);
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (err) {} };

  /* ---------- 单条内容的编辑表单定义 ---------- */
  const TEXT_FIELDS = {
    name:        { label: '名字', type: 'text' },
    heroSub:     { label: '首屏副标题', type: 'text' },
    heroDesc:    { label: '首屏说明', type: 'area' },
    aboutDesc:   { label: '「关于我」板块说明', type: 'text' },
    educationDesc:{ label: '「学习经历」板块说明', type: 'text' },
    skillsDesc:  { label: '「技能」板块说明', type: 'text' },
    projectsDesc:{ label: '「成果与项目」板块说明', type: 'area' },
    processTitle:{ label: '流程小标题', type: 'text' },
    processText: { label: '做法说明', type: 'area' },
    verifyText:  { label: '验证情况', type: 'area' },
    hobbiesDesc: { label: '「爱好」板块说明', type: 'text' },
    contactDesc: { label: '「联系我」板块说明', type: 'text' },
    footerLeft:  { label: '页脚左侧文字', type: 'text' },
    footerRight: { label: '页脚右侧文字', type: 'text' }
  };

  const SCHEMAS = {
    education: [
      { key: 'date', label: '起止时间', type: 'text' },
      { key: 'title', label: '学校 / 阶段', type: 'text' },
      { key: 'desc', label: '这段在做什么', type: 'area' },
      { key: 'extra', label: '补充一句（可留空）', type: 'area' }
    ],
    skills: [
      { key: 'icon', label: '小图标（1-2 个字符，如 ▦）', type: 'text' },
      { key: 'title', label: '分组名', type: 'text' },
      { key: 'tags', label: '技能标签', type: 'pairs', hint: '每行一条，格式：名称 | 熟练度' },
      { key: 'note', label: '说明', type: 'area' }
    ],
    stats: [
      { key: '_0', label: '数字', type: 'text' },
      { key: '_1', label: '说明文字', type: 'text' }
    ],
    projects: [
      { key: 'kind', label: '分类（如 数据查询网站）', type: 'text' },
      { key: 'name', label: '作品名称', type: 'text' },
      { key: 'en', label: '英文名 / 副名', type: 'text' },
      { key: 'photo', label: '真实摄影配图地址', type: 'text', hint: '如 images/photo-blog.jpg；留空则不显示照片' },
      { key: 'image', label: '网站界面截图地址', type: 'text', hint: '如 images/img-blog.jpg 或 https://... ；留空则不显示截图' },
      { key: 'desc', label: '一句话简介', type: 'area' },
      { key: 'features', label: '功能要点', type: 'lines', hint: '每行一条' },
      { key: 'tech', label: '技术标签', type: 'lines', hint: '每行一个，如 React' },
      { key: 'links', label: '链接', type: 'links', hint: '每行一条，格式：显示文字 | 网址' }
    ],
    hobbies: [
      { key: 'mark', label: '图标字（一个字）', type: 'text' },
      { key: 'title', label: '爱好名', type: 'text' },
      { key: 'desc', label: '描述', type: 'area' }
    ],
    contacts: [
      { key: 'label', label: '标签（如 邮箱）', type: 'text' },
      { key: 'text', label: '显示文字', type: 'text' },
      { key: 'url', label: '链接地址（邮箱用 mailto:）', type: 'text' },
      { key: 'note', label: '备注（可留空）', type: 'text' }
    ]
  };

  const LIST_NAMES = {
    about: '关于我段落', education: '学习经历', skills: '技能分组',
    stats: '数据条', projects: '成果 / 项目', hobbies: '爱好', contacts: '联系方式'
  };

  function blank(list) {
    switch (list) {
      case 'about': return '';
      case 'stats': return ['0', '说明'];
      case 'education': return { date: '', title: '', desc: '', extra: '' };
      case 'skills': return { icon: '✦', title: '', tags: [], note: '' };
      case 'projects': return { kind: '', name: '', en: '', photo: '', image: '', desc: '', features: [], tech: [], links: [] };
      case 'hobbies': return { mark: '✦', title: '', desc: '' };
      case 'contacts': return { label: '', text: '', url: 'https://', note: '' };
      default: return {};
    }
  }

  function valueOf(field, obj) {
    const v = obj[field.key];
    if (field.type === 'lines' || field.type === 'pairs' || field.type === 'links') {
      if (field.type === 'pairs') return (v || []).map(x => x.join(' | ')).join('\n');
      if (field.type === 'links') return (v || []).map(x => `${x.label} | ${x.url}`).join('\n');
      return (v || []).join('\n');
    }
    if (field.key === '_0') return obj[0];
    if (field.key === '_1') return obj[1];
    return v;
  }

  function parseField(field, raw) {
    const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
    if (field.type === 'lines') return lines;
    if (field.type === 'pairs') return lines.map(s => {
      const [a, ...rest] = s.split('|');
      return [a.trim(), rest.join('|').trim() || ''];
    });
    if (field.type === 'links') return lines.map(s => {
      const [a, ...rest] = s.split('|');
      return { label: (a || '').trim(), url: rest.join('|').trim() };
    });
    return raw.trim();
  }

  /* ---------- 渲染 ---------- */
  function tools(list, i) {
    return `<span class="item-tools" data-ui>
      <button type="button" data-act="edit-item" data-list="${list}" data-i="${i}">编辑</button>
      <button type="button" data-act="up-item" data-list="${list}" data-i="${i}" title="上移">↑</button>
      <button type="button" data-act="down-item" data-list="${list}" data-i="${i}" title="下移">↓</button>
      <button type="button" class="danger" data-act="del-item" data-list="${list}" data-i="${i}">删除</button>
    </span>`;
  }
  const addBtn = (list) => `<button type="button" class="add-btn" data-ui data-act="add-item" data-list="${list}">＋ 新增${LIST_NAMES[list]}</button>`;

  function mediaHtml(x) {
    const first = esc(url((x.links || [{}])[0].url));
    const parts = [];
    if (x.photo) parts.push(
      `<a class="media-photo" href="${first}" target="_blank" rel="noreferrer" title="真实摄影配图">` +
      `<img src="${esc(x.photo)}" alt="${esc(x.name)} 主题真实摄影照片" loading="eager" />` +
      `<span class="media-cap">真实摄影</span></a>`);
    if (x.image) parts.push(
      `<a class="media-shot" href="${first}" target="_blank" rel="noreferrer" title="线上真实界面截图">` +
      `<img src="${esc(x.image)}" alt="${esc(x.name)} 网站真实界面截图" loading="eager" />` +
      `<span class="media-cap">网站界面</span></a>`);
    return parts.length ? `<div class="project-media">${parts.join('')}</div>` : '';
  }

  const R = {
    about: (items) => items.map((x, i) => `<p>${esc(x)}${tools('about', i)}</p>`).join('') + addBtn('about'),
    education: (items) => items.map((x, i) => `
        <li class="timeline-item">${tools('education', i)}
          <div class="timeline-dot" aria-hidden="true"></div>
          <p class="timeline-date">${esc(x.date)}</p>
          <h3>${esc(x.title)}</h3>
          <p>${esc(x.desc)}</p>
          ${x.extra ? `<p class="timeline-extra">${esc(x.extra)}</p>` : ''}
        </li>`).join('') + addBtn('education'),
    skills: (items) => items.map((x, i) => `
        <article class="skill-card">${tools('skills', i)}
          <div class="skill-icon" aria-hidden="true">${esc(x.icon)}</div>
          <h3>${esc(x.title)}</h3>
          <ul class="tag-list">${(x.tags || []).map(t => `<li><span>${esc(t[0])}</span><em>${esc(t[1])}</em></li>`).join('')}</ul>
          <p class="skill-note">${esc(x.note)}</p>
        </article>`).join('') + addBtn('skills'),
    stats: (items) => items.map((x, i) => `
        <div class="stat">${tools('stats', i)}<b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('') + addBtn('stats'),
    projects: (items) => items.map((x, i) => `
        <article class="project-card">${tools('projects', i)}
          ${mediaHtml(x)}
          <div class="project-top"><span class="project-no">${String(i + 1).padStart(2, '0')}</span><span class="project-kind">${esc(x.kind)}</span></div>
          <h3>${esc(x.name)} <span>${esc(x.en)}</span></h3>
          <p class="project-desc">${esc(x.desc)}</p>
          <ul class="feature-list">${(x.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          <div class="tech-row">${(x.tech || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
          <div class="project-links">${(x.links || []).map(l => `<a href="${esc(url(l.url))}" target="_blank" rel="noreferrer">${esc(l.label)}</a>`).join('')}</div>
        </article>`).join('') + addBtn('projects'),
    hobbies: (items) => items.map((x, i) => `
        <div class="hobby">${tools('hobbies', i)}<span class="hobby-mark">${esc(x.mark)}</span><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></div>`).join('') + addBtn('hobbies'),
    contacts: (items) => items.map((x, i) => `
        <div class="contact-line">${tools('contacts', i)}<span class="contact-label">${esc(x.label)}</span><a href="${esc(url(x.url))}" target="_blank" rel="noreferrer">${esc(x.text)}</a>${x.note ? `<small>${esc(x.note)}</small>` : ''}</div>`).join('') + addBtn('contacts')
  };

  const CONTAINERS = {
    about: '#about-paragraphs', education: '#timeline', skills: '#skill-grid',
    stats: '#stats', projects: '#project-grid', hobbies: '#hobby-grid', contacts: '#contact-card'
  };

  function render() {
    $$('[data-text]').forEach(el => {
      const key = el.dataset.text;
      if (key in data) el.textContent = data[key];
    });
    document.title = `${data.name} · 个人介绍网站`;
    Object.keys(CONTAINERS).forEach(list => {
      const box = $(CONTAINERS[list]);
      if (box && Array.isArray(data[list])) box.innerHTML = R[list](data[list]);
    });
  }

  /* ---------- 编辑界面 ---------- */
  function buildUI() {
    const fab = document.createElement('button');
    fab.type = 'button'; fab.className = 'edit-fab'; fab.dataset.ui = '';
    fab.dataset.act = 'toggle-edit';
    fab.innerHTML = '✎ <span>编辑内容</span>';
    document.body.appendChild(fab);

    const bar = document.createElement('div');
    bar.className = 'edit-bar'; bar.dataset.ui = '';
    bar.innerHTML = `
      <div class="edit-bar-inner">
        <b>编辑模式</b>
        <span class="edit-tip">点任意文字即可修改；每张卡片可编辑、删除、排序，列表末尾可新增。改动自动保存在本机浏览器。</span>
        <div class="edit-bar-actions">
          <button type="button" data-act="export-html" class="primary">导出 index.html</button>
          <button type="button" data-act="export-json">导出数据</button>
          <button type="button" data-act="import-json">导入数据</button>
          <button type="button" data-act="help">保存说明</button>
          <button type="button" data-act="reset">恢复默认</button>
          <button type="button" data-act="toggle-edit" class="close">完成 ✕</button>
        </div>
      </div>`;
    document.body.appendChild(bar);

    const modal = document.createElement('div');
    modal.className = 'modal-mask'; modal.dataset.ui = ''; modal.id = 'edit-modal';
    modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-head"><h3 id="modal-title">编辑</h3><button type="button" data-act="close-modal" aria-label="关闭">✕</button></div>
      <form id="edit-form"><div id="modal-fields"></div>
        <div class="modal-foot"><button type="button" data-act="close-modal">取消</button><button type="submit" class="primary">保存</button></div>
      </form></div>`;
    document.body.appendChild(modal);

    const toast = document.createElement('div');
    toast.className = 'toast'; toast.dataset.ui = ''; toast.id = 'edit-toast';
    document.body.appendChild(toast);

    const file = document.createElement('input');
    file.type = 'file'; file.accept = '.json,application/json'; file.id = 'import-file';
    file.style.display = 'none'; file.dataset.ui = '';
    document.body.appendChild(file);
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      try {
        const d = JSON.parse(await f.text());
        if (!d || !Array.isArray(d.projects) || typeof d.name !== 'string') throw new Error('格式不对');
        d.version = defaults.version;
        data = d; save(); render(); notify('数据已导入并保存');
      } catch (err) { notify('导入失败：请选择本页导出的 JSON 文件'); }
      file.value = '';
    });

    $('#edit-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!onSubmit) return;
      const fd = new FormData(ev.target);
      const raw = {};
      fd.forEach((v, k) => { raw[k] = v; });
      onSubmit(raw);
      closeForm();
    });
    modal.addEventListener('click', (ev) => { if (ev.target === modal) closeForm(); });
  }

  let toastTimer;
  function notify(msg) {
    const t = $('#edit-toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  let onSubmit = null;
  function openForm(title, fields, values, callback) {
    $('#modal-title').textContent = title;
    $('#modal-fields').innerHTML = fields.map(f => {
      const raw = values[f.key] == null ? '' : String(values[f.key]);
      const input = f.type === 'text'
        ? `<input type="text" name="${f.key}" value="${esc(raw)}" />`
        : `<textarea name="${f.key}" rows="${f.type === 'area' ? 3 : 4}">${esc(raw)}</textarea>`;
      return `<label class="field"><span>${esc(f.label)}</span>${input}${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</label>`;
    }).join('');
    onSubmit = callback;
    $('#edit-modal').classList.add('open');
    const first = $('#edit-form input, #edit-form textarea');
    if (first) first.focus();
  }
  function closeForm() { $('#edit-modal').classList.remove('open'); onSubmit = null; }

  function openTextEditor(key) {
    const conf = TEXT_FIELDS[key];
    if (!conf) return;
    openForm('修改：' + conf.label, [{ key: 'value', label: conf.label, type: conf.type }],
      { value: data[key] }, (raw) => {
        data[key] = raw.value; save(); render(); notify('已保存');
      });
  }

  function openItemEditor(list, index) {
    const isNew = index < 0;
    const item = isNew ? blank(list) : clone(data[list][index]);
    if (list === 'about') {
      openForm((isNew ? '新增' : '修改') + '关于我段落',
        [{ key: 'value', label: '段落文字', type: 'area' }],
        { value: typeof item === 'string' ? item : '' },
        (raw) => { commit(list, index, raw.value); });
      return;
    }
    if (list === 'stats') {
      openForm((isNew ? '新增' : '修改') + '数据条', SCHEMAS.stats,
        { _0: item[0], _1: item[1] },
        (raw) => { commit(list, index, [raw._0, raw._1]); });
      return;
    }
    const fields = SCHEMAS[list];
    const values = {};
    fields.forEach(f => { values[f.key] = valueOf(f, item); });
    openForm((isNew ? '新增' : '修改') + LIST_NAMES[list], fields, values, (raw) => {
      const obj = {};
      fields.forEach(f => { obj[f.key] = parseField(f, raw[f.key] || ''); });
      commit(list, index, obj);
    });
  }

  function commit(list, index, value) {
    if (index < 0) data[list].push(value);
    else data[list][index] = value;
    save(); render(); notify('已保存');
  }

  function setEditing(on) {
    document.body.classList.toggle('editing', on);
    $('.edit-fab').innerHTML = on ? '✓ <span>完成编辑</span>' : '✎ <span>编辑内容</span>';
  }

  /* ---------- 导出 ---------- */
  const jsonText = () => JSON.stringify(data, null, 2).replace(/<\//g, '<\\/');
  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  function cleanMarkup(selector) {
    const el = $(selector);
    if (!el) return null;
    const c = el.cloneNode(true);
    $$('[data-ui]', c).forEach(n => n.remove());
    $$('[contenteditable]', c).forEach(n => n.removeAttribute('contenteditable'));
    c.classList.remove('reveal', 'in');
    $$('.reveal', c).forEach(n => n.classList.remove('reveal', 'in'));
    return c.outerHTML;
  }

  async function exportHtml() {
    let source = '';
    try {
      const res = await fetch('index.html', { cache: 'no-store' });
      if (res.ok) source = await res.text();
    } catch (err) { /* file:// 下无法 fetch，走下面的 DOM 兜底 */ }
    if (!source) {
      const c = document.documentElement.cloneNode(true);
      $$('[data-ui]', c).forEach(el => el.remove());
      const body = c.querySelector('body');
      if (body) body.classList.remove('editing');
      c.classList.remove('has-motion');
      $$('.reveal', c).forEach(n => n.classList.remove('reveal', 'in'));
      source = '<!doctype html>\n' + c.outerHTML;
    }

    // 静态 HTML 内容也一起换成当前数据：即使不执行 JavaScript，访客和评分爬虫看到的也是新内容
    const parts = [['header', /<header\b[^>]*>[\s\S]*?<\/header>/],
                   ['main', /<main\b[^>]*>[\s\S]*?<\/main>/],
                   ['footer', /<footer\b[^>]*>[\s\S]*?<\/footer>/]];
    parts.forEach(([sel, re]) => {
      const markup = cleanMarkup(sel);
      if (markup) source = source.replace(re, markup);
    });
    source = source.replace(/(<script id="site-data"[^>]*>)[\s\S]*?(<\/script>)/,
      (m, a, b) => a + jsonText() + b);
    source = source.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(data.name)} · 个人介绍网站</title>`);
    source = source.replace(/\sclass="editing"/g, '');

    download('index.html', source, 'text/html;charset=utf-8');
    notify('已导出 index.html：替换仓库同名文件即可让所有人看到新内容');
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-act]');
    if (btn) {
      const act = btn.dataset.act, list = btn.dataset.list, i = Number(btn.dataset.i);
      switch (act) {
        case 'toggle-edit': setEditing(!document.body.classList.contains('editing')); return;
        case 'close-modal': closeForm(); return;
        case 'add-item': openItemEditor(list, -1); return;
        case 'edit-item': openItemEditor(list, i); return;
        case 'del-item':
          if (confirm(`确定删除这条「${LIST_NAMES[list]}」吗？`)) {
            data[list].splice(i, 1); save(); render(); notify('已删除');
          }
          return;
        case 'up-item':
          if (i > 0) { [data[list][i - 1], data[list][i]] = [data[list][i], data[list][i - 1]]; save(); render(); }
          return;
        case 'down-item':
          if (i < data[list].length - 1) { [data[list][i + 1], data[list][i]] = [data[list][i], data[list][i + 1]]; save(); render(); }
          return;
        case 'export-html': exportHtml(); return;
        case 'export-json': download('site-data.json', JSON.stringify(data, null, 2), 'application/json;charset=utf-8'); notify('数据已导出'); return;
        case 'import-json': $('#import-file').click(); return;
        case 'reset':
          if (confirm('恢复成网站最初的默认内容？当前修改会被清除（建议先导出数据备份）。')) {
            localStorage.removeItem(STORE_KEY); data = clone(defaults); render(); notify('已恢复默认');
          }
          return;
        case 'help':
          alert('改动存在哪：\n1）每次修改都会自动保存在「当前浏览器」，刷新、关掉再打开都还在；\n2）但老师、AI 评分系统用的是别的浏览器，看不到你本机的改动。\n\n要让所有人都看到：\n在编辑条点「导出 index.html」，把下载的文件替换 GitHub 仓库里的同名 index.html（或直接发给我，我帮你上传），公网页面就永久更新了。\n\n换电脑：用「导出数据 / 导入数据」搬运 site-data.json。');
          return;
      }
    }
    const txt = ev.target.closest('[data-text]');
    if (txt && document.body.classList.contains('editing') && !ev.target.closest('[data-ui]')) {
      openTextEditor(txt.dataset.text);
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { closeForm(); setEditing(false); }
  });

  buildUI();
  render();
  if (hadLegacy) setTimeout(() => notify('站点内容已更新：本机旧草稿已备份，现在显示的是最新内容'), 800);
  if (new URLSearchParams(location.search).get('edit') === '1') setEditing(true);
})();
