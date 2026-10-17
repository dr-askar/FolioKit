/* FolioKit mobile adaptation, AGPL-3.0. PDF.js retains its Apache-2.0 notices. */
(async function () {
  const params = new URLSearchParams(location.search);
  if (params.get('foliokitMobile') !== '1' || !matchMedia('(max-width: 900px), (pointer: coarse)').matches) return;
  // PDF.js emits this before reading viewer options, including inside a same-origin iframe.
  const parentDocument = parent.document;
  const configureLocale = event => {
    if (event.detail?.source !== window) return;
    window.PDFViewerApplicationOptions?.set('localeProperties', { lang: params.get('locale') || navigator.language });
    parentDocument.removeEventListener('webviewerloaded', configureLocale);
  };
  parentDocument.addEventListener('webviewerloaded', configureLocale);
  window.addEventListener('pagehide', () => parentDocument.removeEventListener('webviewerloaded', configureLocale), { once: true });
  let app;
  for (let i = 0; i < 200; i++) {
    app = window.PDFViewerApplication;
    if (app) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!app) return;
  await app.initializedPromise;
  const bus = app.eventBus;
  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const labels = { read: 'Read / scroll', settings: 'Tool settings', done: 'Done', undo: 'Undo', redo: 'Redo' };
  try {
    const response = await fetch('foliokit-mobile-labels.json');
    if (response.ok) Object.assign(labels, (await response.json())[params.get('locale')] || {});
  } catch { /* English labels remain usable offline if a translation cannot load. */ }
  window.foliokitReaderLabels = labels;
  const icons = {
    read: '<path d="M4 19V9a2 2 0 0 1 4 0v3-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v6-3a2 2 0 0 1 4 0v7c0 4-3 6-7 6H9c-2 0-4-1-5-3Z"/>',
    settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
    undo: '<path d="m9 5-5 5 5 5M4 10h9a6 6 0 0 1 0 12"/>',
    redo: '<path d="m15 5 5 5-5 5m5-5h-9a6 6 0 0 0 0 12"/>',
  };
  function button(id, label, icon, action) {
    const node = document.createElement('button');
    node.id = id;
    node.type = 'button';
    node.className = 'foliokit-button';
    node.title = label;
    node.setAttribute('aria-label', label);
    node.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[icon]}</svg>`;
    node.addEventListener('click', action);
    return node;
  }
  let mode = 0;
  let openPanel = null;
  const editorButtons = [
    ['editorHighlight', 'editorHighlightButton', 'editorHighlightParamsToolbar', 9],
    ['editorInk', 'editorInkButton', 'editorInkParamsToolbar', 15],
    ['editorFreeText', 'editorFreeTextButton', 'editorFreeTextParamsToolbar', 3],
    ['editorStamp', 'editorStampButton', 'editorStampParamsToolbar', 13],
    ['editorSignature', 'editorSignatureButton', 'editorSignatureParamsToolbar', 101],
    ['editorComment', 'editorCommentButton', 'editorCommentParamsToolbar', 16],
  ];
  const top = document.createElement('div');
  top.id = 'foliokit-topbar';
  top.setAttribute('role', 'toolbar');
  for (const id of ['sidebarToggleButton', 'viewFindButton']) if ($(id)) top.append($(id));
  const pages = document.createElement('div');
  pages.className = 'foliokit-pages';
  for (const id of ['pageNumber', 'numPages']) if ($(id)) pages.append($(id));
  top.append(pages);
  for (const id of ['zoomOutButton', 'zoomInButton', 'secondaryToolbarToggleButton']) if ($(id)) top.append($(id));
  $('outerContainer').append(top);
  // Find is no longer anchored inside the website-sized toolbar.
  if ($('findbar')) document.body.append($('findbar'));
  if ($('secondaryToolbar')) document.body.append($('secondaryToolbar'));
  const bottom = document.createElement('div');
  bottom.id = 'foliokit-tools';
  bottom.setAttribute('role', 'toolbar');
  bottom.setAttribute('aria-label', labels.settings);
  const read = button('foliokit-read', labels.read, 'read', () => {
    if (mode > 0) bus.dispatch('switchannotationeditormode', { source: bottom, mode: 0 });
    bus.dispatch('switchcursortool', { source: bottom, tool: 0 });
    closePanel();
  });
  read.setAttribute('aria-pressed', 'true');
  bottom.append(read);
  const more = $('secondaryToolbarButtonContainer') || $('secondaryToolbar');
  const settings = button('foliokit-settings', labels.settings, 'settings', () => {
    const current = editorButtons.find(entry => entry[3] === mode);
    if (!current) return;
    if (openPanel === $(current[2])) closePanel();
    else showPanel($(current[2]));
  });
  settings.disabled = true;
  settings.setAttribute('aria-expanded', 'false');
  function closePanel() {
    if (openPanel) {
      openPanel.removeAttribute('data-mobile-open');
      openPanel = null;
    }
    settings.setAttribute('aria-expanded', 'false');
    for (const [, id] of editorButtons) $(id)?.setAttribute('aria-expanded', 'false');
  }
  window.foliokitReaderClosePanel = () => {
    if (openPanel) { closePanel(); return true; }
    if (app.findBar?.opened) { app.findBar.close(); return true; }
    if (app.secondaryToolbar?.isOpen) { app.secondaryToolbar.close(); return true; }
    if (app.pdfSidebar?.isOpen) { app.pdfSidebar.close(); return true; }
    return false;
  };
  function showPanel(panel) {
    if (!panel) return;
    closePanel();
    openPanel = panel;
    panel.classList.remove('hidden');
    panel.setAttribute('data-mobile-open', '');
    settings.setAttribute('aria-controls', panel.id);
    settings.setAttribute('aria-expanded', 'true');
  }
  for (const [container, id, panelId, editorMode] of editorButtons) {
    const node = $(container), panel = $(panelId);
    if (!node) continue;
    if (panel) {
      document.body.append(panel);
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', labels.settings);
      const header = document.createElement('div');
      header.className = 'foliokit-sheet-header';
      const title = document.createElement('strong');
      title.textContent = labels.settings;
      const done = document.createElement('button');
      done.type = 'button';
      done.textContent = labels.done;
      done.className = 'foliokit-done';
      done.addEventListener('click', () => { closePanel(); settings.focus(); });
      header.append(title, done);
      panel.prepend(header);
    }
    if ([9, 15, 3].includes(editorMode)) bottom.append(node);
    else if (more) more.prepend(node);
  }
  bottom.append(settings);
  const undo = button('foliokit-undo', labels.undo, 'undo', () => bus.dispatch('editingaction', { source: bottom, name: 'undo' }));
  bottom.append(undo);
  if (more) {
    const redo = button('foliokit-redo', labels.redo, 'redo', () => bus.dispatch('editingaction', { source: more, name: 'redo' }));
    more.prepend(redo);
  }
  $('outerContainer').append(bottom);
  function syncMode({ mode: nextMode }) {
    mode = nextMode;
    root.dataset.foliokitMode = String(mode);
    read.setAttribute('aria-pressed', String(mode <= 0));
    settings.disabled = !editorButtons.some(entry => entry[3] === mode);
    closePanel();
    for (const [, id, , editorMode] of editorButtons) $(id)?.setAttribute('aria-checked', String(mode === editorMode));
    if ([13, 101, 16].includes(mode)) {
      app.secondaryToolbar?.close();
      showPanel($(editorButtons.find(entry => entry[3] === mode)[2]));
    }
  }
  bus._on('annotationeditormodechanged', syncMode);
  // Closing settings does not dispatch a mode change: annotation stays selected.
  document.addEventListener('pointerdown', event => {
    if (openPanel && !openPanel.contains(event.target) && !settings.contains(event.target)) closePanel();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openPanel) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closePanel();
      settings.focus();
    }
  }, true);
  // Save through the host Android share bridge, including PDF.js annotation storage.
  for (const id of ['downloadButton', 'secondaryDownload']) $(id)?.addEventListener('click', event => {
    if (window.parent === window) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    parent.postMessage({ type: 'foliokit-reader-save-requested' }, location.origin);
  }, true);
  root.classList.add('foliokit-mobile');
  app.pdfViewer.removePageBorders = true;
  app.pdfViewer.viewer.classList.add('removePageBorders');
  function fitDocument() {
    app.pdfViewer.currentScaleValue = 'page-width';
  }
  bus._on('pagesinit', fitDocument);
  if (app.pdfDocument) fitDocument();
  root.setAttribute('data-toolbar-density', 'touch');
  syncMode({ mode: app.pdfViewer.annotationEditorMode || 0 });
})();
