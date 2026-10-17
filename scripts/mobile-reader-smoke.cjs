/** Real touch-event regression checks. See ANDROID.md for running against public/ or out/. */
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts, PDFName } = require('pdf-lib');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

(async () => {
  const root = path.resolve(process.env.FOLIOKIT_STATIC_DIR || 'public');
  const output = path.resolve(process.env.FOLIOKIT_UI_OUTPUT || '/tmp/foliokit-mobile-proof');
  fs.mkdirSync(output, { recursive: true });
  const original = await PDFDocument.create();
  const font = await original.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 3; i++) {
    const page = original.addPage([595, 842]);
    page.drawText('FolioKit touch annotation test', { x: 35, y: 740, size: 22, font });
    page.drawText('Highlight this sentence with your finger.', { x: 35, y: 700, size: 18, font });
  }
  const fixture = Buffer.from(await original.save());
  const hosted = fs.existsSync(path.join(root, 'en/tools/pdf-reader/index.html'));
  const mime = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.pdf': 'application/pdf', '.wasm': 'application/wasm', '.ftl': 'text/plain', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/foliokit-touch-test.pdf') { res.setHeader('Content-Type', 'application/pdf'); res.end(fixture); return; }
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    for (const [name, width, height, locale] of [['phone', 360, 800, 'en'], ['narrow', 320, 640, 'en'], ['rtl', 393, 852, 'ar'], ['german', 360, 800, 'de'], ['landscape', 844, 390, 'en']]) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, locale: 'en-US', deviceScaleFactor: 1, acceptDownloads: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let frame = page.mainFrame();
      const filename = 'A deliberately long document name to check mobile overflow and export.pdf';
      if (hosted) {
        await page.goto(`${base}/${locale}/tools/pdf-reader/`);
        await page.locator('input[type=file]').first().waitFor({ state: 'attached' });
        const headerBounds = await page.locator('[data-foliokit-header] button').evaluateAll(buttons => buttons.map(n => n.getBoundingClientRect()).filter(r => r.width).map(r => ({ left: r.left, right: r.right })));
        assert(headerBounds.every(r => r.left >= 0 && r.right <= width + 1), `${name}: header controls extend beyond screen`);
        assert.equal(await page.getByRole('button', { name: 'Check for Updates' }).count(), 0, 'Desktop updater is exposed on Android');
        await page.locator('input[type=file]').first().setInputFiles({ name: filename, mimeType: 'application/pdf', buffer: fixture });
        await page.locator('iframe').waitFor();
        frame = page.frames().find(f => f.url().includes('/pdfjs-viewer/viewer.html'));
        if (!frame) { await page.waitForTimeout(300); frame = page.frames().find(f => f.url().includes('/pdfjs-viewer/viewer.html')); }
        assert(frame, 'Reader frame missing');
      } else await page.goto(`${base}/pdfjs-viewer/viewer.html?file=/foliokit-touch-test.pdf&foliokitMobile=1&locale=${locale}`);
      await frame.waitForFunction(() => window.PDFViewerApplication?.pdfDocument && document.querySelector('.textLayer span') && document.documentElement.classList.contains('foliokit-mobile'));
      await frame.waitForTimeout(300);
      if (locale === 'ar') assert.equal(await frame.locator('html').getAttribute('dir'), 'rtl', 'Reader did not follow the application language');
      const geometry = await frame.evaluate(() => ({
        document: document.querySelector('#viewerContainer').getBoundingClientRect().toJSON(),
        controls: [...document.querySelectorAll('#foliokit-tools button, #foliokit-topbar button')].filter(n => n.getBoundingClientRect().width).map(n => ({ id: n.id, width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height })),
        width: innerWidth, height: innerHeight,
      }));
      assert(geometry.document.height > geometry.height * .6, `${name}: document viewport too small`);
      assert(geometry.controls.every(n => n.width >= 44 && n.height >= 44), `${name}: touch target smaller than 44px`);
      assert(geometry.width <= width + 1, `${name}: document overflows screen`);
      await frame.locator('#sidebarToggleButton').tap();
      await frame.waitForTimeout(400);
      const sidebar = await frame.locator('#sidebarContainer').boundingBox();
      assert(sidebar && sidebar.x >= -1 && sidebar.x + sidebar.width <= width + 1, `${name}: sidebar is off screen`);
      assert(await frame.locator('#thumbnailView .thumbnail').first().isVisible(), `${name}: sidebar page navigation missing`);
      await page.screenshot({ path: path.join(output, `${name}-sidebar.png`) });
      assert(await frame.evaluate(() => foliokitReaderClosePanel()), 'Back adapter did not close sidebar');
      await frame.locator('#secondaryToolbarToggleButton').tap();
      const menu = await frame.locator('#secondaryToolbar').boundingBox();
      assert(menu && menu.height <= Math.min(320, geometry.height * .45) + 1, `${name}: More menu covers too much of document`);
      const rows = await frame.locator('#secondaryToolbar button:visible').evaluateAll(nodes => nodes.map(node => ({ id: node.id, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, textWidth: node.querySelector('span')?.getBoundingClientRect().width })));
      assert(rows.every(row => row.width >= 200 && row.height >= 44 && (row.textWidth === undefined || row.textWidth >= 100)), `${name}: More menu labels or rows are collapsed`);
      await page.screenshot({ path: path.join(output, `${name}-more.png`) });
      await frame.locator('#secondaryToolbarToggleButton').tap();
      await frame.locator('#editorHighlightButton').tap();
      await frame.waitForFunction(() => document.documentElement.dataset.foliokitMode === '9');
      assert.equal(await frame.locator('#editorHighlightParamsToolbar').isVisible(), false, 'Selecting highlight opens settings');
      await frame.locator('#foliokit-settings').tap();
      await frame.locator('#editorHighlightColorPicker button').nth(1).tap();
      await frame.locator('#editorHighlightParamsToolbar .foliokit-done').tap();
      assert.equal(await frame.evaluate(() => PDFViewerApplication.pdfViewer.annotationEditorMode), 9, 'Closing settings deactivates highlighting');
      assert.equal(await frame.locator('#editorHighlightParamsToolbar').isVisible(), false);
      const cdp = await context.newCDPSession(page);
      async function drag(x1, y1, x2, y2) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] });
        for (let step = 1; step <= 15; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * step / 15, y: y1 + (y2 - y1) * step / 15 }] });
          await page.waitForTimeout(16);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(250);
      }
      const text = await frame.locator('.textLayer span').first().boundingBox();
      await drag(text.x + 5, text.y + text.height / 2, Math.min(width - 15, text.x + text.width - 5), text.y + text.height / 2);
      await frame.locator('#foliokit-read').tap();
      assert.equal(await frame.evaluate(() => PDFViewerApplication.pdfDocument.annotationStorage.size), 1, `${name}: touch highlight was not created`);
      if (name === 'phone') {
        await frame.locator('#editorInkButton').tap();
        await frame.locator('#foliokit-settings').tap();
        await frame.evaluate(() => {
          const color = document.querySelector('#editorInkColor'); color.value = '#2244ff'; color.dispatchEvent(new Event('input', { bubbles: true }));
          const width = document.querySelector('#editorInkThickness'); width.value = '4'; width.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await frame.locator('#editorInkParamsToolbar .foliokit-done').tap();
        assert.equal(await frame.evaluate(() => PDFViewerApplication.pdfViewer.annotationEditorMode), 15);
        const area = await frame.locator('#viewerContainer').boundingBox();
        await drag(area.x + 60, area.y + 190, area.x + 260, area.y + 230);
        await frame.locator('#foliokit-read').tap();
        const serialized = await frame.evaluate(() => [...PDFViewerApplication.pdfDocument.annotationStorage.serializable.map.values()].map(a => ({ type: a.annotationType, color: a.color, thickness: a.thickness })));
        assert.equal(serialized.length, 2);
        assert.deepEqual(serialized.find(a => a.type === 15).color, [34, 68, 255]);
        assert.equal(serialized.find(a => a.type === 15).thickness, 4);
        await frame.locator('#foliokit-undo').tap();
        assert.equal(await frame.evaluate(() => [...PDFViewerApplication.pdfDocument.annotationStorage.serializable.map.values()].filter(a => !a.deleted).length), 1);
        await frame.locator('#secondaryToolbarToggleButton').tap();
        await frame.locator('#foliokit-redo').tap();
        await frame.locator('#secondaryToolbarToggleButton').tap();
        await frame.locator('#editorInkButton').tap();
        await frame.locator('.inkEditor').first().tap();
        await frame.locator('#foliokit-delete-selection').waitFor({ state: 'visible' });
        const deletion = await frame.locator('#foliokit-delete-selection').boundingBox();
        assert(deletion && deletion.width === 44 && deletion.height === 44, 'Delete selection is not compact');
        await frame.locator('#foliokit-delete-selection').tap();
        assert.equal(await frame.evaluate(() => [...PDFViewerApplication.pdfDocument.annotationStorage.serializable.map.values()].filter(a => !a.deleted).length), 1, 'Touch delete did not remove the selected mark');
        const toast = await frame.locator('#editorUndoBar').boundingBox();
        assert(toast && toast.height <= 110 && toast.x >= -1 && toast.x + toast.width <= width + 1, 'Deletion undo notice covers the document');
        await page.screenshot({ path: path.join(output, `${name}-delete.png`) });
        await frame.locator('#foliokit-undo').tap();
        await frame.locator('#foliokit-read').tap();
        // Real two-finger pinch uses PDF.js's existing touch manager.
        const initial = await frame.evaluate(() => PDFViewerApplication.pdfViewer.currentScale);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 140, y: 430 }, { x: 220, y: 430 }] });
        for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 140 - i * 5, y: 430 }, { x: 220 + i * 5, y: 430 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(300);
        assert(await frame.evaluate(start => PDFViewerApplication.pdfViewer.currentScale > start, initial), 'Pinch did not zoom');
        await frame.evaluate(() => { PDFViewerApplication.pdfViewer.currentScaleValue = 'page-width'; });
        const before = await frame.evaluate(() => document.querySelector('#viewerContainer').scrollTop);
        await drag(180, 570, 180, 330);
        assert(await frame.evaluate(previous => document.querySelector('#viewerContainer').scrollTop > previous + 30, before), 'Read mode did not scroll by touch');
        await frame.evaluate(() => { document.querySelector('#viewerContainer').scrollTop = 0; });
      }
      let saved;
      if (hosted) {
        const download = page.waitForEvent('download');
        await page.locator('.pdf-reader-filebar button').first().tap();
        saved = fs.readFileSync(await (await download).path());
      } else saved = Buffer.from(await frame.evaluate(async () => Array.from(await PDFViewerApplication.pdfDocument.saveDocument())));
      const reopened = await PDFDocument.load(saved);
      const annotations = reopened.getPage(0).node.Annots();
      assert(annotations && annotations.size() >= (name === 'phone' ? 2 : 1), `${name}: saved PDF lost annotations`);
      const entries = annotations.asArray().map(ref => reopened.context.lookup(ref));
      const highlight = entries.find(a => a.get(PDFName.of('Subtype')).toString() === '/Highlight' || a.get(PDFName.of('IT'))?.toString() === '/InkHighlight');
      assert(highlight, `${name}: saved highlighter appearance missing`);
      assert(highlight.get(PDFName.of('AP')), 'Highlight has no portable appearance');
      const savedColor = highlight.get(PDFName.of('C')).asArray().map(n => n.asNumber());
      assert(savedColor[1] > .9 && savedColor[0] < .6, 'Selected green highlight color was lost');
      if (name === 'phone') assert(entries.some(a => a.get(PDFName.of('Subtype')).toString() === '/Ink' && !a.get(PDFName.of('IT'))));
      fs.writeFileSync(path.join(output, `${name}-annotated.pdf`), saved);
      await page.screenshot({ path: path.join(output, `${name}.png`) });
      assert.deepEqual(errors, [], `${name}: JavaScript errors`);
      console.log(`${name}: 44px controls, compact viewport, persistent annotation mode, touch highlight and PDF export passed${name === 'phone' ? '; ink color/size, undo/redo, pinch and scrolling passed' : ''}.`);
      await context.close();
    }
    const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await desktop.goto(`${base}/pdfjs-viewer/viewer.html?file=/foliokit-touch-test.pdf`);
    await desktop.waitForFunction(() => window.PDFViewerApplication?.pdfDocument);
    assert.equal(await desktop.locator('html.foliokit-mobile').count(), 0);
    assert(await desktop.locator('#toolbarContainer').isVisible());
    console.log('Desktop: original toolbar retained.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exit(1); });
